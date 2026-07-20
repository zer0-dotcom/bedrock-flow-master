/**
 * Mint EXITZ Token on Solana Devnet using Token-2022 with Metadata Extension
 *
 * Two-phase approach:
 *   Phase 1: Create mint account + metadata pointer + initialize mint
 *   Phase 2: Initialize metadata + add custom fields (with rent transfer)
 */

import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMint2Instruction,
  createInitializeMetadataPointerInstruction,
  getMintLen,
  ExtensionType,
  tokenMetadataInitializeWithRentTransfer,
  tokenMetadataUpdateFieldWithRentTransfer,
} from '@solana/spl-token';
import bs58 from 'bs58';

const DEVNET_RPC = clusterApiUrl('devnet');

const SECRET_KEY = process.env.SOLANA_NOTARY_SECRET_KEY;
if (!SECRET_KEY) {
  console.error('ERROR: SOLANA_NOTARY_SECRET_KEY not set');
  process.exit(1);
}

const payer = Keypair.fromSecretKey(bs58.decode(SECRET_KEY.trim()));
console.log('Payer / Mint Authority:', payer.publicKey.toBase58());

async function main() {
  const connection = new Connection(DEVNET_RPC, 'confirmed');

  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Balance: ${balance / 1e9} SOL`);
  if (balance < 0.02 * 1e9) {
    console.error('Insufficient balance — need at least 0.02 SOL');
    process.exit(1);
  }

  // Generate mint keypair
  const mintKeypair = Keypair.generate();
  console.log('Mint Address:', mintKeypair.publicKey.toBase58());

  // ===== PHASE 1: Create account + metadata pointer + init mint =====
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);
  console.log(`Phase 1: Allocating ${mintLen} bytes (${lamports / 1e9} SOL)`);

  const tx1 = new Transaction();

  tx1.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    })
  );

  tx1.add(
    createInitializeMetadataPointerInstruction(
      mintKeypair.publicKey,
      payer.publicKey,
      mintKeypair.publicKey,  // self-referencing: mint is its own metadata
      TOKEN_2022_PROGRAM_ID
    )
  );

  tx1.add(
    createInitializeMint2Instruction(
      mintKeypair.publicKey,
      0,                       // decimals
      payer.publicKey,         // mintAuthority
      payer.publicKey,         // freezeAuthority
      TOKEN_2022_PROGRAM_ID
    )
  );

  const bh1 = await connection.getLatestBlockhash('confirmed');
  tx1.recentBlockhash = bh1.blockhash;
  tx1.lastValidBlockHeight = bh1.lastValidBlockHeight;
  tx1.feePayer = payer.publicKey;

  console.log('Phase 1: Broadcasting...');
  const sig1 = await sendAndConfirmTransaction(
    connection, tx1, [payer, mintKeypair],
    { commitment: 'confirmed', maxRetries: 3 }
  );
  console.log('Phase 1 confirmed:', sig1);

  // ===== PHASE 2: Initialize metadata + custom fields =====
  // tokenMetadataInitializeWithRentTransfer handles lamport top-up for extra space
  console.log('\nPhase 2: Initializing metadata...');
  await tokenMetadataInitializeWithRentTransfer(
    connection,
    payer,                       // payer
    mintKeypair.publicKey,       // mint
    payer.publicKey,             // updateAuthority
    payer.publicKey,             // mintAuthority
    'Protocol EXITZ',            // name
    'EXITZ',                     // symbol
    '',                          // uri
    [],                          // multiSigners
    { commitment: 'confirmed' }  // confirmOptions
  );
  console.log('Metadata initialized: Protocol EXITZ / EXITZ');

  // Add custom fields
  const additionalFields = [
    ['backtrace_id', 'BT-C9C4C5'],
    ['engine', 'Bedrock ESG'],
    ['protocol_version', '2.0.0'],
    ['z_logic', 'Permanently tied to Bedrock ESG engine via Backtrace ID BT-C9C4C5'],
  ];

  for (const [key, value] of additionalFields) {
    console.log(`  Adding field: ${key} = ${value}`);
    await tokenMetadataUpdateFieldWithRentTransfer(
      connection,
      payer,                     // payer
      mintKeypair.publicKey,     // mint/metadata
      payer.publicKey,           // updateAuthority
      key,
      value,
      [],                        // multiSigners
      { commitment: 'confirmed' } // confirmOptions
    );
  }

  // Final balance check
  const finalBalance = await connection.getBalance(payer.publicKey);

  console.log('\n========================================');
  console.log('  PROTOCOL EXITZ — TOKEN CREATED');
  console.log('========================================');
  console.log('Mint Address:', mintKeypair.publicKey.toBase58());
  console.log('Token Program:', TOKEN_2022_PROGRAM_ID.toBase58(), '(Token-2022)');
  console.log('Name:', 'Protocol EXITZ');
  console.log('Symbol:', 'EXITZ');
  console.log('Decimals:', 0);
  console.log('Mint Authority:', payer.publicKey.toBase58());
  console.log('Backtrace ID:', 'BT-C9C4C5');
  console.log('Z-Logic:', additionalFields[3][1]);
  console.log('Phase 1 Tx:', sig1);
  console.log('Balance remaining:', (finalBalance / 1e9).toFixed(6), 'SOL');
  console.log('');
  console.log('Explorer (Tx):', `https://explorer.solana.com/tx/${sig1}?cluster=devnet`);
  console.log('Explorer (Mint):', `https://explorer.solana.com/address/${mintKeypair.publicKey.toBase58()}?cluster=devnet`);
  console.log('');
  console.log('Phantom: Settings → Developer → Devnet, then add token:', mintKeypair.publicKey.toBase58());
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
