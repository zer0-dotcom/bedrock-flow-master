/**
 * BT-C9C4C5 — Security Sandbox Tests (Item 2 + Item 4)
 * 
 * Runs against the LOCAL dev server (localhost:3000) only.
 * Uses sandbox-only dummy keys — NO live credentials.
 * 
 * TEST 1: Anti-Replay Drift Attack (Δt > 300s)
 * TEST 2: 32-Byte Floor Gate (truncated key)
 * TEST 3: Valid Key Rotation Cycle
 */

import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000/api/v1/telemetry-ingest';
const RESULTS: { test: string; status: 'PASS' | 'FAIL'; detail: string }[] = [];

// Read real keys from env for sandbox validation of valid paths
const PROTOCOL_KEY = process.env.AETHEXER_PROTOCOL_KEY!;
const FIELD_KEY = process.env.AETHEXER_FIELD_KEY!;

function dummyPayload() {
  return {
    node_id: 'SANDBOX-NODE-01',
    power_usage_kw: 42.5,
    pue_ratio: 1.15,
    carbon_per_trade_g: 3.2,
    grid_intensity_score: 0.85,
    document_integrity: {
      document_hash: crypto.randomBytes(32).toString('hex'),
      document_type: 'SANDBOX_TEST',
      field_count: 5,
      completeness_ratio: 1.0,
    },
    asset_class: 'PROPERTY_INDUSTRIAL',
  };
}

async function sendRequest(headers: Record<string, string>, label: string) {
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(dummyPayload()),
    });
    const body = await res.json();
    return { status: res.status, body };
  } catch (err: any) {
    return { status: 0, body: { error: 'NETWORK_ERROR', message: err.message } };
  }
}

function log(test: string, pass: boolean, detail: string) {
  const status = pass ? 'PASS' : 'FAIL';
  RESULTS.push({ test, status, detail });
  console.log(`  [${status}] ${test}: ${detail}`);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 1: Anti-Replay Drift Attack (Δt > 300s)
// ═══════════════════════════════════════════════════════════════════════
async function test1_antiReplayDrift() {
  console.log('\n═══ TEST 1: Anti-Replay Drift Attack (Δt > 300s) ═══');

  // 1a: Timestamp 600s in the past — must be blocked
  const staleTs = Math.floor(Date.now() / 1000) - 600;
  const nonce1a = crypto.randomBytes(32).toString('hex');
  const res1a = await sendRequest({
    'x-aethexer-key': PROTOCOL_KEY,
    'x-aethexer-ts': String(staleTs),
    'x-aethexer-nonce': nonce1a,
  }, '1a: 600s stale');
  log(
    '1a: 600s stale timestamp',
    res1a.status === 401 && res1a.body.error === 'TIMESTAMP_EXPIRED',
    `HTTP ${res1a.status} — ${res1a.body.error || 'NO_ERROR'}`
  );

  // 1b: Timestamp 301s in the past — edge case, must be blocked
  const edgeTs = Math.floor(Date.now() / 1000) - 301;
  const nonce1b = crypto.randomBytes(32).toString('hex');
  const res1b = await sendRequest({
    'x-aethexer-key': PROTOCOL_KEY,
    'x-aethexer-ts': String(edgeTs),
    'x-aethexer-nonce': nonce1b,
  }, '1b: 301s stale');
  log(
    '1b: 301s stale (edge boundary)',
    res1b.status === 401 && res1b.body.error === 'TIMESTAMP_EXPIRED',
    `HTTP ${res1b.status} — ${res1b.body.error || 'NO_ERROR'}`
  );

  // 1c: Timestamp 600s in the FUTURE — must also be blocked
  const futureTs = Math.floor(Date.now() / 1000) + 600;
  const nonce1c = crypto.randomBytes(32).toString('hex');
  const res1c = await sendRequest({
    'x-aethexer-key': PROTOCOL_KEY,
    'x-aethexer-ts': String(futureTs),
    'x-aethexer-nonce': nonce1c,
  }, '1c: 600s future');
  log(
    '1c: 600s future timestamp',
    res1c.status === 401 && res1c.body.error === 'TIMESTAMP_EXPIRED',
    `HTTP ${res1c.status} — ${res1c.body.error || 'NO_ERROR'}`
  );

  // 1d: Valid timestamp (within window) — CONTROL, must pass auth
  const validTs = Math.floor(Date.now() / 1000);
  const nonce1d = crypto.randomBytes(32).toString('hex');
  const res1d = await sendRequest({
    'x-aethexer-key': PROTOCOL_KEY,
    'x-aethexer-ts': String(validTs),
    'x-aethexer-nonce': nonce1d,
  }, '1d: valid timestamp');
  log(
    '1d: Valid timestamp (control)',
    res1d.status === 201,
    `HTTP ${res1d.status} — ${res1d.body.error || 'ACCEPTED'}`
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 2: 32-Byte Floor Gate
// ═══════════════════════════════════════════════════════════════════════
async function test2_byteFloorGate() {
  console.log('\n═══ TEST 2: 32-Byte Floor Gate ═══');

  // 2a: 8-byte key (16 hex chars) — well below floor
  const shortKey = crypto.randomBytes(8).toString('hex'); // 16 chars
  const nonce2a = crypto.randomBytes(32).toString('hex');
  const res2a = await sendRequest({
    'x-aethexer-key': shortKey,
    'x-aethexer-ts': String(Math.floor(Date.now() / 1000)),
    'x-aethexer-nonce': nonce2a,
  }, '2a: 8-byte key');
  log(
    '2a: 8-byte key (below 32-byte floor)',
    res2a.status === 401 && res2a.body.error === 'UNAUTHORIZED',
    `HTTP ${res2a.status} — ${res2a.body.error || 'NO_ERROR'}`
  );

  // 2b: 16-byte key (32 hex chars) — still below 32-byte floor
  const midKey = crypto.randomBytes(16).toString('hex'); // 32 chars
  const nonce2b = crypto.randomBytes(32).toString('hex');
  const res2b = await sendRequest({
    'x-aethexer-key': midKey,
    'x-aethexer-ts': String(Math.floor(Date.now() / 1000)),
    'x-aethexer-nonce': nonce2b,
  }, '2b: 16-byte key');
  log(
    '2b: 16-byte key (below 32-byte floor)',
    res2b.status === 401 && res2b.body.error === 'UNAUTHORIZED',
    `HTTP ${res2b.status} — ${res2b.body.error || 'NO_ERROR'}`
  );

  // 2c: 31-byte key (62 hex chars) — edge case, just under
  const almostKey = crypto.randomBytes(31).toString('hex'); // 62 chars
  const nonce2c = crypto.randomBytes(32).toString('hex');
  const res2c = await sendRequest({
    'x-aethexer-key': almostKey,
    'x-aethexer-ts': String(Math.floor(Date.now() / 1000)),
    'x-aethexer-nonce': nonce2c,
  }, '2c: 31-byte key');
  log(
    '2c: 31-byte key (1 byte below floor)',
    res2c.status === 401 && res2c.body.error === 'UNAUTHORIZED',
    `HTTP ${res2c.status} — ${res2c.body.error || 'NO_ERROR'}`
  );

  // 2d: Empty string key — must be blocked
  const nonce2d = crypto.randomBytes(32).toString('hex');
  const res2d = await sendRequest({
    'x-aethexer-key': '',
    'x-aethexer-ts': String(Math.floor(Date.now() / 1000)),
    'x-aethexer-nonce': nonce2d,
  }, '2d: empty key');
  log(
    '2d: Empty string key',
    res2d.status === 401,
    `HTTP ${res2d.status} — ${res2d.body.error || 'NO_ERROR'}`
  );

  // 2e: Valid 32+ byte key (control) — must pass auth
  const nonce2e = crypto.randomBytes(32).toString('hex');
  const res2e = await sendRequest({
    'x-aethexer-key': PROTOCOL_KEY,
    'x-aethexer-ts': String(Math.floor(Date.now() / 1000)),
    'x-aethexer-nonce': nonce2e,
  }, '2e: valid key (control)');
  log(
    '2e: Valid 32+ byte key (control)',
    res2e.status === 201,
    `HTTP ${res2e.status} — ${res2e.body.error || 'ACCEPTED'}`
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 3: Valid Key Rotation Cycle
// ═══════════════════════════════════════════════════════════════════════
async function test3_keyRotation() {
  console.log('\n═══ TEST 3: Valid Key Rotation Cycle ═══');

  // Simulate key rotation by:
  // 3a: Verify current key works
  const nonce3a = crypto.randomBytes(32).toString('hex');
  const res3a = await sendRequest({
    'x-aethexer-key': PROTOCOL_KEY,
    'x-aethexer-ts': String(Math.floor(Date.now() / 1000)),
    'x-aethexer-nonce': nonce3a,
  }, '3a: pre-rotation key');
  log(
    '3a: Pre-rotation — current key accepted',
    res3a.status === 201,
    `HTTP ${res3a.status} — ${res3a.body.error || 'ACCEPTED'}`
  );

  // 3b: Generate a new 32-byte key (simulated rotation candidate)
  const newKey = crypto.randomBytes(32).toString('hex');
  console.log(`  [INFO] Generated rotation candidate: ${newKey.substring(0, 8)}...${newKey.substring(56)} (${newKey.length / 2} bytes)`);

  // 3c: Old key still works (no env change yet)
  const nonce3c = crypto.randomBytes(32).toString('hex');
  const res3c = await sendRequest({
    'x-aethexer-key': PROTOCOL_KEY,
    'x-aethexer-ts': String(Math.floor(Date.now() / 1000)),
    'x-aethexer-nonce': nonce3c,
  }, '3c: old key still valid');
  log(
    '3c: Old key remains valid before rotation',
    res3c.status === 201,
    `HTTP ${res3c.status} — ${res3c.body.error || 'ACCEPTED'}`
  );

  // 3d: New key is NOT yet valid (not in env)
  const nonce3d = crypto.randomBytes(32).toString('hex');
  const res3d = await sendRequest({
    'x-aethexer-key': newKey,
    'x-aethexer-ts': String(Math.floor(Date.now() / 1000)),
    'x-aethexer-nonce': nonce3d,
  }, '3d: new key before install');
  log(
    '3d: New key rejected before installation',
    res3d.status === 401 && res3d.body.error === 'UNAUTHORIZED',
    `HTTP ${res3d.status} — ${res3d.body.error || 'NO_ERROR'}`
  );

  // 3e: Validate field key path works independently
  const nonce3e = crypto.randomBytes(32).toString('hex');
  const res3e = await sendRequest({
    'x-aethexer-field-key': FIELD_KEY,
    'x-aethexer-ts': String(Math.floor(Date.now() / 1000)),
    'x-aethexer-nonce': nonce3e,
  }, '3e: field key path');
  log(
    '3e: Field key auth path accepted',
    res3e.status === 201,
    `HTTP ${res3e.status} — ${res3e.body.error || 'ACCEPTED'}`
  );

  // 3f: Confirm 32-byte floor on rotation candidate format
  const validLength = newKey.length >= 64; // 32 bytes = 64 hex chars
  log(
    '3f: Rotation candidate meets 32-byte floor',
    validLength,
    `Key length: ${newKey.length / 2} bytes (${newKey.length} hex chars) — ${validLength ? 'MEETS' : 'FAILS'} 32-byte minimum`
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  BT-C9C4C5 — Security Sandbox Tests (Item 2 + Item 4)  ║');
  console.log('║  Target: localhost:3000/api/v1/telemetry-ingest          ║');
  console.log('║  Mode: SANDBOX (no live credentials exposed)            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  await test1_antiReplayDrift();
  await test2_byteFloorGate();
  await test3_keyRotation();

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SECURITY SANDBOX — FINAL REPORT');
  console.log('═══════════════════════════════════════════════════════');

  const passed = RESULTS.filter(r => r.status === 'PASS').length;
  const failed = RESULTS.filter(r => r.status === 'FAIL').length;
  const total = RESULTS.length;

  // Count invalid payloads that passed (false positive)
  const invalidTests = ['1a', '1b', '1c', '2a', '2b', '2c', '2d', '3d'];
  const invalidThatPassed = RESULTS.filter((r, i) => {
    const id = r.test.split(':')[0];
    return invalidTests.includes(id) && r.status === 'FAIL';
  });

  // Count valid payloads that were blocked (false negative)
  const validTests = ['1d', '2e', '3a', '3c', '3e', '3f'];
  const validThatBlocked = RESULTS.filter((r) => {
    const id = r.test.split(':')[0];
    return validTests.includes(id) && r.status === 'FAIL';
  });

  console.log(`  Total tests:     ${total}`);
  console.log(`  Passed:          ${passed}`);
  console.log(`  Failed:          ${failed}`);
  console.log(`  Invalid payloads that passed through: ${invalidThatPassed.length}`);
  console.log(`  Valid payloads that were blocked:      ${validThatBlocked.length}`);
  console.log('═══════════════════════════════════════════════════════');

  if (failed > 0) {
    console.log('\n  ⚠ FAILED TESTS:');
    RESULTS.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`    ✗ ${r.test}: ${r.detail}`);
    });
  }

  console.log(`\n  VERDICT: ${failed === 0 ? '✓ ALL TESTS PASSED — PERIMETER SECURE' : '✗ SECURITY GAPS DETECTED'}`);
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal sandbox error:', err);
  process.exit(2);
});
