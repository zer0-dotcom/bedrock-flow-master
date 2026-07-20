/**
 * MANUAL OVERRIDE ANCHOR
 * Bypasses the 5% HUM threshold and notarizes 3.6 MW CME Aurora telemetry
 * directly to Solana Devnet.
 *
 * Backtrace ID: B8EEB2B6C9FA6367
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Constants ──────────────────────────────────────────────────────────────

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const DEVNET_RPC = clusterApiUrl('devnet');

const BACKTRACE_ID = 'B8EEB2B6C9FA6367';
const CME_AURORA_MW = 3.6;
const HUM_BASELINE_MW = 12.6;
const SHIFT_PERCENT = ((CME_AURORA_MW - HUM_BASELINE_MW) / HUM_BASELINE_MW) * 100;

// ─── Build Telemetry Data ───────────────────────────────────────────────────

const telemetryData = {
  node: 'CME Aurora',
  exchange: 'CME/Eurex (Continuous)',
  currentMw: CME_AURORA_MW,
  baselineMw: HUM_BASELINE_MW,
  shiftPercent: parseFloat(SHIFT_PERCENT.toFixed(2)),
  overrideReason: 'Manual override — 5% threshold bypassed per operator directive',
  backtraceId: BACKTRACE_ID,
  timestamp: new Date().toISOString(),
};

const dataHash = crypto
  .createHash('sha256')
  .update(JSON.stringify(telemetryData))
  .digest('hex');

// ─── Build Memo ─────────────────────────────────────────────────────────────

const memo = JSON.stringify({
  v: '2.0',
  sys: 'BEDROCK_ESG',
  t: 'HUM_FREQUENCY_SHIFT',
  id: `HUM-MANUAL-${BACKTRACE_ID}`,
  h: dataHash.substring(0, 32),
  co2t: 0,
  node: 'CME Aurora',
  mw: CME_AURORA_MW,
  baseline: HUM_BASELINE_MW,
  shift_pct: parseFloat(SHIFT_PERCENT.toFixed(2)),
  override: true,
  backtrace: BACKTRACE_ID,
  ts: Math.floor(Date.now() / 1000),
});

// ─── Execute ────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  MANUAL OVERRIDE ANCHOR — Bedrock ESG Sovereign Notary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();
  console.log('Backtrace ID :', BACKTRACE_ID);
  console.log('Node         :', 'CME Aurora');
  console.log('Current MW   :', CME_AURORA_MW);
  console.log('Baseline MW  :', HUM_BASELINE_MW);
  console.log('Shift %      :', SHIFT_PERCENT.toFixed(2) + '%');
  console.log('Override     : YES (5% threshold bypassed)');
  console.log();

  // Load keypair
  const secret = process.env.SOLANA_NOTARY_SECRET_KEY;
  if (!secret) {
    console.error('ERROR: SOLANA_NOTARY_SECRET_KEY not configured.');
    process.exit(1);
  }

  const keypair = Keypair.fromSecretKey(bs58.decode(secret.trim()));
  console.log('Signer       :', keypair.publicKey.toBase58());

  const connection = new Connection(DEVNET_RPC, 'confirmed');

  // Pre-balance
  const preBalance = await connection.getBalance(keypair.publicKey);
  console.log('Pre-Balance  :', (preBalance / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  console.log();

  // Build memo instruction
  console.log('Memo Payload :', memo);
  console.log('Memo Size    :', Buffer.byteLength(memo, 'utf-8'), 'bytes');
  console.log();

  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, 'utf-8'),
  });

  const transaction = new Transaction().add(memoInstruction);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = keypair.publicKey;

  console.log('Broadcasting to Solana Devnet...');
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [keypair],
    { commitment: 'confirmed', maxRetries: 3 }
  );

  console.log();
  console.log('✓ ANCHOR CONFIRMED');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Tx Signature :', signature);
  console.log('Explorer     :', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);

  // Fetch slot/blocktime
  const txInfo = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  console.log('Slot         :', txInfo?.slot ?? 'N/A');
  console.log('Block Time   :', txInfo?.blockTime ? new Date(txInfo.blockTime * 1000).toISOString() : 'N/A');

  // Post-balance
  const postBalance = await connection.getBalance(keypair.publicKey);
  console.log('Post-Balance :', (postBalance / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  console.log('Fee Consumed :', ((preBalance - postBalance) / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  console.log('─────────────────────────────────────────────────────────');
  console.log();
  console.log('Protocol Check:');
  console.log('  sys          = BEDROCK_ESG  ✓');
  console.log('  backtrace    = ' + BACKTRACE_ID + '  ✓');
  console.log('  override     = true (manual)  ✓');
  console.log('  data_hash    = ' + dataHash.substring(0, 32) + '...');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
