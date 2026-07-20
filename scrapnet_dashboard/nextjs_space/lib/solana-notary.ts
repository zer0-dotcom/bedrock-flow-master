/**
 * SOVEREIGN NOTARY — Server-Side Solana Memo Signer (BT-C9C4C5 v2.2)
 *
 * Production Solana Mainnet anchor via the official Memo Program.
 * Reads the Sentinel Node-01 keypair from SOLANA_NOTARY_SECRET_KEY env var.
 *
 * Memo Program: MemoJV1t78Ds8p3D96uEn59N8MQWPrqnGoAYvGo46wR
 * Expected Public Key: 9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3
 *
 * Identity Lock: Aethexer Notary Node — all sovereign identity references
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import crypto from 'crypto';

// ─── Constants ──────────────────────────────────────────────────────────────

export const MEMO_PROGRAM_ID = new PublicKey(
  'MemoJV1t78Ds8p3D96uEn59N8MQWPrqnGoAYvGo46wR'
);

export const EXPECTED_PUBLIC_KEY = '9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3';

/**
 * Mainnet RPC endpoint — reads from SOLANA_MAINNET_RPC_URL env var,
 * falls back to the public mainnet-beta cluster.
 */
const SOLANA_MAINNET_RPC =
  process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface NotaryAnchorPayload {
  type:
    | 'CARBON_AUDIT'
    | 'TRADE_SETTLEMENT'
    | 'HUM_FREQUENCY_SHIFT'
    | 'SPATIAL_ATTESTATION'
    | 'BIOCHAR_CDR'
    | 'METAL_RECOVERY';
  entityId: string;
  dataHash: string;
  carbonTonnes?: number;
  valuationUsd?: number;
  metadata?: Record<string, unknown>;
  backtrace?: string; // BT-XXXXXX — links memo to originating ingest request
}

export interface NotaryAnchorResult {
  success: boolean;
  transactionSignature: string | null;
  slot: number | null;
  blockTime: number | null;
  explorerUrl: string | null;
  memoContent: string | null;
  signerPublicKey: string;
  error?: string;
}

export interface NotaryStatus {
  configured: boolean;
  publicKey: string | null;
  expectedKey: string;
  keyMatch: boolean;
  rpcEndpoint: string;
  cluster: 'mainnet-beta';
}

// ─── Keypair Management ─────────────────────────────────────────────────────

let _cachedKeypair: Keypair | null = null;

/**
 * Loads the Sentinel Node-01 keypair from environment.
 * Accepts either:
 *   - base58-encoded secret key (88 chars)
 *   - JSON array of 64 bytes
 */
function loadNotaryKeypair(): Keypair | null {
  if (_cachedKeypair) return _cachedKeypair;

  const secret = process.env.SOLANA_NOTARY_SECRET_KEY;
  if (!secret || secret.trim() === '') return null;

  try {
    const trimmed = secret.trim();

    // Try JSON array first (e.g. from `solana-keygen`)
    if (trimmed.startsWith('[')) {
      const bytes = JSON.parse(trimmed) as number[];
      _cachedKeypair = Keypair.fromSecretKey(Uint8Array.from(bytes));
      return _cachedKeypair;
    }

    // Otherwise treat as base58
    const decoded = bs58.decode(trimmed);
    _cachedKeypair = Keypair.fromSecretKey(decoded);
    return _cachedKeypair;
  } catch (err) {
    console.error('[Sentinel Node-01] Failed to decode SOLANA_NOTARY_SECRET_KEY:', err);
    return null;
  }
}

/**
 * Returns a reusable Mainnet connection.
 */
function getConnection(): Connection {
  return new Connection(SOLANA_MAINNET_RPC, 'confirmed');
}

// ─── Core Signing ───────────────────────────────────────────────────────────

/**
 * Build the memo string from an anchor payload.
 * Max Memo size is ~566 bytes; we keep it compact.
 */
function buildMemoString(payload: NotaryAnchorPayload): string {
  const memo = {
    v: '2.2',
    sys: 'BEDROCK_ESG',
    signer: 'Aethexer Notary Node',
    node: 'Sentinel Node-01',
    t: payload.type,
    id: payload.entityId,
    h: payload.dataHash.substring(0, 32),
    ...(payload.carbonTonnes !== undefined && { co2t: payload.carbonTonnes }),
    ...(payload.valuationUsd !== undefined && { usd: payload.valuationUsd }),
    ...(payload.backtrace && { bt: payload.backtrace }), // Backtrace link to ingest request
    ts: Math.floor(Date.now() / 1000),
  };
  return JSON.stringify(memo);
}

/**
 * Production guardrail — ensures SOLANA_NOTARY_SECRET_KEY is fully
 * initialised and yields a valid keypair in production mode.
 * Returns null on success, or an error string if the perimeter check fails.
 */
function productionGuardrail(): string | null {
  if (process.env.NODE_ENV !== 'production') return null;

  const secret = process.env.SOLANA_NOTARY_SECRET_KEY;
  if (!secret || secret.trim() === '') {
    const msg =
      '[PERIMETER ERROR] SOLANA_NOTARY_SECRET_KEY is empty or missing in production. ' +
      'Anchor operations are HALTED until a valid key is configured.';
    console.error(msg);
    return msg;
  }

  const kp = loadNotaryKeypair();
  if (!kp) {
    const msg =
      '[PERIMETER ERROR] SOLANA_NOTARY_SECRET_KEY failed to decode to a valid keypair. ' +
      'Anchor operations are HALTED.';
    console.error(msg);
    return msg;
  }

  // Verify the loaded key matches expected public key
  if (kp.publicKey.toBase58() !== EXPECTED_PUBLIC_KEY) {
    const msg =
      `[PERIMETER ERROR] Loaded keypair public key (${kp.publicKey.toBase58()}) ` +
      `does not match EXPECTED_PUBLIC_KEY (${EXPECTED_PUBLIC_KEY}). Anchor operations are HALTED.`;
    console.error(msg);
    return msg;
  }

  return null;
}

/**
 * Sign and broadcast a Memo transaction on Solana Mainnet.
 *
 * @deprecated Use anchorToChain — this alias kept for backward compat.
 */
export const anchorToDevnet = anchorToChain;

/**
 * Sign and broadcast a Memo transaction on Solana Mainnet.
 */
export async function anchorToChain(
  payload: NotaryAnchorPayload
): Promise<NotaryAnchorResult> {
  // Production guardrail — halt if key is missing / invalid in production
  const guardrailError = productionGuardrail();
  if (guardrailError) {
    return {
      success: false,
      transactionSignature: null,
      slot: null,
      blockTime: null,
      explorerUrl: null,
      memoContent: null,
      signerPublicKey: EXPECTED_PUBLIC_KEY,
      error: guardrailError,
    };
  }

  const keypair = loadNotaryKeypair();

  if (!keypair) {
    return {
      success: false,
      transactionSignature: null,
      slot: null,
      blockTime: null,
      explorerUrl: null,
      memoContent: null,
      signerPublicKey: EXPECTED_PUBLIC_KEY,
      error:
        'SOLANA_NOTARY_SECRET_KEY is not configured. ' +
        'Set the base58-encoded secret key for the Sentinel Node-01 wallet in .env.',
    };
  }

  const signerPubkey = keypair.publicKey.toBase58();
  const memoContent = buildMemoString(payload);

  try {
    const connection = getConnection();

    // Build Memo instruction
    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoContent, 'utf-8'),
    });

    const transaction = new Transaction().add(memoInstruction);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = keypair.publicKey;

    // Sign and send
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair],
      { commitment: 'confirmed', maxRetries: 3 }
    );

    // Fetch slot / block time
    const txInfo = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    const slot = txInfo?.slot ?? null;
    const blockTime = txInfo?.blockTime ?? null;
    const explorerUrl = `https://explorer.solana.com/tx/${signature}`;

    console.log(
      `[Sentinel Node-01] ✓ Anchor confirmed: ${signature} (slot ${slot})`
    );

    return {
      success: true,
      transactionSignature: signature,
      slot,
      blockTime,
      explorerUrl,
      memoContent,
      signerPublicKey: signerPubkey,
    };
  } catch (err: any) {
    console.error('[Sentinel Node-01] Anchor failed:', err);
    return {
      success: false,
      transactionSignature: null,
      slot: null,
      blockTime: null,
      explorerUrl: null,
      memoContent,
      signerPublicKey: signerPubkey,
      error: err.message || 'Transaction broadcast failed',
    };
  }
}

// ─── Convenience Helpers ────────────────────────────────────────────────────

/**
 * Hash arbitrary data for anchoring.
 */
export function hashForAnchor(data: Record<string, unknown>): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

/**
 * Get current notary configuration status.
 */
export function getNotaryStatus(): NotaryStatus {
  const keypair = loadNotaryKeypair();
  const publicKey = keypair?.publicKey.toBase58() ?? null;

  return {
    configured: !!keypair,
    publicKey,
    expectedKey: EXPECTED_PUBLIC_KEY,
    keyMatch: publicKey === EXPECTED_PUBLIC_KEY,
    rpcEndpoint: SOLANA_MAINNET_RPC,
    cluster: 'mainnet-beta',
  };
}

/**
 * Check Mainnet balance of the Sentinel Node-01.
 */
export async function getNotaryBalance(): Promise<{
  lamports: number;
  sol: number;
  rentExempt: boolean;
}> {
  const keypair = loadNotaryKeypair();
  if (!keypair) return { lamports: 0, sol: 0, rentExempt: false };

  try {
    const connection = getConnection();
    const lamports = await connection.getBalance(keypair.publicKey);
    const rentExemptMin = await connection.getMinimumBalanceForRentExemption(0);
    return {
      lamports,
      sol: lamports / 1e9,
      rentExempt: lamports >= rentExemptMin,
    };
  } catch {
    return { lamports: 0, sol: 0, rentExempt: false };
  }
}

export const NOTARY_ENGINE = {
  name: 'Sovereign Notary Bridge',
  version: '2.2.0',
  cluster: 'mainnet-beta',
  memoProgram: MEMO_PROGRAM_ID.toBase58(),
  expectedSigner: EXPECTED_PUBLIC_KEY,
  signerIdentity: 'Aethexer Notary Node',
  nodeId: 'Sentinel Node-01',
};
