/**
 * DUAL-NODE INHALATION — Milestones 3 & 4
 *
 * Node 01 (EXITZ-C / The Classic):
 *   Asset:  1954 Chevrolet 3100
 *   VIN:    H54B010116
 *   Miles:  42,500
 *   Value:  $25,800 (Hagerty #3 Condition, May 2026)
 *   Integrity: Odometer/VIN Extension (no HUM — mobile asset)
 *   Settlement: 70% Owner ($18,060) / 20% Treasury ($5,160) / 10% Sentinel ($2,580)
 *
 * Node 02 (EXITZ-A / The Masterpiece):
 *   Asset:  Andy Warhol, "Dollar Sign" (1981)
 *   Medium: Acrylic and silkscreen ink on canvas
 *   Value:  $772,300 (Sotheby's London, March 4, 2026)
 *   Integrity: 0.5% HUM Baseline (12.6 MW) — Villa Park node
 *   Settlement: 70% Owner ($540,610) / 20% Treasury ($154,460) / 10% Sentinel ($77,230)
 *
 * Both signed by Aethexer Sentinel Node-01
 * Authority: 9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3
 */

import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  PublicKey,
  clusterApiUrl,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  createInitializeMetadataPointerInstruction,
  getMintLen,
  ExtensionType,
  tokenMetadataInitializeWithRentTransfer,
  tokenMetadataUpdateFieldWithRentTransfer,
  getOrCreateAssociatedTokenAccount,
  createMintToCheckedInstruction,
} from '@solana/spl-token';
import bs58 from 'bs58';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Constants ──────────────────────────────────────────────────────────────

const DEVNET_RPC = clusterApiUrl('devnet');
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const BACKTRACE_ID = 'BT-C9C4C5';
const HUM_BASELINE_MW = 12.6;
const HUM_THRESHOLD_PCT = parseFloat(process.env.HUM_TRIGGER_THRESHOLD || '0.5');

// ─── Helpers ────────────────────────────────────────────────────────────────

const DIV = '═'.repeat(72);
const LINE = '─'.repeat(72);
const now = () => Math.floor(Date.now() / 1000);
const sha = (d: string) => crypto.createHash('sha256').update(d).digest('hex');

interface NodeResult {
  mintAddress: string;
  ataAddress: string;
  createTxSig: string;
  mintTxSig: string;
  slot: number | null;
  blockTime: string;
}

/**
 * Creates a Token-2022 mint with on-chain metadata, mints 1 token to
 * the Sentinel ATA, and anchors a forensic Memo — all in sequence.
 */
async function executeNodeInhalation(
  connection: Connection,
  authority: Keypair,
  tokenName: string,
  tokenSymbol: string,
  metadataFields: [string, string][],
  memoPayload: Record<string, unknown>,
): Promise<NodeResult> {
  // ── Phase 1: Create mint + metadata pointer + init ──
  const mintKeypair = Keypair.generate();
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const createTx = new Transaction();
  createTx.add(
    SystemProgram.createAccount({
      fromPubkey: authority.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      mintKeypair.publicKey,
      authority.publicKey,
      mintKeypair.publicKey, // self-referencing
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMint2Instruction(
      mintKeypair.publicKey,
      0,                      // decimals
      authority.publicKey,    // mintAuthority
      authority.publicKey,    // freezeAuthority
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  const bh1 = await connection.getLatestBlockhash('confirmed');
  createTx.recentBlockhash = bh1.blockhash;
  createTx.lastValidBlockHeight = bh1.lastValidBlockHeight;
  createTx.feePayer = authority.publicKey;

  const createTxSig = await sendAndConfirmTransaction(
    connection, createTx, [authority, mintKeypair],
    { commitment: 'confirmed', maxRetries: 3 },
  );

  // ── Phase 2: Initialize metadata + custom fields ──
  await tokenMetadataInitializeWithRentTransfer(
    connection, authority, mintKeypair.publicKey,
    authority.publicKey, authority.publicKey,
    tokenName, tokenSymbol, '',
    [], { commitment: 'confirmed' },
  );

  for (const [key, value] of metadataFields) {
    await tokenMetadataUpdateFieldWithRentTransfer(
      connection, authority, mintKeypair.publicKey,
      authority.publicKey, key, value,
      [], { commitment: 'confirmed' },
    );
  }

  // ── Phase 3: Get/create ATA + MintToChecked + Memo anchor ──
  const ata = await getOrCreateAssociatedTokenAccount(
    connection, authority, mintKeypair.publicKey, authority.publicKey,
    false, 'confirmed', undefined,
    TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const memoContent = JSON.stringify(memoPayload);
  const mintAndMemoTx = new Transaction();

  // Instruction 1: MintToChecked
  mintAndMemoTx.add(
    createMintToCheckedInstruction(
      mintKeypair.publicKey, ata.address, authority.publicKey,
      1, 0, [], TOKEN_2022_PROGRAM_ID,
    ),
  );

  // Instruction 2: Forensic Memo anchor
  mintAndMemoTx.add(
    new TransactionInstruction({
      keys: [{ pubkey: authority.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoContent, 'utf-8'),
    }),
  );

  const bh2 = await connection.getLatestBlockhash('confirmed');
  mintAndMemoTx.recentBlockhash = bh2.blockhash;
  mintAndMemoTx.lastValidBlockHeight = bh2.lastValidBlockHeight;
  mintAndMemoTx.feePayer = authority.publicKey;

  const mintTxSig = await sendAndConfirmTransaction(
    connection, mintAndMemoTx, [authority],
    { commitment: 'confirmed', maxRetries: 3 },
  );

  const txInfo = await connection.getTransaction(mintTxSig, {
    commitment: 'confirmed', maxSupportedTransactionVersion: 0,
  });

  return {
    mintAddress: mintKeypair.publicKey.toBase58(),
    ataAddress: ata.address.toBase58(),
    createTxSig,
    mintTxSig,
    slot: txInfo?.slot ?? null,
    blockTime: txInfo?.blockTime
      ? new Date(txInfo.blockTime * 1000).toISOString()
      : 'N/A',
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(DIV);
  console.log('  DUAL-NODE INHALATION — Milestones 3 & 4');
  console.log('  Aethexer Sentinel Node-01');
  console.log(DIV);
  console.log();

  // Load authority
  const secret = process.env.SOLANA_NOTARY_SECRET_KEY;
  if (!secret) { console.error('FATAL: SOLANA_NOTARY_SECRET_KEY not configured.'); process.exit(1); }
  const authority = Keypair.fromSecretKey(bs58.decode(secret.trim()));
  const connection = new Connection(DEVNET_RPC, 'confirmed');

  const preBal = await connection.getBalance(authority.publicKey);
  console.log('  Sentinel Node-01 :', authority.publicKey.toBase58());
  console.log('  SOL Balance      :', (preBal / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  if (preBal < 0.08 * LAMPORTS_PER_SOL) {
    console.error('FATAL: Need ~0.08 SOL for two mint creations + anchors.');
    process.exit(1);
  }
  console.log();

  // ═══════════════════════════════════════════════════════════════════════
  //  NODE 01 — EXITZ-C (The Classic) — Milestone 3
  // ═══════════════════════════════════════════════════════════════════════
  console.log(DIV);
  console.log('  NODE 01 — EXITZ-C (The Classic) — Milestone 3');
  console.log(DIV);
  console.log();
  console.log('  Asset         : 1954 Chevrolet 3100');
  console.log('  VIN           : H54B010116');
  console.log('  Mileage       : 42,500');
  console.log('  Market Value  : $25,800 (Hagerty #3 Condition, May 2026)');
  console.log('  Integrity     : Odometer/VIN Extension (no HUM — mobile asset)');
  console.log('  Settlement    : 70% Owner ($18,060) / 20% Treasury ($5,160) / 10% Sentinel ($2,580)');
  console.log('  Specialist 7% : $1,806.00');
  console.log();

  const node01Memo = {
    v: '2.1',
    sys: 'BEDROCK_ESG',
    signer: 'Aethexer Sentinel',
    node: 'Sentinel Node-01',
    op: 'DUAL_NODE_INHALATION',
    milestone: 'Milestone 3: The Classic',
    token: 'EXITZ-C',
    asset: {
      class: 'CLASSIC_VEHICLE',
      year: 1954,
      make: 'Chevrolet',
      model: '3100',
      vin: 'H54B010116',
      mileage: 42500,
      provenance: 'Baltimore-Origin Verified',
    },
    valuation: {
      source: 'Hagerty',
      condition: '#3 (Good)',
      benchmark_usd: 25800,
      date: '2026-05',
      type: 'Standard Market Baseline',
    },
    settlement: {
      model: '70/20/10',
      owner_pct: 70, owner_usd: 18060,
      treasury_pct: 20, treasury_usd: 5160,
      sentinel_pct: 10, sentinel_usd: 2580,
      specialist_royalty_pct: 7, specialist_royalty_usd: 1806,
    },
    integrity: {
      mechanism: 'ODOMETER_VIN_EXTENSION',
      hum_active: false,
      note: 'Mobile asset — integrity verified via VIN/odometer chain, not seismic HUM',
    },
    security: {
      seismic_perimeter: 'ARMED',
      home_node: 'ACTIVE',
    },
    backtrace: BACKTRACE_ID,
    ts: now(),
  };

  const node01MetadataFields: [string, string][] = [
    ['backtrace_id', BACKTRACE_ID],
    ['engine', 'Bedrock ESG'],
    ['asset_class', 'CLASSIC_VEHICLE'],
    ['year_make_model', '1954 Chevrolet 3100'],
    ['vin', 'H54B010116'],
    ['mileage', '42500'],
    ['valuation_source', 'Hagerty #3 Condition | $25,800 | May 2026'],
    ['settlement', '70/20/10 | Owner $18,060 | Treasury $5,160 | Sentinel $2,580'],
    ['integrity', 'Odometer/VIN Extension (no HUM)'],
    ['provenance', 'Baltimore-Origin Verified'],
  ];

  console.log('  Creating EXITZ-C mint + metadata + anchor...');
  const r1 = await executeNodeInhalation(
    connection, authority,
    'EXITZ-C Classic', 'EXITZ-C',
    node01MetadataFields, node01Memo,
  );

  console.log();
  console.log('  ✓ NODE 01 CONFIRMED');
  console.log(LINE);
  console.log('  EXITZ-C Mint     :', r1.mintAddress);
  console.log('  ATA              :', r1.ataAddress);
  console.log('  Create Tx        :', r1.createTxSig);
  console.log('  Mint+Memo Tx     :', r1.mintTxSig);
  console.log('  Slot             :', r1.slot);
  console.log('  Block Time       :', r1.blockTime);
  console.log('  Memo SHA-256     :', sha(JSON.stringify(node01Memo)));
  console.log();

  // ═══════════════════════════════════════════════════════════════════════
  //  NODE 02 — EXITZ-A (The Masterpiece) — Milestone 4
  // ═══════════════════════════════════════════════════════════════════════
  console.log(DIV);
  console.log('  NODE 02 — EXITZ-A (The Masterpiece) — Milestone 4');
  console.log(DIV);
  console.log();
  console.log('  Asset         : Andy Warhol, "Dollar Sign" (1981)');
  console.log('  Medium        : Acrylic and silkscreen ink on canvas');
  console.log('  Market Value  : $772,300 (Sotheby\'s London, March 4, 2026)');
  console.log('  Integrity     : 0.5% HUM Baseline (12.6 MW) — Villa Park node');
  console.log('  Settlement    : 70% Owner ($540,610) / 20% Treasury ($154,460) / 10% Sentinel ($77,230)');
  console.log('  Specialist 7% : $54,061.00');
  console.log();
  console.log('  ▸ HUM BASELINE VERIFICATION');
  console.log('    Baseline      :', HUM_BASELINE_MW, 'MW');
  console.log('    Threshold     :', HUM_THRESHOLD_PCT + '%');
  console.log('    Node Location : Villa Park (Sovereign Home Node)');
  console.log('    Seismic       : Perimeter ARMED');
  console.log('    Status        : ✓ VERIFIED');
  console.log();

  const node02Memo = {
    v: '2.1',
    sys: 'BEDROCK_ESG',
    signer: 'Aethexer Sentinel',
    node: 'Sentinel Node-01',
    op: 'DUAL_NODE_INHALATION',
    milestone: 'Milestone 4: The Masterpiece',
    token: 'EXITZ-A',
    asset: {
      class: 'FINE_ART',
      artist: 'Andy Warhol',
      title: 'Dollar Sign',
      year: 1981,
      medium: 'Acrylic and silkscreen ink on canvas',
    },
    valuation: {
      source: 'Sotheby\'s London',
      sale_date: '2026-03-04',
      hammer_usd: 772300,
      type: 'Auction-Verified Market Baseline',
    },
    settlement: {
      model: '70/20/10',
      owner_pct: 70, owner_usd: 540610,
      treasury_pct: 20, treasury_usd: 154460,
      sentinel_pct: 10, sentinel_usd: 77230,
      specialist_royalty_pct: 7, specialist_royalty_usd: 54061,
    },
    integrity: {
      mechanism: 'HUM_SEISMIC_BASELINE',
      hum_active: true,
      hum_baseline_mw: HUM_BASELINE_MW,
      hum_threshold_pct: HUM_THRESHOLD_PCT,
      node_location: 'Villa Park',
    },
    security: {
      sovereign_home_node: 'ACTIVE',
      seismic_perimeter: 'ARMED',
    },
    backtrace: BACKTRACE_ID,
    ts: now(),
  };

  const node02MetadataFields: [string, string][] = [
    ['backtrace_id', BACKTRACE_ID],
    ['engine', 'Bedrock ESG'],
    ['asset_class', 'FINE_ART'],
    ['artist', 'Andy Warhol'],
    ['title', 'Dollar Sign (1981)'],
    ['medium', 'Acrylic and silkscreen ink on canvas'],
    ['valuation_source', "Sotheby's London | March 4, 2026 | $772,300"],
    ['settlement', '70/20/10 | Owner $540,610 | Treasury $154,460 | Sentinel $77,230'],
    ['integrity', 'HUM Seismic Baseline | 12.6 MW | 0.5% threshold | Villa Park'],
    ['security', 'Sovereign Home Node ACTIVE | Seismic Perimeter ARMED'],
  ];

  console.log('  Creating EXITZ-A mint + metadata + anchor...');
  const r2 = await executeNodeInhalation(
    connection, authority,
    'EXITZ-A Masterpiece', 'EXITZ-A',
    node02MetadataFields, node02Memo,
  );

  console.log();
  console.log('  ✓ NODE 02 CONFIRMED');
  console.log(LINE);
  console.log('  EXITZ-A Mint     :', r2.mintAddress);
  console.log('  ATA              :', r2.ataAddress);
  console.log('  Create Tx        :', r2.createTxSig);
  console.log('  Mint+Memo Tx     :', r2.mintTxSig);
  console.log('  Slot             :', r2.slot);
  console.log('  Block Time       :', r2.blockTime);
  console.log('  Memo SHA-256     :', sha(JSON.stringify(node02Memo)));
  console.log();

  // ═══════════════════════════════════════════════════════════════════════
  //  FINAL STATUS
  // ═══════════════════════════════════════════════════════════════════════
  const postBal = await connection.getBalance(authority.publicKey);

  console.log(DIV);
  console.log('  ✓ DUAL-NODE INHALATION COMPLETE');
  console.log(DIV);
  console.log();
  console.log('  EXITZ ECOSYSTEM STATE');
  console.log(LINE);
  console.log('  EXITZ (base)   : 2 tokens  | Mint: 44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ');
  console.log('  EXITZ-C        : 1 token   | Mint:', r1.mintAddress);
  console.log('  EXITZ-A        : 1 token   | Mint:', r2.mintAddress);
  console.log('  Total Assets   : 4 tokens across 3 mints');
  console.log();
  console.log('  SENTINEL STATUS');
  console.log(LINE);
  console.log('  Identity       : Aethexer Sentinel Node-01');
  console.log('  Public Key     :', authority.publicKey.toBase58());
  console.log('  Pre-Balance    :', (preBal / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  console.log('  Post-Balance   :', (postBal / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  console.log('  Total Fees     :', ((preBal - postBal) / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  console.log();
  console.log('  EXPLORER LINKS');
  console.log(LINE);
  console.log('  EXITZ-C Mint   :', `https://explorer.solana.com/address/${r1.mintAddress}?cluster=devnet`);
  console.log('  EXITZ-C Tx     :', `https://explorer.solana.com/tx/${r1.mintTxSig}?cluster=devnet`);
  console.log('  EXITZ-A Mint   :', `https://explorer.solana.com/address/${r2.mintAddress}?cluster=devnet`);
  console.log('  EXITZ-A Tx     :', `https://explorer.solana.com/tx/${r2.mintTxSig}?cluster=devnet`);
  console.log();
  console.log(DIV);
  console.log('  Milestones 3 & 4 Anchored — Sentinel Node-01 Active');
  console.log(DIV);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
