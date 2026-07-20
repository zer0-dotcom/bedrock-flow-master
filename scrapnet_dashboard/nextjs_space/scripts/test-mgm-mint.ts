/**
 * Phase 2 Step 3 — MGM Grand Test Mint Execution
 * Target: DISC-MGM-LV-01-MQFLZI2P
 * Network: Solana DEVNET
 */

import { mintSovereignAssetToken } from '../lib/solana-integration';

async function executeMGMMint() {
  const settlementId = 'DISC-MGM-LV-01-MQFLZI2P';

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  BEDROCK ESG — SOVEREIGN ASSET TOKEN MINT');
  console.log('  Phase 2 Step 3 — MGM Grand Las Vegas');
  console.log('  Settlement ID:', settlementId);
  console.log('  Network: DEVNET');
  console.log('  Protocol: Aethexer v1 — Token-2022');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  try {
    console.log('[1/15] Querying settlement from database...');
    console.log('[2/15] Validating 70/20/10 Zero Greed compliance...');
    console.log('[3/15] Resolving asset class...');
    console.log('[4/15] Calculating token supply...');
    console.log('[5/15] Generating backtrace...');
    console.log('[6/15] Building Token-2022 metadata...');
    console.log('[7/15] Loading mint authority keypair...');
    console.log('[8/15] Generating mint keypair...');
    console.log('[9/15] Calculating rent-exempt space...');
    console.log('[10/15] Building transaction...');
    console.log('[11/15] Signing and broadcasting...');
    console.log('');

    const result = await mintSovereignAssetToken(settlementId);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    if (result.success) {
      console.log('  ✓ MINT COMPLETE — TOKEN-2022 SOVEREIGN ASSET');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      console.log('  Asset Name:          ', result.assetName);
      console.log('  Asset Symbol:        ', result.assetSymbol);
      console.log('  Asset Class:         ', result.assetClass);
      console.log('  Settlement ID:       ', result.settlementId);
      console.log('  Token Supply:        ', result.tokenSupply);
      console.log('');
      console.log('  Mint Address:        ', result.mintAddress);
      console.log('  Token Account (ATA): ', result.tokenAccount);
      console.log('  Init Signature:      ', result.initSignature);
      console.log('  Mint Signature:      ', result.mintSignature);
      console.log('  Memo Anchor Sig:     ', result.memoAnchorSignature || 'N/A');
      console.log('');
      console.log('  70/20/10 Split Verification:');
      console.log('    Founder Yield (70%):      $', result.splitVerification.founderYield70.toLocaleString());
      console.log('    Platform Processor (20%): $', result.splitVerification.platformProcessor20.toLocaleString());
      console.log('    Public Resilience (10%):  $', result.splitVerification.publicResilience10.toLocaleString());
      console.log('    Total Value:              $', result.splitVerification.totalValueUsd.toLocaleString());
      console.log('    Compliant:                ', result.splitVerification.compliant ? '✓ ZERO GREED VERIFIED' : '✗ VIOLATION');
      console.log('');
      console.log('  ┌─────────────────────────────────────────────────────────┐');
      console.log('  │ DEVNET EXPLORER URL:                                    │');
      console.log('  │', result.explorerUrl);
      console.log('  └─────────────────────────────────────────────────────────┘');
    } else {
      console.log('  ✗ MINT FAILED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('  Error:', result.error);
      console.log('');
      console.log('  Split Verification:');
      console.log('    Compliant:', result.splitVerification.compliant);
    }
    console.log('');
  } catch (error: any) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('  FATAL ERROR');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('  ', error.message);
    console.error('');
  }
}

executeMGMMint();
