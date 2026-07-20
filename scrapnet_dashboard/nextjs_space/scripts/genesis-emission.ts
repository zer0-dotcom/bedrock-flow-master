/**
 * GENESIS EMISSION — Mint 1.0 EXITZ to Aethexer Sentinel (Sentinel Node-01) Wallet
 *
 * Mint:      44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ
 * Authority: 9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3
 * Amount:    1 (decimals = 0, so 1 = 1.0 EXITZ)
 * Program:   Token-2022
 */

import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import {
  mintTo,
  getOrCreateAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const EXITZ_MINT = new PublicKey('44SrHT9Qwyz2jiiJkRF1zHKF2NFTgTC8m6ubPTb5qJBJ');
const DEVNET_RPC = clusterApiUrl('devnet');
const MINT_AMOUNT = 1; // decimals=0, so 1 raw unit = 1.0 EXITZ

async function main() {
  console.log('\u2550'.repeat(59));
  console.log('  GENESIS EMISSION \u2014 Protocol EXITZ');
  console.log('\u2550'.repeat(59));
  console.log();

  // Load authority keypair
  const secret = process.env.SOLANA_NOTARY_SECRET_KEY;
  if (!secret) {
    console.error('ERROR: SOLANA_NOTARY_SECRET_KEY not configured.');
    process.exit(1);
  }
  const authority = Keypair.fromSecretKey(bs58.decode(secret.trim()));
  const connection = new Connection(DEVNET_RPC, 'confirmed');

  console.log('Mint Address :', EXITZ_MINT.toBase58());
  console.log('Authority    :', authority.publicKey.toBase58());
  console.log('Amount       :', MINT_AMOUNT, 'EXITZ (decimals=0)');
  console.log('Token Program:', TOKEN_2022_PROGRAM_ID.toBase58());
  console.log();

  // Pre-balance
  const preBalance = await connection.getBalance(authority.publicKey);
  console.log('Pre-Balance  :', (preBalance / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  console.log();

  // Step 1: Get or create the Associated Token Account for Token-2022
  console.log('Step 1: Creating Associated Token Account (ATA) for EXITZ...');
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,           // payer
    EXITZ_MINT,          // mint
    authority.publicKey,  // owner
    false,               // allowOwnerOffCurve
    'confirmed',         // commitment
    undefined,           // confirmOptions
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  console.log('ATA Address  :', ata.address.toBase58());
  console.log('ATA Owner    :', ata.owner.toBase58());
  console.log('ATA Balance  :', ata.amount.toString(), 'EXITZ (pre-mint)');
  console.log();

  // Step 2: Mint 1 EXITZ to the ATA
  console.log('Step 2: Minting', MINT_AMOUNT, 'EXITZ to ATA...');
  const mintTxSig = await mintTo(
    connection,
    authority,            // payer
    EXITZ_MINT,           // mint
    ata.address,          // destination ATA
    authority,            // mint authority
    MINT_AMOUNT,          // amount (1 raw unit = 1.0 EXITZ with 0 decimals)
    [],                   // multiSigners
    { commitment: 'confirmed' },
    TOKEN_2022_PROGRAM_ID,
  );

  console.log();
  console.log('\u2713 GENESIS EMISSION CONFIRMED');
  console.log('\u2500'.repeat(59));
  console.log('Tx Signature :', mintTxSig);
  console.log('Explorer (Tx):', `https://explorer.solana.com/tx/${mintTxSig}?cluster=devnet`);
  console.log('Explorer (ATA):', `https://explorer.solana.com/address/${ata.address.toBase58()}?cluster=devnet`);
  console.log('Explorer (Mint):', `https://explorer.solana.com/address/${EXITZ_MINT.toBase58()}?cluster=devnet`);

  // Fetch tx details
  const txInfo = await connection.getTransaction(mintTxSig, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  console.log('Slot         :', txInfo?.slot ?? 'N/A');
  console.log('Block Time   :', txInfo?.blockTime ? new Date(txInfo.blockTime * 1000).toISOString() : 'N/A');

  // Post-balance
  const postBalance = await connection.getBalance(authority.publicKey);
  console.log('Post-Balance :', (postBalance / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  console.log('Fee Consumed :', ((preBalance - postBalance) / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
  console.log('\u2500'.repeat(59));

  // Verify token balance
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
  console.log();
  console.log('\u2713 SUPPLY VERIFICATION');
  console.log('  Token Balance:', updatedAta.amount.toString(), 'EXITZ');
  console.log('  Owner        :', updatedAta.owner.toBase58());
  console.log('  ATA          :', updatedAta.address.toBase58());
  console.log();
  console.log('Phantom Wallet: The asset "Protocol EXITZ" should now appear');
  console.log('with a balance of 1 in your Devnet token list.');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
