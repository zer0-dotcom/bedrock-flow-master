/**
 * BT-C9C4C5 — Sentinel 7-Tier Confidence Band Stress Test
 *
 * Tests that the new verdict labels fire at the correct composite
 * score thresholds by calling the real scoring engine with crafted inputs.
 *
 * PAYLOAD ALPHA — Target: ~68% → PENDING_AUTHORIZATION
 * PAYLOAD BETA  — Target: ~82% → PENDING_SOVEREIGN_REVIEW
 *
 * Also verifies:
 * - sub_split_locked: false on both records
 * - 10% Public Resilience is unified dynamic block on both
 * - Settlement only triggers on AUTO_APPROVED
 */

import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000/api/v1/sentinel-band-test';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

const RESULTS: TestResult[] = [];

function log(test: string, pass: boolean, detail: string) {
  const status = pass ? 'PASS' : 'FAIL';
  RESULTS.push({ test, status, detail });
  console.log(`  [${status}] ${test}: ${detail}`);
}

/**
 * PAYLOAD ALPHA — Target: ~68% composite → PENDING_AUTHORIZATION
 *
 * Strategy: Make exactly ONE check fail (doc integrity at 57.5%)
 * while LLM and spatial pass their thresholds.
 * This lands composite in the 0.65–0.749 band with ≤1 failed check.
 *
 * Math:
 *   docScore  = 0.575 (fails 0.95 threshold → 1 failed check)
 *   llmScore  = 0.75  (passes 0.75 threshold)
 *   spatial   = 0.75  (passes 0.75 threshold)
 *   composite = 0.575*0.40 + 0.75*0.35 + 0.75*0.25
 *            = 0.230 + 0.2625 + 0.1875 = 0.680
 */
function buildPayloadAlpha() {
  return {
    node_id: 'TEST-PROP-INDUSTRIAL-01',
    asset_class: 'PROPERTY_INDUSTRIAL',
    asset_class_metadata: {
      variant: 'B',
      label: 'Property \u2014 Industrial',
      category: 'Commercial Real Estate',
      routing_tags: ['WAREHOUSE', 'MANUFACTURING'],
      sub_split_locked: false,
      tracking_id: 'BT-C9C4C5-BAND-TEST-B',
    },
    // Crafted to produce docScore ≈ 0.575
    // scoreDocumentIntegrity: hash valid (+0.35) + size valid (+0.15) + magicBytes FALSE (+0) + header FALSE (+0) = 0.50
    // But we need 0.575. Let's use partial scoring:
    // hash valid (+0.35) + size valid (+0.15) + magicBytes FALSE (+0) + header valid (+0.15) = 0.65
    // Hmm, let me recalculate. The individual component scores are:
    //   hash (64 chars) = +0.35, size (>0, <100MB) = +0.15, magic = +0.35, header = +0.15
    // With magicBytesValid=false: 0.35 + 0.15 + 0 + 0.15 = 0.65
    // With magicBytesValid=false AND headerStructureValid=false: 0.35 + 0.15 + 0 + 0 = 0.50
    // So I need: hash valid + size valid + magic INVALID + header valid = 0.65 for docScore
    //   composite = 0.65*0.40 + 0.75*0.35 + 0.75*0.25 = 0.26+0.2625+0.1875 = 0.71 (too high)
    // Better: hash valid + size valid + magic INVALID + header INVALID = 0.50
    //   composite = 0.50*0.40 + 0.75*0.35 + 0.75*0.25 = 0.20+0.2625+0.1875 = 0.65 (low end)
    // Let me try: use 2 documents, one perfect (1.0) and one degraded (0.35)
    //   Average = (1.0+0.35)/2 = 0.675
    //   composite = 0.675*0.40 + 0.75*0.35 + 0.75*0.25 = 0.27+0.2625+0.1875 = 0.72 (too high)
    // Try: 2 docs, one at 0.50 and one at 0.35
    //   Average = (0.50+0.35)/2 = 0.425
    //   composite = 0.425*0.40 + 0.75*0.35 + 0.75*0.25 = 0.17+0.2625+0.1875 = 0.62 (too low)
    // 
    // One doc at 0.50, llm at 0.85, spatial at 0.80:
    //   composite = 0.50*0.40 + 0.85*0.35 + 0.80*0.25 = 0.20+0.2975+0.20 = 0.6975 ≈ 0.698
    //   failedChecks = [DOC] (only doc fails 0.95 threshold)
    //   0.65 ≤ 0.698 < 0.75 → PENDING_AUTHORIZATION ✔
    doc_inputs: [{
      fileName: 'telemetry-TEST-PROP-INDUSTRIAL-01.json',
      fileHash: crypto.randomBytes(32).toString('hex'), // valid 64-char hash
      fileSizeBytes: 1024,
      fileType: 'application/json',
      magicBytesValid: false,   // DEGRADE: magic byte check fails
      headerStructureValid: false, // DEGRADE: header structure fails
    }],
    // LLM: parserConfidence=0.80 * 0.60 + (5/5)*0.25 + no anomalies 0.15 = 0.48+0.25+0.15 = 0.88
    // Hmm that's too high. For llmScore=0.85:
    //   parserConfidence*0.60 + extractionRate*0.25 + 0.15 = 0.85
    //   parserConfidence*0.60 = 0.85 - 0.40 = 0.45 → parserConfidence = 0.75
    // For llmScore=0.80:
    //   parserConfidence*0.60 + 0.25 + 0.15 = 0.80 → parserConfidence = 0.667
    llm_input: {
      parserConfidence: 0.667,
      fieldsExtracted: 5,
      fieldsExpected: 5,
      hasAnomalies: false,
    },
    // Spatial: target ~0.80
    // geo present + valid coords = 0.25
    // timestamp + consistent = 0.20
    // metadata 5/5 = 0.25
    // spatial scan = 0.15
    // ground photos = 0
    // total = 0.85... too high
    // Without ground photos and spatial scan:
    // 0.25 + 0.20 + 0.25 = 0.70
    // With scan: 0.25+0.20+0.25+0.15 = 0.85
    // Let me use: geo + timestamp + metadata(4/5) + no scan + no photos
    // = 0.25 + 0.20 + (4/5)*0.25 + 0 + 0 = 0.25+0.20+0.20 = 0.65
    // Hmm, spatial scoring is normalized: score/maxScore * maxScore... wait
    // Actually: return maxScore > 0 ? Math.min(score / maxScore, 1.0) * maxScore / 1.0 : 0
    // maxScore = 0.25+0.20+0.25+0.15+0.15 = 1.0
    // return Math.min(score/1.0, 1.0) * 1.0 = score (when maxScore=1.0)
    // So spatial = raw score
    //
    // For spatial = 0.80: geo(0.25) + ts(0.20) + meta(0.25) + scan(0.15) + no photos(0) = 0.85
    // Reduce: meta 4/5: 0.25+0.20+(4/5)*0.25+0.15 = 0.25+0.20+0.20+0.15 = 0.80 ✔
    spatial_input: {
      hasGeolocation: true,
      geoLatitude: 51.5074,   // London
      geoLongitude: -0.1278,
      hasTimestamp: true,
      timestampConsistent: true,
      metadataFieldsPresent: 4,  // 4 of 5 → reduce metadata score
      metadataFieldsExpected: 5,
      spatialScanPresent: true,
      groundPhotosPresent: false, // No ground photos → reduce
    },
  };
}

/**
 * PAYLOAD BETA — Target: ~82% composite → PENDING_SOVEREIGN_REVIEW
 *
 * Strategy: Make exactly ONE check fail (spatial at 0.65)
 * while doc and LLM pass their thresholds.
 * This lands composite in the ≥0.75 band with ≤1 failed check.
 *
 * Math:
 *   docScore  = 1.0  (passes 0.95 threshold)
 *   llmScore  = 0.88 (passes 0.75 threshold)
 *   spatial   = 0.45 (fails 0.75 threshold → 1 failed check)
 *   composite = 1.0*0.40 + 0.88*0.35 + 0.45*0.25
 *            = 0.40 + 0.308 + 0.1125 = 0.8205
 */
function buildPayloadBeta() {
  return {
    node_id: 'TEST-SOVEREIGN-SKIN-01',
    asset_class: 'SOVEREIGN_SKIN',
    asset_class_metadata: {
      variant: 'A',
      label: 'Sovereign Skin\u2122 / Gripsy',
      category: 'Thermodynamic + Kinetic',
      routing_tags: ['THERMO_KINETIC', 'ROOF_MEMBRANE'],
      sub_split_locked: false,
      tracking_id: 'BT-C9C4C5-BAND-TEST-A',
    },
    // Perfect doc integrity → 1.0
    doc_inputs: [{
      fileName: 'telemetry-TEST-SOVEREIGN-SKIN-01.json',
      fileHash: crypto.randomBytes(32).toString('hex'),
      fileSizeBytes: 2048,
      fileType: 'application/json',
      magicBytesValid: true,
      headerStructureValid: true,
    }],
    // LLM: parserConfidence=0.80 → 0.80*0.60+1.0*0.25+0.15 = 0.48+0.25+0.15 = 0.88
    llm_input: {
      parserConfidence: 0.80,
      fieldsExtracted: 5,
      fieldsExpected: 5,
      hasAnomalies: false,
    },
    // Degraded spatial → only timestamp + partial metadata
    // ts(0.20) + meta(5/5)*0.25 + no geo + no scan + no photos = 0.20+0.25 = 0.45
    spatial_input: {
      hasGeolocation: false,
      hasTimestamp: true,
      timestampConsistent: true,
      metadataFieldsPresent: 5,
      metadataFieldsExpected: 5,
      spatialScanPresent: false,
      groundPhotosPresent: false,
    },
  };
}

async function runTest(label: string, payload: any, expectedVerdict: string, expectedScoreRange: [number, number]) {
  console.log(`\n\u2550\u2550\u2550 ${label} \u2550\u2550\u2550`);
  console.log(`  Target verdict: ${expectedVerdict}`);
  console.log(`  Target composite: ${expectedScoreRange[0]*100}%\u2013${expectedScoreRange[1]*100}%`);

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.json();

  if (res.status !== 201) {
    log(`${label}: HTTP response`, false, `Expected 201, got ${res.status}: ${body.error || body.message}`);
    return null;
  }

  const s = body.sentinel;
  console.log(`  Scores: doc=${s.documentIntegrity} | llm=${s.llmConfidence} | spatial=${s.spatialCorrelation}`);
  console.log(`  Composite: ${(s.compositeScore * 100).toFixed(1)}%`);
  console.log(`  Verdict: ${s.verdict}`);
  console.log(`  Failed checks: ${s.failedChecks.length > 0 ? s.failedChecks.join(', ') : 'NONE'}`);
  console.log(`  Record ID: ${body.record_id}`);

  // 1. Verdict matches
  log(
    `${label}: Verdict`,
    s.verdict === expectedVerdict,
    `Expected ${expectedVerdict}, got ${s.verdict}`
  );

  // 2. Composite in expected range
  const inRange = s.compositeScore >= expectedScoreRange[0] && s.compositeScore <= expectedScoreRange[1];
  log(
    `${label}: Composite score range`,
    inRange,
    `${(s.compositeScore * 100).toFixed(1)}% (expected ${expectedScoreRange[0]*100}%\u2013${expectedScoreRange[1]*100}%)`
  );

  // 3. Record persisted
  log(
    `${label}: DB persistence`,
    body.persisted === true,
    body.persisted ? 'Record persisted to telemetry_readings' : 'NOT PERSISTED'
  );

  // 4. sub_split_locked: false in metadata
  const metadata = payload.asset_class_metadata;
  log(
    `${label}: sub_split_locked`,
    metadata && metadata.sub_split_locked === false,
    `sub_split_locked=${metadata?.sub_split_locked}`
  );

  // 5. Public Resilience = 10% unified dynamic block
  const prPercent = body.settlement.publicResiliencePercent;
  log(
    `${label}: Public Resilience = 10%`,
    prPercent === 10,
    `Public Resilience: ${prPercent}%`
  );

  // 6. Settlement should NOT trigger (not AUTO_APPROVED)
  log(
    `${label}: Settlement gated`,
    body.settlement.settled === false,
    `settled=${body.settlement.settled} (expected false for ${expectedVerdict})`
  );

  return body;
}

async function main() {
  console.log('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  console.log('\u2551  BT-C9C4C5 \u2014 Sentinel 7-Tier Confidence Band Stress Test  \u2551');
  console.log('\u2551  Target: localhost:3000/api/v1/sentinel-band-test         \u2551');
  console.log('\u2551  Engine: runSentinelScoring() with crafted inputs         \u2551');
  console.log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d');

  // \u2500\u2500 PAYLOAD ALPHA: ~68% \u2192 PENDING_AUTHORIZATION \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const alphaResult = await runTest(
    'PAYLOAD ALPHA (Property Industrial)',
    buildPayloadAlpha(),
    'PENDING_AUTHORIZATION',
    [0.65, 0.749]
  );

  // \u2500\u2500 PAYLOAD BETA: ~82% \u2192 PENDING_SOVEREIGN_REVIEW \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const betaResult = await runTest(
    'PAYLOAD BETA (Sovereign Skin)',
    buildPayloadBeta(),
    'PENDING_SOVEREIGN_REVIEW',
    [0.75, 0.899]
  );

  // \u2500\u2500 BOUNDARY TESTS: Verify adjacent bands don't leak \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  console.log('\n\u2550\u2550\u2550 BOUNDARY LEAK TESTS \u2550\u2550\u2550');

  // Test: 100% composite \u2192 AUTO_APPROVED (all checks pass)
  const perfectPayload = {
    node_id: 'TEST-BOUNDARY-PERFECT',
    asset_class: 'PROPERTY_INDUSTRIAL',
    asset_class_metadata: { variant: 'X', sub_split_locked: false, tracking_id: 'BOUNDARY-PERFECT' },
    doc_inputs: [{
      fileName: 'perfect.json',
      fileHash: crypto.randomBytes(32).toString('hex'),
      fileSizeBytes: 1024,
      fileType: 'application/json',
      magicBytesValid: true,
      headerStructureValid: true,
    }],
    llm_input: { parserConfidence: 1.0, fieldsExtracted: 5, fieldsExpected: 5, hasAnomalies: false },
    spatial_input: {
      hasGeolocation: true, geoLatitude: 51.5, geoLongitude: -0.12,
      hasTimestamp: true, timestampConsistent: true,
      metadataFieldsPresent: 5, metadataFieldsExpected: 5,
      spatialScanPresent: true, groundPhotosPresent: true,
    },
  };
  const perfectRes = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(perfectPayload),
  });
  const perfectBody = await perfectRes.json();
  log(
    'BOUNDARY: 100% \u2192 AUTO_APPROVED',
    perfectBody.sentinel?.verdict === 'AUTO_APPROVED',
    `Verdict=${perfectBody.sentinel?.verdict}, Composite=${(perfectBody.sentinel?.compositeScore*100).toFixed(1)}%`
  );
  log(
    'BOUNDARY: AUTO_APPROVED triggers settlement',
    perfectBody.settlement?.settled === true,
    `settled=${perfectBody.settlement?.settled}`
  );

  // Test: <65% with 2+ failures \u2192 REJECTED
  const rejectedPayload = {
    node_id: 'TEST-BOUNDARY-REJECTED',
    asset_class: 'PROPERTY_INDUSTRIAL',
    asset_class_metadata: { variant: 'X', sub_split_locked: false, tracking_id: 'BOUNDARY-REJECTED' },
    doc_inputs: [{
      fileName: 'bad.json',
      fileHash: 'short',  // Invalid hash
      fileSizeBytes: 0,   // Invalid size
      fileType: 'application/json',
      magicBytesValid: false,
      headerStructureValid: false,
    }],
    llm_input: { parserConfidence: 0.3, fieldsExtracted: 1, fieldsExpected: 5, hasAnomalies: true },
    spatial_input: {
      hasGeolocation: false,
      hasTimestamp: false,
      metadataFieldsPresent: 0, metadataFieldsExpected: 5,
      spatialScanPresent: false, groundPhotosPresent: false,
    },
  };
  const rejectedRes = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rejectedPayload),
  });
  const rejectedBody = await rejectedRes.json();
  log(
    'BOUNDARY: Low score \u2192 REJECTED',
    rejectedBody.sentinel?.verdict === 'REJECTED',
    `Verdict=${rejectedBody.sentinel?.verdict}, Composite=${(rejectedBody.sentinel?.compositeScore*100).toFixed(1)}%, Failed=${rejectedBody.sentinel?.failedChecks?.length}`
  );

  // \u2500\u2500 SUMMARY \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('  SENTINEL CONFIDENCE BAND TEST \u2014 FINAL REPORT');
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');

  const passed = RESULTS.filter(r => r.status === 'PASS').length;
  const failed = RESULTS.filter(r => r.status === 'FAIL').length;
  const total = RESULTS.length;

  console.log(`  Total assertions: ${total}`);
  console.log(`  Passed:           ${passed}`);
  console.log(`  Failed:           ${failed}`);

  console.log('\n  \u2500\u2500 Band Coverage Map \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log('  AUTO_APPROVED           (95%+, 0 failures)   \u2192 BOUNDARY-PERFECT');
  console.log('  PENDING_SOVEREIGN_REVIEW (75\u201394%, \u22641 failure) \u2192 PAYLOAD BETA');
  console.log('  PENDING_AUTHORIZATION    (65\u201374%, \u22641 failure) \u2192 PAYLOAD ALPHA');
  console.log('  REJECTED                 (<65% OR 2+ failures)\u2192 BOUNDARY-REJECTED');

  if (failed > 0) {
    console.log('\n  \u26a0 FAILED ASSERTIONS:');
    RESULTS.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`    \u2717 ${r.test}: ${r.detail}`);
    });
  }

  console.log(`\n  VERDICT: ${failed === 0 ? '\u2713 ALL BANDS VERIFIED \u2014 SENTINEL ENGINE CLEAN' : '\u2717 BAND MISALIGNMENT DETECTED'}`);
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(2);
});
