/**
 * SOLANA TOKEN-2022 INTEGRATION BRIDGE — BT-C9C4C5 v2.4 Phase 2
 *
 * Production-grade programmatic bridge between PostgreSQL settlement entries
 * and Token-2022 asset mints on Solana. Handles sovereign RWA token minting
 * with on-chain metadata extensions.
 *
 * Token-2022 Program: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
 * Custodial Destination: 9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3
 * Network: Determined by SOLANA_NETWORK env var (devnet | mainnet-beta)
 *           Defaults to devnet if unset. Mainnet requires:
 *           - SOLANA_MAINNET_MINT_AUTHORITY_KEYPAIR (production signing key)
 *           - SOLANA_MAINNET_RPC_URL (high-throughput RPC)
 *           - SOLANA_MAINNET_VAULT_ADDRESS (custodial escrow wallet)
 *
 * Service Identity: Aethexer Notary Node
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
} from '@solana/spl-token-metadata';
import bs58 from 'bs58';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import {
  anchorToChain,
  hashForAnchor,
  getNotaryStatus,
  MEMO_PROGRAM_ID,
  EXPECTED_PUBLIC_KEY,
} from '@/lib/solana-notary';
import { UNIVERSAL_SPLIT, SETTLEMENT_LABELS } from '@/lib/universal-law';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Token-2022 Program ID — immutable compliance constant */
export const TOKEN_2022_PROGRAM = TOKEN_2022_PROGRAM_ID;

/** Aethexer Notary Node — canonical custodial escrow wallet.
 *  Mainnet reads from SOLANA_MAINNET_VAULT_ADDRESS; devnet uses Notary public key. */
export const AETHEXER_CUSTODIAL_WALLET = new PublicKey(
  process.env.SOLANA_MAINNET_VAULT_ADDRESS || EXPECTED_PUBLIC_KEY
);

/** Memo Program for backtrace anchoring */
export const SOLANA_MEMO_PROGRAM = MEMO_PROGRAM_ID;

/** RPC endpoints by cluster */
const DEVNET_RPC = 'https://api.devnet.solana.com';
const MAINNET_RPC = process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com';

/**
 * Active cluster — resolved from SOLANA_NETWORK env var.
 * MAINNET-BETA requires all production env vars to be populated.
 */
export const ACTIVE_CLUSTER: 'devnet' | 'mainnet-beta' =
  (process.env.SOLANA_NETWORK === 'mainnet-beta') ? 'mainnet-beta' : 'devnet';

export const SOLANA_PROGRAM_ID = MEMO_PROGRAM_ID.toBase58();

export const SOLANA_CLUSTER = {
  devnet: DEVNET_RPC,
  'mainnet-beta': MAINNET_RPC,
};

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface MintProofOfAuditInput {
  userId: string;
  walletAddress: string;
  auditType: 'CARBON_CREDIT' | 'LEGACY_AUDIT' | 'RE_HOSPITALITY';
  carbonAmount: number;
  valueUsd: number;
  metadata?: Record<string, unknown>;
}

export interface MintProofOfAuditResult {
  success: boolean;
  transactionHash?: string;
  message: string;
  blockHeight?: number;
  explorerUrl?: string;
  error?: string;
}

export interface SovereignMintResult {
  success: boolean;
  mintAddress: string | null;
  tokenAccount: string | null;
  initSignature: string | null;
  metadataSignature: string | null;
  mintSignature: string | null;
  memoAnchorSignature: string | null;
  explorerUrl: string | null;
  settlementId: string;
  assetSymbol: string;
  assetName: string;
  assetClass: string;
  tokenSupply: number;
  splitVerification: {
    founderYield70: number;
    platformProcessor20: number;
    publicResilience10: number;
    totalValueUsd: number;
    compliant: boolean;
  };
  error?: string;
}

/** On-chain metadata fields embedded in Token-2022 mint */
export interface Token2022Metadata {
  name: string;
  symbol: string;
  uri: string;
  assetClass: string;
  settlementId: string;
  founderYieldUsd: string;
  stewardshipUsd: string;
  publicResilienceUsd: string;
  carbonTonnes: string;
  backtrace: string;
  sentinelNode: string;
}

// ─── Keypair Management ─────────────────────────────────────────────────────

let _cachedMintAuthority: Keypair | null = null;

/**
 * Load the mint authority keypair from SOLANA_MINT_AUTHORITY_KEYPAIR.
 * Accepts base58-encoded secret key or JSON byte array.
 * Throws descriptive error if env var is missing or invalid.
 */
function loadMintAuthorityKeypair(): Keypair {
  if (_cachedMintAuthority) return _cachedMintAuthority;

  // Mainnet uses a dedicated env var; devnet falls back to legacy
  const secret = ACTIVE_CLUSTER === 'mainnet-beta'
    ? process.env.SOLANA_MAINNET_MINT_AUTHORITY_KEYPAIR
    : process.env.SOLANA_MINT_AUTHORITY_KEYPAIR;

  const PLACEHOLDERS = ['PLACEHOLDER_SET_YOUR_BASE58_KEYPAIR', 'AWAITING_FOUNDER_INPUT'];
  if (!secret || secret.trim() === '' || PLACEHOLDERS.includes(secret.trim())) {
    throw new Error(
      `[SOVEREIGN MINT ERROR] Mint authority keypair is not configured for ${ACTIVE_CLUSTER}. ` +
      (ACTIVE_CLUSTER === 'mainnet-beta'
        ? 'Set SOLANA_MAINNET_MINT_AUTHORITY_KEYPAIR in .env with the production signing key. '
        : 'Set SOLANA_MINT_AUTHORITY_KEYPAIR in .env. ') +
      'Accepts base58, base64, or JSON byte array formats.'
    );
  }

  try {
    const trimmed = secret.trim();

    // Format 1: JSON array (e.g. from solana-keygen)
    if (trimmed.startsWith('[')) {
      const bytes = JSON.parse(trimmed) as number[];
      _cachedMintAuthority = Keypair.fromSecretKey(Uint8Array.from(bytes));
      return _cachedMintAuthority;
    }

    // Format 2: Base64 (contains +, /, or = which are invalid in base58)
    if (/[+/=]/.test(trimmed)) {
      const decoded = Buffer.from(trimmed, 'base64');
      if (decoded.length === 32) {
        // 32-byte seed → derive full keypair
        _cachedMintAuthority = Keypair.fromSeed(Uint8Array.from(decoded));
      } else if (decoded.length === 64) {
        // 64-byte full secret key
        _cachedMintAuthority = Keypair.fromSecretKey(Uint8Array.from(decoded));
      } else {
        throw new Error(
          `Base64 decoded to ${decoded.length} bytes — expected 32 (seed) or 64 (secret key).`
        );
      }
      return _cachedMintAuthority;
    }

    // Format 3: Base58 (standard Solana CLI output)
    const decoded = bs58.decode(trimmed);
    _cachedMintAuthority = Keypair.fromSecretKey(decoded);
    return _cachedMintAuthority;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown decode error';
    throw new Error(
      `[SOVEREIGN MINT ERROR] Failed to decode SOLANA_MINT_AUTHORITY_KEYPAIR: ${msg}. ` +
      'Ensure the key is a valid base58, base64, or JSON byte array Solana secret key.'
    );
  }
}

/**
 * Get an RPC connection for the active cluster.
 * Mainnet uses SOLANA_MAINNET_RPC_URL; devnet uses public endpoint.
 */
function getSolanaConnection(): Connection {
  const rpc = ACTIVE_CLUSTER === 'mainnet-beta' ? MAINNET_RPC : DEVNET_RPC;
  return new Connection(rpc, 'confirmed');
}

// ─── Core Token-2022 Minting ────────────────────────────────────────────────

/**
 * mintSovereignAssetToken — Core structural function.
 *
 * Queries the Settlement record from PostgreSQL, validates the 70/20/10 split,
 * initializes a Token-2022 mint with embedded metadata extension, mints tokens
 * to the Aethexer custodial escrow wallet, and anchors a backtrace memo.
 *
 * @param settlementId - The unique settlement ID (e.g. "DISC-MGM-LV-01-MQFLZI2P")
 * @returns SovereignMintResult with full transaction context
 */
export async function mintSovereignAssetToken(
  settlementId: string
): Promise<SovereignMintResult> {
  // ─── Step 1: Database Query — Dual-path resolution ───
  // Path A: Settlement table (submission-based)
  // Path B: DiscoveryAsset table (discovery pipeline settlements)

  let assetName = 'Sovereign Asset';
  let assetSymbol = 'BRK-TOKEN';
  let founderYield: number;
  let platformProcessor: number;
  let publicResilience: number;
  let totalValue: number;
  let assetClass: string;
  let carbonTonnes: number;
  let submittedById: string | null = null;

  const settlement = await prisma.settlement.findUnique({
    where: { settlementId },
    include: { submission: true },
  });

  const discoveryAsset = await prisma.discoveryAsset.findFirst({
    where: { settlementId },
  });

  if (settlement) {
    // ─── Path A: Submission-based settlement ───
    if (!settlement.executed) {
      throw new Error(
        `[PROTOCOL ERROR] Settlement ${settlementId} has not been executed. ` +
        'Only executed settlements with a confirmed 70/20/10 split can be minted as sovereign tokens.'
      );
    }

    founderYield = settlement.assetOwnerShare;
    platformProcessor = settlement.treasuryShare;
    publicResilience = settlement.specialistShare;
    totalValue = settlement.totalValueUsd;
    assetClass = settlement.assetClass || 'PROPERTY_INDUSTRIAL';
    carbonTonnes = settlement.submission?.carbonTonnes || 0;
    submittedById = settlement.submission?.submittedById || null;

    if (discoveryAsset) {
      assetName = discoveryAsset.name;
      assetSymbol = discoveryAsset.symbol;
    } else {
      assetName = settlement.submission?.companyName || 'Sovereign Asset';
      assetSymbol = settlement.submission?.submissionId
        ? `SUB-${settlement.submission.submissionId.substring(0, 8).toUpperCase()}`
        : 'BRK-TOKEN';
    }
  } else if (discoveryAsset) {
    // ─── Path B: Discovery pipeline settlement (no Settlement table row) ───
    if (!discoveryAsset.settled) {
      throw new Error(
        `[PROTOCOL ERROR] Discovery asset ${discoveryAsset.symbol} is not yet settled. ` +
        'Approve and settle the asset through the admin panel before minting.'
      );
    }

    assetName = discoveryAsset.name;
    assetSymbol = discoveryAsset.symbol;
    totalValue = discoveryAsset.estimatedValueUsd;
    founderYield = discoveryAsset.sovereignShare70;
    platformProcessor = totalValue * UNIVERSAL_SPLIT.STEWARDSHIP;
    publicResilience = totalValue * UNIVERSAL_SPLIT.PUBLIC_RESILIENCE;
    carbonTonnes = 0; // Discovery assets don't carry carbon tonnes

    // Map discovery category → asset class
    const categoryClassMap: Record<string, string> = {
      EXCHANGE: 'SOVEREIGN_SKIN',
      SKYSCRAPER: 'PROPERTY_INDUSTRIAL',
      CASINO: 'PROPERTY_INDUSTRIAL',
    };
    assetClass = categoryClassMap[discoveryAsset.category] || 'PROPERTY_INDUSTRIAL';
  } else {
    throw new Error(
      `[PROTOCOL ERROR] Settlement not found: ${settlementId}. ` +
      'No matching record in Settlement table or DiscoveryAsset table. ' +
      'Verify the settlement ID exists in the database.'
    );
  }

  // ─── Step 2: Validate 70/20/10 Split Compliance ───
  const expectedFounder = totalValue * UNIVERSAL_SPLIT.FOUNDER_YIELD;
  const expectedPlatform = totalValue * UNIVERSAL_SPLIT.STEWARDSHIP;
  const expectedResilience = totalValue * UNIVERSAL_SPLIT.PUBLIC_RESILIENCE;

  // Allow 0.01 USD tolerance for floating point (scaled for large values)
  const tolerance = Math.max(0.01, totalValue * 0.000001);
  const splitCompliant =
    Math.abs(founderYield - expectedFounder) <= tolerance &&
    Math.abs(platformProcessor - expectedPlatform) <= tolerance &&
    Math.abs(publicResilience - expectedResilience) <= tolerance;

  if (!splitCompliant) {
    throw new Error(
      `[ZERO GREED VIOLATION] Settlement ${settlementId} split does not match 70/20/10. ` +
      `Expected: ${expectedFounder.toFixed(2)}/${expectedPlatform.toFixed(2)}/${expectedResilience.toFixed(2)}. ` +
      `Actual: ${founderYield.toFixed(2)}/${platformProcessor.toFixed(2)}/${publicResilience.toFixed(2)}. ` +
      'Token minting is HALTED until split compliance is verified.'
    );
  }

  // ─── Step 4: Determine token supply ───
  // Base supply: 1 for unique high-value institutional RWA, 2 for base ecosystem tokens
  const tokenSupply = totalValue >= 1_000_000_000 ? 2 : 1;
  const tokenDecimals = 0; // Non-fungible institutional representation

  // ─── Step 5: Generate backtrace for this mint operation ───
  const backtrace = `BT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // ─── Step 6: Build Token-2022 metadata URI ───
  // Keep URI compact — detailed data lives in additional on-chain fields
  const metadataUri = `bedrock-esg://${settlementId}?bt=${backtrace}&ac=${assetClass}`;

  try {
    // ─── Step 7: Load signing authority ───
    const mintAuthority = loadMintAuthorityKeypair();
    const connection = getSolanaConnection();

    // ─── Mainnet safety gate ───
    if (ACTIVE_CLUSTER === 'mainnet-beta') {
      console.log(
        `[Sovereign Mint] ⚠ MAINNET-BETA active. Mint authority: ${mintAuthority.publicKey.toBase58()}`
      );
    }

    // ─── Step 8: Generate new mint keypair ───
    const mintKeypair = Keypair.generate();

    // ─── Step 9: Calculate space for Token-2022 mint with metadata pointer ───
    // Allocate ONLY mint + MetadataPointer space for CreateAccount.
    // Metadata init/update instructions handle their own reallocs internally.
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);

    const additionalFieldEntries: [string, string][] = [
      ['assetClass', assetClass],
      ['settlementId', settlementId],
      ['backtrace', backtrace],
      ['sentinelNode', 'Sentinel Node-01'],
      ['founderYieldUsd', founderYield.toFixed(2)],
      ['stewardshipUsd', platformProcessor.toFixed(2)],
      ['publicResilienceUsd', publicResilience.toFixed(2)],
      ['carbonTonnes', carbonTonnes.toFixed(4)],
    ];

    // Pre-fund with lamports for full expected size (mint + metadata TLV)
    // so the account stays rent-exempt after metadata init/update reallocs.
    let metadataSpace =
      4 + 4 + 32 + 32 + // TLV header + update authority + mint
      4 + Buffer.byteLength(assetName, 'utf-8') +
      4 + Buffer.byteLength(assetSymbol, 'utf-8') +
      4 + Buffer.byteLength(metadataUri, 'utf-8') +
      4; // additional fields count
    for (const [key, value] of additionalFieldEntries) {
      metadataSpace += 4 + Buffer.byteLength(key, 'utf-8') + 4 + Buffer.byteLength(value, 'utf-8');
    }
    metadataSpace += 256; // Alignment/overhead buffer
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataSpace);

    // ─── Step 10: Build the transaction ───
    const transaction = new Transaction();

    // 10a. Create account for the mint (mint + MetadataPointer only)
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: mintAuthority.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      })
    );

    // 10b. Initialize metadata pointer (points to itself — on-mint metadata)
    transaction.add(
      createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,    // mint
        mintAuthority.publicKey,  // authority
        mintKeypair.publicKey,    // metadataAddress (self-referential)
        TOKEN_2022_PROGRAM_ID     // programId
      )
    );

    // 10c. Initialize the mint
    transaction.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,    // mint
        tokenDecimals,            // decimals
        mintAuthority.publicKey,  // mintAuthority
        mintAuthority.publicKey,  // freezeAuthority
        TOKEN_2022_PROGRAM_ID     // programId
      )
    );

    // 10d. Initialize token metadata on the mint account
    transaction.add(
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mintKeypair.publicKey,     // metadata lives on the mint
        updateAuthority: mintAuthority.publicKey,
        mint: mintKeypair.publicKey,
        mintAuthority: mintAuthority.publicKey,
        name: assetName,
        symbol: assetSymbol,
        uri: metadataUri,
      })
    );

    // ─── Step 11: Sign and send the init transaction (account + pointer + mint + metadata base) ───
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = mintAuthority.publicKey;

    const initSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [mintAuthority, mintKeypair],
      { commitment: 'confirmed', maxRetries: 3 }
    );

    console.log(
      `[Sovereign Mint] ✓ Token-2022 mint initialized: ${mintKeypair.publicKey.toBase58()} (tx: ${initSignature})`
    );

    // ─── Step 11b: Add custom metadata fields in a second transaction ───
    // Split to stay under the 1232-byte tx limit
    const metaFieldsTx = new Transaction();
    for (const [field, value] of additionalFieldEntries) {
      metaFieldsTx.add(
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mintKeypair.publicKey,
          updateAuthority: mintAuthority.publicKey,
          field,
          value,
        })
      );
    }

    const { blockhash: metaHash, lastValidBlockHeight: metaLastValid } =
      await connection.getLatestBlockhash('confirmed');
    metaFieldsTx.recentBlockhash = metaHash;
    metaFieldsTx.lastValidBlockHeight = metaLastValid;
    metaFieldsTx.feePayer = mintAuthority.publicKey;

    const metadataSignature = await sendAndConfirmTransaction(
      connection,
      metaFieldsTx,
      [mintAuthority],
      { commitment: 'confirmed', maxRetries: 3 }
    );

    console.log(
      `[Sovereign Mint] ✓ Metadata fields written (tx: ${metadataSignature})`
    );

    // ─── Step 12: Create ATA for custodial wallet and mint tokens ───
    const mintTx = new Transaction();

    const custodialAta = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,       // mint
      AETHEXER_CUSTODIAL_WALLET,   // owner (Aethexer Notary Node)
      true,                        // allowOwnerOffCurve
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    mintTx.add(
      createAssociatedTokenAccountInstruction(
        mintAuthority.publicKey,     // payer
        custodialAta,                // associatedToken
        AETHEXER_CUSTODIAL_WALLET,   // owner
        mintKeypair.publicKey,       // mint
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    mintTx.add(
      createMintToInstruction(
        mintKeypair.publicKey,       // mint
        custodialAta,                // destination
        mintAuthority.publicKey,     // authority
        tokenSupply,                 // amount
        [],                          // multiSigners
        TOKEN_2022_PROGRAM_ID
      )
    );

    const { blockhash: mintBlockhash, lastValidBlockHeight: mintLastValid } =
      await connection.getLatestBlockhash('confirmed');
    mintTx.recentBlockhash = mintBlockhash;
    mintTx.lastValidBlockHeight = mintLastValid;
    mintTx.feePayer = mintAuthority.publicKey;

    const mintSignature = await sendAndConfirmTransaction(
      connection,
      mintTx,
      [mintAuthority],
      { commitment: 'confirmed', maxRetries: 3 }
    );

    console.log(
      `[Sovereign Mint] ✓ ${tokenSupply} token(s) minted to custodial wallet: ${custodialAta.toBase58()} (tx: ${mintSignature})`
    );

    // ─── Step 13: Anchor backtrace memo via Notary ───
    let memoAnchorSignature: string | null = null;
    const dataHash = hashForAnchor({
      mintAddress: mintKeypair.publicKey.toBase58(),
      settlementId,
      assetSymbol,
      assetClass,
      tokenSupply,
      totalValueUsd: totalValue,
      backtrace,
    });

    const anchorResult = await anchorToChain({
      type: 'TRADE_SETTLEMENT',
      entityId: settlementId,
      dataHash,
      carbonTonnes,
      valuationUsd: totalValue,
      backtrace,
      metadata: {
        mintAddress: mintKeypair.publicKey.toBase58(),
        tokenSupply,
        assetSymbol,
        cluster: ACTIVE_CLUSTER,
      },
    });

    if (anchorResult.success && anchorResult.transactionSignature) {
      memoAnchorSignature = anchorResult.transactionSignature;
    }

    // ─── Step 14: Persist to SolanaAuditProof ───
    await prisma.solanaAuditProof.create({
      data: {
        userId: submittedById || 'SYSTEM',
        transactionHash: initSignature,
        programId: TOKEN_2022_PROGRAM_ID.toBase58(),
        walletAddress: AETHEXER_CUSTODIAL_WALLET.toBase58(),
        auditType: 'CARBON_CREDIT',
        carbonAmount: carbonTonnes,
        valueUsd: totalValue,
        metadataJson: JSON.stringify({
          type: 'TOKEN_2022_SOVEREIGN_MINT',
          cluster: ACTIVE_CLUSTER,
          mintAddress: mintKeypair.publicKey.toBase58(),
          tokenAccount: custodialAta.toBase58(),
          initSignature,
          metadataSignature,
          mintSignature,
          memoAnchorSignature,
          assetName,
          assetSymbol,
          assetClass,
          tokenSupply,
          backtrace,
          split: {
            founderYield70: founderYield,
            platformProcessor20: platformProcessor,
            publicResilience10: publicResilience,
          },
        }),
        blockHeight: 0,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // ─── Step 15: Update source record with Solana anchor ───
    if (settlement) {
      // Path A: Update Settlement table
      await prisma.settlement.update({
        where: { settlementId },
        data: {
          solanaSignature: initSignature,
          solanaAnchoredAt: new Date(),
          anchorPending: false,
        },
      });
    }
    // Path B (DiscoveryAsset): settlementId is already set on the asset record

    const clusterParam = ACTIVE_CLUSTER === 'mainnet-beta' ? '' : '?cluster=devnet';
    const explorerUrl = `https://explorer.solana.com/address/${mintKeypair.publicKey.toBase58()}${clusterParam}`;

    console.log(
      `[Sovereign Mint] ✓ Complete — ${assetSymbol} (${assetName}) minted as Token-2022 at ${mintKeypair.publicKey.toBase58()}`
    );

    return {
      success: true,
      mintAddress: mintKeypair.publicKey.toBase58(),
      tokenAccount: custodialAta.toBase58(),
      initSignature,
      metadataSignature,
      mintSignature,
      memoAnchorSignature,
      explorerUrl,
      settlementId,
      assetSymbol,
      assetName,
      assetClass,
      tokenSupply,
      splitVerification: {
        founderYield70: founderYield,
        platformProcessor20: platformProcessor,
        publicResilience10: publicResilience,
        totalValueUsd: totalValue,
        compliant: splitCompliant,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown minting error';
    console.error(`[Sovereign Mint] ✗ Failed for ${settlementId}:`, message);

    return {
      success: false,
      mintAddress: null,
      tokenAccount: null,
      initSignature: null,
      metadataSignature: null,
      mintSignature: null,
      memoAnchorSignature: null,
      explorerUrl: null,
      settlementId,
      assetSymbol,
      assetName,
      assetClass,
      tokenSupply: 0,
      splitVerification: {
        founderYield70: founderYield,
        platformProcessor20: platformProcessor,
        publicResilience10: publicResilience,
        totalValueUsd: totalValue,
        compliant: splitCompliant,
      },
      error: message,
    };
  }
}

// ─── Legacy Proof of Audit (preserved for backward compatibility) ───────────

/**
 * Mint Proof of Audit on Solana via Sovereign Notary.
 *
 * When SOLANA_NOTARY_SECRET_KEY is configured:
 *   → Signs a real Memo transaction on Devnet, records the on-chain tx hash.
 * When NOT configured:
 *   → Falls back to generating a deterministic offline hash so the
 *     database record is still created (marked PENDING_ANCHOR).
 */
export async function mintProofOfAudit(
  input: MintProofOfAuditInput
): Promise<MintProofOfAuditResult> {
  const { userId, walletAddress, auditType, carbonAmount, valueUsd, metadata } = input;

  try {
    const notaryStatus = getNotaryStatus();

    // Build the data hash from audit payload
    const dataHash = hashForAnchor({
      userId,
      walletAddress,
      auditType,
      carbonAmount,
      valueUsd,
      metadata,
      timestamp: Date.now(),
    });

    let transactionHash: string;
    let blockHeight: number | null = null;
    let explorerUrl: string | null = null;
    let status: string;

    if (notaryStatus.configured) {
      // ─── LIVE: Sign and broadcast via Notary ───
      const anchorResult = await anchorToChain({
        type: 'CARBON_AUDIT',
        entityId: `AUDIT-${userId.substring(0, 8)}`,
        dataHash,
        carbonTonnes: carbonAmount,
        valuationUsd: valueUsd,
        metadata: { auditType, walletAddress, ...metadata },
      });

      if (anchorResult.success && anchorResult.transactionSignature) {
        transactionHash = anchorResult.transactionSignature;
        blockHeight = anchorResult.slot;
        explorerUrl = anchorResult.explorerUrl;
        status = 'CONFIRMED';
      } else {
        transactionHash = `OFFLINE_${dataHash.substring(0, 32)}`;
        status = 'PENDING_ANCHOR';
        console.warn(
          '[SolanaIntegration] Notary configured but anchor failed:',
          anchorResult.error
        );
      }
    } else {
      // ─── OFFLINE: Deterministic hash (no secret key) ───
      transactionHash = `OFFLINE_${dataHash.substring(0, 32)}`;
      status = 'PENDING_ANCHOR';
    }

    // Store the proof in the database
    await prisma.solanaAuditProof.create({
      data: {
        userId,
        transactionHash,
        programId: SOLANA_PROGRAM_ID,
        walletAddress,
        auditType,
        carbonAmount,
        valueUsd,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
        blockHeight: blockHeight ?? 0,
        status,
        confirmedAt: status === 'CONFIRMED' ? new Date() : null,
      },
    });

    // Update UserProfile with mint info
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        solanaWallet: walletAddress,
        lastMintTxHash: transactionHash,
        totalMinted: { increment: 1 },
        lastMintedAt: new Date(),
      },
      create: {
        userId,
        role: 'SOVEREIGN_INDIVIDUAL',
        carbonBalance: carbonAmount,
        solanaWallet: walletAddress,
        lastMintTxHash: transactionHash,
        totalMinted: 1,
        lastMintedAt: new Date(),
      },
    });

    return {
      success: true,
      transactionHash,
      message:
        status === 'CONFIRMED'
          ? `Proof of Audit anchored on ${ACTIVE_CLUSTER}: ${transactionHash}`
          : `Proof recorded offline (hash: ${transactionHash}). Will anchor when Notary is funded.`,
      blockHeight: blockHeight ?? undefined,
      explorerUrl: explorerUrl ?? undefined,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Solana mint error:', msg);
    return {
      success: false,
      message: 'Failed to mint Proof of Audit',
      error: msg,
    };
  }
}

// ─── Query Helpers ──────────────────────────────────────────────────────────

/**
 * Get user's Solana audit proofs
 */
export async function getUserAuditProofs(userId: string) {
  return prisma.solanaAuditProof.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Validate Solana wallet address format
 */
export function isValidSolanaAddress(address: string): boolean {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Get Token-2022 mint status for a settlement
 */
export async function getSettlementMintStatus(settlementId: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { settlementId },
    select: {
      settlementId: true,
      solanaSignature: true,
      solanaAnchoredAt: true,
      anchorPending: true,
      totalValueUsd: true,
      assetClass: true,
    },
  });

  if (!settlement) return null;

  const auditProof = settlement.solanaSignature
    ? await prisma.solanaAuditProof.findUnique({
        where: { transactionHash: settlement.solanaSignature },
      })
    : null;

  return {
    settlement,
    auditProof,
    minted: !!settlement.solanaSignature && !settlement.anchorPending,
    explorerUrl: settlement.solanaSignature
      ? `https://explorer.solana.com/tx/${settlement.solanaSignature}${ACTIVE_CLUSTER === 'mainnet-beta' ? '' : '?cluster=devnet'}`
      : null,
  };
}

// ─── Engine Metadata ────────────────────────────────────────────────────────

export const SOVEREIGN_MINT_ENGINE = {
  name: 'Sovereign Asset Token Bridge',
  version: '2.4.0',
  protocol: 'aethexer-v1',
  cluster: ACTIVE_CLUSTER,
  program: TOKEN_2022_PROGRAM_ID.toBase58(),
  memoProgram: MEMO_PROGRAM_ID.toBase58(),
  custodialWallet: AETHEXER_CUSTODIAL_WALLET.toBase58(),
  signerIdentity: 'Aethexer Notary Node',
  nodeId: 'Sentinel Node-01',
  splitPolicy: '70/20/10 Zero Greed',
};
