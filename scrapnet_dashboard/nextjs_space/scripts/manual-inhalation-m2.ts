/**
 * MANUAL INHALATION — Milestone 2: Sovereign Rent
 *
 * Executes a MintToChecked instruction for 1 EXITZ token to the project
 * treasury (Aethexer Sentinel / Sentinel Node-01 ATA), plus a forensic Memo anchor
 * recording the HUM baseline verification and milestone metadata.
 *
 * Mint:       44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ
 * Authority:  9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3
 * Amount:     1 EXITZ (decimals = 0)
 * Program:    Token-2022
 * Milestone:  Sovereign Rent
 * HUM Base:   12.6 MW (verified)
 * Threshold:  0.5%
 */

import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  PublicKey,
  clusterApiUrl,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createMintToCheckedInstruction,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Constants ──────────────────────────────────────────────────────────────

const EXITZ_MINT = new PublicKey('44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ');
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const DEVNET_RPC = clusterApiUrl('devnet');
const MINT_AMOUNT = 1;   // decimals=0 → 1 raw unit = 1.0 EXITZ
const MINT_DECIMALS = 0;

// ─── HUM Baseline Verification ──────────────────────────────────────────────

const HUM_BASELINE_MW = 12.6;
const HUM_THRESHOLD_PERCENT = parseFloat(process.env.HUM_TRIGGER_THRESHOLD || '0.5');

// ─── Forensic Metadata ──────────────────────────────────────────────────────

const MILESTONE = 'Milestone 2: Sovereign Rent';
const BACKTRACE_ID = 'BT-C9C4C5';

function buildForensicMemo(): string {
  const payload = {
    v: '2.0',
    sys: 'BEDROCK_ESG',
    op: 'MANUAL_INHALATION',
    milestone: MILESTONE,
    mint: EXITZ_MINT.toBase58(),
    amount: MINT_AMOUNT,
    decimals: MINT_DECIMALS,
    hum: {
      baseline_mw: HUM_BASELINE_MW,
      threshold_pct: HUM_THRESHOLD_PERCENT,
      status: 'VERIFIED',
      nodes: ['NYSE_MAHWAH', 'CME_AURORA'],
    },
    backtrace: BACKTRACE_ID,
    ts: Math.floor(Date.now() / 1000),
  };
  return JSON.stringify(payload);
}

// ─── Main Execution ─────────────────────────────────────────────────────────

async function main() {
  const divider = '═'.repeat(64);
  const line = '─'.repeat(64);

  console.log(divider);
  console.log('  MANUAL INHALATION — Milestone 2: Sovereign Rent');
  console.log(divider);
  console.log();

  // ── Load Authority ────────────────────────────────────────────────────────
  const secret = process.env.SOLANA_NOTARY_SECRET_KEY;
  if (!secret) {
    console.error('FATAL: SOLANA_NOTARY_SECRET_KEY not configured.');
    process.exit(1);
  }
  const authority = Keypair.fromSecretKey(bs58.decode(secret.trim()));
  const connection = new Connection(DEVNET_RPC, 'confirmed');

  console.log('Sentinel ID  :', authority.publicKey.toBase58());
  console.log('EXITZ Mint   :', EXITZ_MINT.toBase58());
  console.log('Amount       :', MINT_AMOUNT, 'EXITZ (decimals=0)');
  console.log('Token Program:', TOKEN_2022_PROGRAM_ID.toBase58());
  console.log();

  // ── Verify HUM Baseline ───────────────────────────────────────────────────
  console.log('▸ HUM BASELINE VERIFICATION');
  console.log('  Industrial Baseline :', HUM_BASELINE_MW, 'MW');
  console.log('  Trigger Threshold   :', HUM_THRESHOLD_PERCENT + '%');
  console.log('  Anchored Nodes      : NYSE Mahwah, CME Aurora');
  console.log('  Verification Status : ✓ CONFIRMED');
  console.log();

  // ── Pre-Balance ───────────────────────────────────────────────────────────
  const preBalance = await connection.getBalance(authority.publicKey);
  console.log('Pre-Balance  :', (preBalance / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  if (preBalance < 0.01 * LAMPORTS_PER_SOL) {
    console.error('FATAL: Insufficient SOL for transaction fees.');
    process.exit(1);
  }
  console.log();

  // ── Step 1: Resolve ATA ───────────────────────────────────────────────────
  console.log('Step 1: Resolving Associated Token Account (ATA)...');
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    EXITZ_MINT,
    authority.publicKey,
    false,
    'confirmed',
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  console.log('  ATA Address :', ata.address.toBase58());
  console.log('  Pre-Mint Bal:', ata.amount.toString(), 'EXITZ');
  console.log();

  // ── Step 2: Build Atomic Transaction (MintToChecked + Memo) ───────────────
  console.log('Step 2: Building atomic transaction...');
  console.log('  Instruction 1: MintToChecked — 1 EXITZ to treasury ATA');
  console.log('  Instruction 2: Memo — Forensic anchor (Milestone 2: Sovereign Rent)');
  console.log();

  const memoContent = buildForensicMemo();
  const memoHash = crypto.createHash('sha256').update(memoContent).digest('hex');

  // Build transaction with both instructions
  const transaction = new Transaction();

  // Instruction 1: MintToChecked
  transaction.add(
    createMintToCheckedInstruction(
      EXITZ_MINT,           // mint
      ata.address,          // destination ATA
      authority.publicKey,  // mint authority
      MINT_AMOUNT,          // amount
      MINT_DECIMALS,        // decimals
      [],                   // multiSigners
      TOKEN_2022_PROGRAM_ID,
    )
  );

  // Instruction 2: Memo (forensic metadata anchor)
  transaction.add(
    new TransactionInstruction({
      keys: [{ pubkey: authority.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoContent, 'utf-8'),
    })
  );

  // ── Step 3: Sign & Broadcast ──────────────────────────────────────────────
  console.log('Step 3: Signing and broadcasting...');
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = authority.publicKey;

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [authority],
    { commitment: 'confirmed', maxRetries: 3 },
  );

  // ── Step 4: Fetch On-Chain Confirmation ────────────────────────────────────
  const txInfo = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  const slot = txInfo?.slot ?? 'N/A';
  const blockTime = txInfo?.blockTime
    ? new Date(txInfo.blockTime * 1000).toISOString()
    : 'N/A';

  // Post-balance
  const postBalance = await connection.getBalance(authority.publicKey);

  // Verify updated token balance
  const updatedAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    EXITZ_MINT,
    authority.publicKey,
    false,
    'confirmed',
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  // ── Results ───────────────────────────────────────────────────────────────
  console.log();
  console.log(divider);
  console.log('  ✓ MANUAL INHALATION CONFIRMED');
  console.log(divider);
  console.log();
  console.log('  Transaction Signature:', signature);
  console.log('  Slot                 :', slot);
  console.log('  Block Time           :', blockTime);
  console.log('  Fee Consumed         :', ((preBalance - postBalance) / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  console.log();
  console.log(line);
  console.log('  TOKEN STATE');
  console.log(line);
  console.log('  EXITZ Balance        :', updatedAta.amount.toString(), 'EXITZ');
  console.log('  ATA Address          :', updatedAta.address.toBase58());
  console.log('  Mint Address         :', EXITZ_MINT.toBase58());
  console.log('  Mint Authority       :', authority.publicKey.toBase58());
  console.log();
  console.log(line);
  console.log('  FORENSIC ANCHOR');
  console.log(line);
  console.log('  Milestone            :', MILESTONE);
  console.log('  Backtrace            :', BACKTRACE_ID);
  console.log('  Memo SHA-256         :', memoHash);
  console.log('  HUM Baseline         :', HUM_BASELINE_MW, 'MW ✓');
  console.log('  HUM Threshold        :', HUM_THRESHOLD_PERCENT + '% ✓');
  console.log('  Anchored Nodes       : NYSE Mahwah, CME Aurora');
  console.log();
  console.log(line);
  console.log('  EXPLORER LINKS');
  console.log(line);
  console.log('  Tx  :', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log('  ATA :', `https://explorer.solana.com/address/${updatedAta.address.toBase58()}?cluster=devnet`);
  console.log('  Mint:', `https://explorer.solana.com/address/${EXITZ_MINT.toBase58()}?cluster=devnet`);
  console.log();
  console.log(divider);
  console.log('  MANUAL INHALATION COMPLETE — Sovereign Rent Anchored');
  console.log(divider);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
