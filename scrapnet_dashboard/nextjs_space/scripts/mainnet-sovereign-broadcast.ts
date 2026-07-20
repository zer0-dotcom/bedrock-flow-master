/**
 * Phase 2 Step 7 — LIVE MAINNET TOKEN-2022 SOVEREIGN ASSET BROADCAST
 *
 * Invokes the production mintSovereignAssetToken() function against a settled
 * DiscoveryAsset on mainnet-beta. This is a REAL BROADCAST — transactions will
 * be written to the Solana mainnet ledger.
 *
 * Target: Marina Bay Sands (MBS-SGP-01)
 *   settlementId: DISC-MBS-SGP-01-MQFLZI2U
 *   estimatedValueUsd: $5,700,000,000
 *   sovereignShare70: $3,990,000,000
 *   category: CASINO → PROPERTY_INDUSTRIAL
 *
 * Zero-secret echo posture maintained throughout.
 */

import { mintSovereignAssetToken, ACTIVE_CLUSTER } from '../lib/solana-integration';

const SETTLEMENT_ID = 'DISC-MBS-SGP-01-MQFLZI2U';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  BEDROCK ESG — MAINNET TOKEN-2022 SOVEREIGN BROADCAST         ║');
  console.log('║  Phase 2 Step 7 — LIVE TRANSACTION STREAM                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Cluster:       ${ACTIVE_CLUSTER}`);
  console.log(`Settlement:    ${SETTLEMENT_ID}`);
  console.log(`Timestamp:     ${new Date().toISOString()}`);
  console.log();

  if (ACTIVE_CLUSTER !== 'mainnet-beta') {
    console.error('[ABORT] ACTIVE_CLUSTER is not mainnet-beta. Refusing to broadcast.');
    process.exit(1);
  }

  console.log('[1/3] Compiling TX1 — CreateAccount + MetadataPointer + InitMint + InitMetadata ...');
  console.log('[2/3] Compiling TX2 — 8× UpdateField (ESG carbon metadata) ...');
  console.log('[3/3] Compiling TX3 — CreateATA + MintTo (custodial escrow) ...');
  console.log();
  console.log('Broadcasting to mainnet-beta ...');
  console.log();

  const result = await mintSovereignAssetToken(SETTLEMENT_ID);

  console.log();
  console.log('════════════════════════════════════════════════════════════════');

  if (result.success) {
    console.log('║  ✓ BROADCAST CONFIRMED — ALL 3 PACKETS LANDED                ║');
    console.log('════════════════════════════════════════════════════════════════');
    console.log();
    console.log('─── TRANSACTION SIGNATURES ───');
    console.log(`TX1 (Init):      ${result.initSignature}`);
    console.log(`TX2 (Metadata):  ${result.metadataSignature}`);
    console.log(`TX3 (Mint):      ${result.mintSignature}`);
    if (result.memoAnchorSignature) {
      console.log(`TX4 (Memo):      ${result.memoAnchorSignature}`);
    }
    console.log();
    console.log('─── TOKEN DETAILS ───');
    console.log(`Mint Address:    ${result.mintAddress}`);
    console.log(`Token Account:   ${result.tokenAccount}`);
    console.log(`Explorer:        ${result.explorerUrl}`);
    console.log(`Asset:           ${result.assetName} (${result.assetSymbol})`);
    console.log(`Asset Class:     ${result.assetClass}`);
    console.log(`Token Supply:    ${result.tokenSupply}`);
    console.log();
    console.log('─── SPLIT VERIFICATION ───');
    console.log(`Founder 70%:     $${result.splitVerification.founderYield70.toLocaleString()}`);
    console.log(`Platform 20%:    $${result.splitVerification.platformProcessor20.toLocaleString()}`);
    console.log(`Resilience 10%:  $${result.splitVerification.publicResilience10.toLocaleString()}`);
    console.log(`Total Value:     $${result.splitVerification.totalValueUsd.toLocaleString()}`);
    console.log(`Compliant:       ${result.splitVerification.compliant}`);
    console.log();
    console.log('─── JSON MANIFEST ───');
    console.log(JSON.stringify({
      protocol: 'bedrock-esg-sovereign-mint-v1',
      cluster: ACTIVE_CLUSTER,
      timestamp: new Date().toISOString(),
      mintAddress: result.mintAddress,
      tokenAccount: result.tokenAccount,
      signatures: {
        tx1_init: result.initSignature,
        tx2_metadata: result.metadataSignature,
        tx3_mint: result.mintSignature,
        tx4_memo: result.memoAnchorSignature,
      },
      asset: {
        name: result.assetName,
        symbol: result.assetSymbol,
        class: result.assetClass,
        supply: result.tokenSupply,
      },
      split: result.splitVerification,
      verdict: 'MAINNET BROADCAST CONFIRMED',
    }, null, 2));
  } else {
    console.log('║  ✗ BROADCAST FAILED                                          ║');
    console.log('════════════════════════════════════════════════════════════════');
    console.log();
    console.log(`Error: ${result.error}`);
    console.log();
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
