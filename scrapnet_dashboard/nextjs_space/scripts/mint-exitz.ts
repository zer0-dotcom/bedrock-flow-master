/**
 * Mint Protocol EXITZ — Token-2022 w/ Metadata Extension — MAINNET-BETA (Version-A Canon)
 *
 * SAFETY: Dry-run by default. Broadcasts ONLY when EXECUTE_MAINNET_MINT="true".
 * Signer: SOLANA_MAINNET_MINT_AUTHORITY_KEYPAIR (base58 | base64 | json-array)
 *         fallback SOLANA_NOTARY_SECRET_KEY. RPC: NEXT_PUBLIC_RPC_ENDPOINT.
 *
 * Metadata path: direct @solana/spl-token-metadata instructions (createInitializeInstruction /
 * createUpdateFieldInstruction) with explicit TOKEN_2022_PROGRAM_ID, and rent pre-funded in the
 * create-account lamports. The bundled tokenMetadata*WithRentTransfer helpers in this install
 * emit a malformed instruction (IncorrectProgramId) and are deliberately NOT used.
 *
 * Version-A Canon: NO third-party landmark names, NO valuations, NO equity claims.
 * Token is a diagnostic telemetry receipt only; ownership disclaimer embedded.
 */

import path from 'path';
import dotenv from 'dotenv';
// Load .env.local (then .env) so secrets never pass through the command line.
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import {
  Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID, createInitializeMint2Instruction,
  createInitializeMetadataPointerInstruction, getMintLen, ExtensionType,
} from '@solana/spl-token';
import {
  pack, createInitializeInstruction, createUpdateFieldInstruction, TokenMetadata,
} from '@solana/spl-token-metadata';
import bs58 from 'bs58';

// ---- RPC (Mainnet via Helius) ----
const RPC_URL = process.env.NEXT_PUBLIC_RPC_ENDPOINT;
if (!RPC_URL) { console.error('ERROR: NEXT_PUBLIC_RPC_ENDPOINT not set'); process.exit(1); }
const IS_MAINNET = /mainnet/i.test(RPC_URL);
const CLUSTER_QS = IS_MAINNET ? '' : '?cluster=devnet';

// ---- Signer: Version-A mint authority (notary wallet), 3 accepted formats ----
const RAW = process.env.SOLANA_MAINNET_MINT_AUTHORITY_KEYPAIR
         || process.env.SOLANA_NOTARY_SECRET_KEY;
if (!RAW) { console.error('ERROR: no mint-authority keypair env set'); process.exit(1); }
function loadKeypair(raw: string): Keypair {
  const s = raw.trim();
  const reject = ['PLACEHOLDER_SET_YOUR_BASE58_KEYPAIR', 'AWAITING_FOUNDER_INPUT'];
  if (reject.includes(s)) throw new Error('keypair env is a placeholder sentinel');
  let bytes: Uint8Array;
  if (s.startsWith('[')) bytes = Uint8Array.from(JSON.parse(s));            // json byte array
  else { try { bytes = bs58.decode(s); }                                    // base58
         catch { bytes = Uint8Array.from(Buffer.from(s, 'base64')); } }     // base64
  return bytes.length === 32 ? Keypair.fromSeed(bytes) : Keypair.fromSecretKey(bytes);
}
const payer = loadKeypair(RAW);
console.log('Payer / Mint Authority:', payer.publicKey.toBase58());

// ---- Strict Version-A canon metadata (NO landmark names, NO valuations) ----
const TOKEN_NAME = 'Protocol EXITZ';
const TOKEN_SYMBOL = 'EXITZ';
const CANON_FIELDS: [string, string][] = [
  ['backtrace_id', 'BT-C9C4C5'],
  ['engine', 'Bedrock ESG'],
  ['protocol_version', '2.0.0'],
  ['z_logic', 'Permanently tied to Bedrock ESG engine via Backtrace ID BT-C9C4C5'],
  ['entity', 'MEDIFLO LLC'],
  ['jurisdiction', 'Stanton CA / CA-202462418827'],
  ['canon', 'Version-A'],
  ['asset_class', 'DIAGNOSTIC_TELEMETRY_RECEIPT'],
  ['ownership_disclaimer', 'No third-party property ownership asserted'],
];
const TLV_HEADER = 4; // type(2) + length(2)

async function main() {
  const connection = new Connection(RPC_URL as string, 'confirmed');
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Network: ${IS_MAINNET ? 'MAINNET-BETA' : 'devnet'}  |  Balance: ${(balance / 1e9).toFixed(9)} SOL`);

  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Full metadata (incl. additional fields) → size → rent that covers all updateField growth.
  const metadata: TokenMetadata = {
    updateAuthority: payer.publicKey, mint,
    name: TOKEN_NAME, symbol: TOKEN_SYMBOL, uri: '',
    additionalMetadata: CANON_FIELDS,
  };
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const totalSpace = mintLen + TLV_HEADER + pack(metadata).length;
  const lamports = await connection.getMinimumBalanceForRentExemption(totalSpace);
  console.log('New Mint Address:', mint.toBase58());
  console.log(`Account funded for ${totalSpace} bytes: ${(lamports / 1e9).toFixed(9)} SOL rent`);

  // ---- MAINNET SAFETY GATE ----
  if (IS_MAINNET && process.env.EXECUTE_MAINNET_MINT !== 'true') {
    console.log('\n[DRY RUN] Mainnet broadcast gate CLOSED.');
    console.log('Set EXECUTE_MAINNET_MINT="true" to broadcast. No transaction sent.');
    return;
  }
  if (balance < 0.01 * 1e9) { console.error('Insufficient balance — need >= 0.01 SOL'); process.exit(1); }

  // ===== TX1: create account (funded for full size) + pointer + mint + metadata init =====
  const tx1 = new Transaction();
  tx1.add(SystemProgram.createAccount({
    fromPubkey: payer.publicKey, newAccountPubkey: mint,
    space: mintLen, lamports, programId: TOKEN_2022_PROGRAM_ID,
  }));
  tx1.add(createInitializeMetadataPointerInstruction(
    mint, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID));
  tx1.add(createInitializeMint2Instruction(
    mint, 0, payer.publicKey, payer.publicKey, TOKEN_2022_PROGRAM_ID));
  tx1.add(createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID, metadata: mint, updateAuthority: payer.publicKey,
    mint, mintAuthority: payer.publicKey, name: TOKEN_NAME, symbol: TOKEN_SYMBOL, uri: '',
  }));
  console.log('TX1: createAccount + metadataPointer + initMint + initMetadata...');
  const sig1 = await sendAndConfirmTransaction(connection, tx1, [payer, mintKeypair],
    { commitment: 'confirmed', maxRetries: 3 });
  console.log('TX1 confirmed:', sig1);

  // ===== Canon fields (one tx each; account already funded for final size) =====
  for (const [field, value] of CANON_FIELDS) {
    const tx = new Transaction().add(createUpdateFieldInstruction({
      programId: TOKEN_2022_PROGRAM_ID, metadata: mint, updateAuthority: payer.publicKey,
      field, value,
    }));
    console.log(`  field: ${field}`);
    await sendAndConfirmTransaction(connection, tx, [payer], { commitment: 'confirmed' });
  }

  const finalBalance = await connection.getBalance(payer.publicKey);
  console.log('\n======== PROTOCOL EXITZ — MINTED (Version-A) ========');
  console.log('Mint:', mint.toBase58());
  console.log('Authority:', payer.publicKey.toBase58());
  console.log('Decimals:', 0, ' | Program: Token-2022');
  console.log('Spent:', ((balance - finalBalance) / 1e9).toFixed(9), 'SOL');
  console.log('Explorer:', `https://explorer.solana.com/address/${mint.toBase58()}${CLUSTER_QS}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
