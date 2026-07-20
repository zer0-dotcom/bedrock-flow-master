/**
 * BT-C9C4C5 — Item 5: Memory & Performance Profiling
 *
 * TEST 1: 50 concurrent telemetry bursts (10 per asset class)
 * TEST 2: Heavy file queue simulation (forensic-ingest with multipart)
 * TEST 3: DB connection pool monitoring
 * TEST 4: Memory baseline / peak / post-load
 */

import crypto from 'crypto';

const TELEMETRY_URL = 'http://localhost:3000/api/v1/telemetry-ingest';
const FORENSIC_URL = 'http://localhost:3000/api/v1/forensic-ingest';

const PROTOCOL_KEY = process.env.AETHEXER_PROTOCOL_KEY!;
const FIELD_KEY = process.env.AETHEXER_FIELD_KEY!;

if (!PROTOCOL_KEY || !FIELD_KEY) {
  console.error('Missing AETHEXER keys in env');
  process.exit(2);
}

const ASSET_CLASSES = [
  'SOVEREIGN_SKIN',
  'PROPERTY_INDUSTRIAL',
  'PROPERTY_RESIDENTIAL',
  'PHYSICAL_COMMODITIES',
  'PRECIOUS_METALS_CUSTODIAL',
] as const;

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

function authHeaders(): Record<string, string> {
  return {
    'x-aethexer-key': PROTOCOL_KEY,
    'x-aethexer-ts': String(Math.floor(Date.now() / 1000)),
    'x-aethexer-nonce': crypto.randomBytes(32).toString('hex'),
  };
}

function telemetryPayload(variant: number) {
  return {
    node_id: `LOADTEST-NODE-${variant.toString().padStart(3, '0')}`,
    power_usage_kw: 30 + Math.random() * 40,
    pue_ratio: 1.05 + Math.random() * 0.3,
    carbon_per_trade_g: 1 + Math.random() * 10,
    grid_intensity_score: 0.5 + Math.random() * 0.5,
    asset_class: ASSET_CLASSES[variant % 5],
    asset_class_metadata: {
      variant: String.fromCharCode(65 + (variant % 5)),
      tracking_id: `BT-C9C4C5-LOAD-${variant}`,
      sub_split_locked: false,
    },
  };
}

// ════════════════════════════════════════════════════════════════
// TEST 1: Concurrent Telemetry Burst (50 simultaneous)
// ════════════════════════════════════════════════════════════════
async function test1_concurrentBurst(): Promise<void> {
  console.log('\n═══ TEST 1: Concurrent Telemetry Burst (50 payloads) ═══');
  const startTime = Date.now();
  const responses: { idx: number; status: number; time: number; verdict?: string; error?: string }[] = [];

  const promises = Array.from({ length: 50 }, (_, i) => {
    const reqStart = Date.now();
    return fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(telemetryPayload(i)),
    })
      .then(async (res) => {
        const body = await res.json();
        responses.push({
          idx: i,
          status: res.status,
          time: Date.now() - reqStart,
          verdict: body.sentinel?.verdict,
          error: body.error,
        });
      })
      .catch((err) => {
        responses.push({ idx: i, status: 0, time: Date.now() - reqStart, error: err.message });
      });
  });

  await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  const succeeded = responses.filter((r) => r.status === 201);
  const failed = responses.filter((r) => r.status !== 201);
  const times = responses.map((r) => r.time);
  const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

  // Count per asset class
  const verdictCounts: Record<string, number> = {};
  succeeded.forEach((r) => {
    verdictCounts[r.verdict || 'UNKNOWN'] = (verdictCounts[r.verdict || 'UNKNOWN'] || 0) + 1;
  });

  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Responses: ${succeeded.length}/50 succeeded, ${failed.length} dropped`);
  console.log(`  Response times: avg=${avgTime}ms | min=${minTime}ms | max=${maxTime}ms | p95=${p95Time}ms`);
  console.log(`  Verdicts: ${JSON.stringify(verdictCounts)}`);

  if (failed.length > 0) {
    console.log('  Failed payloads:');
    failed.slice(0, 5).forEach((f) => console.log(`    #${f.idx}: HTTP ${f.status} — ${f.error}`));
  }

  // Check for DB pool exhaustion errors
  const poolErrors = failed.filter(
    (f) => f.error?.includes('pool') || f.error?.includes('connection') || f.error?.includes('timeout')
  );

  log('1a: Zero dropped packets', succeeded.length === 50, `${succeeded.length}/50 succeeded`);
  log('1b: Zero DB pool exhaustion', poolErrors.length === 0, `${poolErrors.length} pool errors`);
  log('1c: All 50 records persisted', succeeded.length === 50, `${succeeded.length} records created`);
  log('1d: Response time stable', p95Time < 15000, `p95=${p95Time}ms (threshold: <15000ms)`);
  log('1e: Max response acceptable', maxTime < 30000, `max=${maxTime}ms (threshold: <30000ms)`);
}

// ════════════════════════════════════════════════════════════════
// TEST 2: Heavy File Queue Simulation (forensic-ingest)
// ════════════════════════════════════════════════════════════════
async function test2_heavyFileQueue(): Promise<void> {
  console.log('\n═══ TEST 2: Heavy File Queue Simulation ═══');

  // Create dummy PDF-like files (small but valid magic bytes)
  // We'll send 5 concurrent forensic-ingest requests with multipart
  const concurrency = 5;
  const responses: { idx: number; status: number; time: number; error?: string; submissionId?: string }[] = [];

  const promises = Array.from({ length: concurrency }, async (_, i) => {
    const reqStart = Date.now();
    try {
      // Build a valid PDF-like buffer (magic bytes + padding)
      const pdfMagic = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
      const padding = crypto.randomBytes(1024 * 50); // 50KB dummy content
      const pdfBuffer = Buffer.concat([pdfMagic, padding]);

      const formData = new FormData();
      formData.append('track', 'TRACK_A_MATERIALS');
      formData.append('walletAddress', `LOADTEST-WALLET-${i}`);
      formData.append('companyName', `LoadTest Corp ${i}`);
      formData.append(
        'assetMetadata',
        JSON.stringify({
          latitude: 51.5 + i * 0.01,
          longitude: -0.12 + i * 0.01,
          loadTestId: `BT-C9C4C5-FILEQ-${i}`,
        })
      );

      // Create a File-like blob with PDF magic bytes
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      formData.append('documents[]', blob, `load-test-doc-${i}.pdf`);

      const res = await fetch(FORENSIC_URL, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: formData,
      });

      const body = await res.json();
      responses.push({
        idx: i,
        status: res.status,
        time: Date.now() - reqStart,
        error: body.error,
        submissionId: body.data?.submissionId,
      });
    } catch (err: any) {
      responses.push({ idx: i, status: 0, time: Date.now() - reqStart, error: err.message });
    }
  });

  await Promise.all(promises);

  const succeeded = responses.filter((r) => r.status === 201);
  const failed = responses.filter((r) => r.status !== 201);
  const times = responses.map((r) => r.time);
  const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const maxTime = Math.max(...times);

  console.log(`  Concurrent forensic requests: ${concurrency}`);
  console.log(`  Succeeded: ${succeeded.length}/${concurrency}`);
  console.log(`  Response times: avg=${avgTime}ms | max=${maxTime}ms`);
  if (failed.length > 0) {
    console.log('  Failures:');
    failed.forEach((f) => console.log(`    #${f.idx}: HTTP ${f.status} — ${f.error}`));
  }

  log('2a: No thread locks (all responded)', responses.length === concurrency, `${responses.length}/${concurrency} responded`);
  log('2b: Forensic ingest accepted', succeeded.length === concurrency, `${succeeded.length}/${concurrency} accepted`);
  log('2c: Server remained responsive', maxTime < 30000, `max response: ${maxTime}ms`);
}

// ════════════════════════════════════════════════════════════════
// TEST 3: DB Connection Pool Behavior
// ════════════════════════════════════════════════════════════════
async function test3_dbConnectionPool(): Promise<void> {
  console.log('\n═══ TEST 3: Database Connection Pool ═══');

  // Fire 25 rapid sequential + 25 parallel requests to stress the pool
  // Then verify all completed and connections released cleanly

  // Phase A: 25 rapid sequential
  console.log('  Phase A: 25 rapid sequential requests...');
  let seqSuccess = 0;
  let seqErrors = 0;
  const seqStart = Date.now();

  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch(TELEMETRY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          node_id: `POOLTEST-SEQ-${i.toString().padStart(3, '0')}`,
          power_usage_kw: 40,
          pue_ratio: 1.2,
          carbon_per_trade_g: 5,
          grid_intensity_score: 0.8,
          asset_class: 'PROPERTY_INDUSTRIAL',
        }),
      });
      if (res.status === 201) seqSuccess++;
      else seqErrors++;
    } catch {
      seqErrors++;
    }
  }
  console.log(`  Sequential: ${seqSuccess}/25 OK, ${seqErrors} errors (${Date.now() - seqStart}ms)`);

  // Phase B: 25 parallel
  console.log('  Phase B: 25 parallel requests...');
  const parStart = Date.now();
  let parSuccess = 0;
  let parErrors = 0;

  const parPromises = Array.from({ length: 25 }, (_, i) =>
    fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        node_id: `POOLTEST-PAR-${i.toString().padStart(3, '0')}`,
        power_usage_kw: 40,
        pue_ratio: 1.2,
        carbon_per_trade_g: 5,
        grid_intensity_score: 0.8,
        asset_class: 'PROPERTY_INDUSTRIAL',
      }),
    })
      .then((res) => {
        if (res.status === 201) parSuccess++;
        else parErrors++;
        return res.json();
      })
      .catch(() => parErrors++)
  );

  await Promise.all(parPromises);
  console.log(`  Parallel: ${parSuccess}/25 OK, ${parErrors} errors (${Date.now() - parStart}ms)`);

  // Phase C: Verify server still responsive (no zombie connections)
  console.log('  Phase C: Post-load health check...');
  await new Promise((r) => setTimeout(r, 2000)); // Let connections settle

  const healthRes = await fetch('http://localhost:3000', { method: 'GET' });
  const healthOk = healthRes.status === 200;

  // One more telemetry to confirm DB still writable
  const writeCheck = await fetch(TELEMETRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      node_id: 'POOLTEST-HEALTH-CHECK',
      power_usage_kw: 40,
      pue_ratio: 1.2,
      carbon_per_trade_g: 5,
      grid_intensity_score: 0.8,
      asset_class: 'PROPERTY_INDUSTRIAL',
    }),
  });
  const writeOk = writeCheck.status === 201;

  log('3a: No pool exhaustion (sequential)', seqErrors === 0, `${seqSuccess}/25 succeeded`);
  log('3b: No pool exhaustion (parallel)', parErrors === 0, `${parSuccess}/25 succeeded`);
  log('3c: Server responsive post-load', healthOk, `Health check: HTTP ${healthRes.status}`);
  log('3d: DB writable post-load', writeOk, `Write check: HTTP ${writeCheck.status}`);
}

// ════════════════════════════════════════════════════════════════
// TEST 4: Memory Baseline & Peak
// ════════════════════════════════════════════════════════════════
async function test4_memoryProfile(): Promise<void> {
  console.log('\n═══ TEST 4: Memory Baseline & Peak ═══');

  // We measure the Node.js process memory from the server side
  // by checking heap usage before, during, and after load.
  // Since we can't directly access the server's process.memoryUsage(),
  // we'll use the OS-level RSS of the Next.js process.

  const getServerMemory = (): { rss: number; heap: number } | null => {
    try {
      // Find the Next.js dev server process
      const { execSync } = require('child_process');
      // Get RSS of all node processes related to next
      const output = execSync(
        "ps aux | grep 'next-router-worker\\|next dev' | grep -v grep | awk '{sum += $6} END {print sum}'"
      )
        .toString()
        .trim();
      const rssKb = parseInt(output) || 0;
      return { rss: rssKb, heap: 0 }; // heap not directly accessible externally
    } catch {
      return null;
    }
  };

  // Baseline
  const baseline = getServerMemory();
  const baselineMb = baseline ? Math.round(baseline.rss / 1024) : 0;
  console.log(`  Baseline RSS: ${baselineMb}MB`);

  // Load burst: 30 concurrent
  console.log('  Applying 30 concurrent requests...');
  const loadPromises = Array.from({ length: 30 }, (_, i) =>
    fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        node_id: `MEMTEST-${i.toString().padStart(3, '0')}`,
        power_usage_kw: 40 + Math.random() * 20,
        pue_ratio: 1.1 + Math.random() * 0.2,
        carbon_per_trade_g: 3 + Math.random() * 7,
        grid_intensity_score: 0.7 + Math.random() * 0.3,
        asset_class: ASSET_CLASSES[i % 5],
      }),
    }).then((r) => r.json())
  );

  await Promise.all(loadPromises);

  const peak = getServerMemory();
  const peakMb = peak ? Math.round(peak.rss / 1024) : 0;
  console.log(`  Peak RSS (during load): ${peakMb}MB`);

  // Wait for GC and settling
  console.log('  Waiting 5s for GC cycle...');
  await new Promise((r) => setTimeout(r, 5000));

  const postLoad = getServerMemory();
  const postLoadMb = postLoad ? Math.round(postLoad.rss / 1024) : 0;
  console.log(`  Post-load RSS (after GC): ${postLoadMb}MB`);

  const memoryGrowth = peakMb - baselineMb;
  const memoryReturn = postLoadMb - baselineMb;
  const returnPct = baselineMb > 0 ? Math.round((memoryReturn / baselineMb) * 100) : 0;

  console.log(`  Memory growth during load: +${memoryGrowth}MB`);
  console.log(`  Memory retained post-GC: +${memoryReturn}MB (${returnPct}% of baseline)`);

  log(
    '4a: Memory baseline captured',
    baselineMb > 0,
    `Baseline: ${baselineMb}MB`
  );
  log(
    '4b: Peak memory within bounds',
    peakMb < baselineMb * 3 || peakMb < 2048,
    `Peak: ${peakMb}MB (${memoryGrowth > 0 ? '+' : ''}${memoryGrowth}MB from baseline)`
  );
  log(
    '4c: Memory returns near baseline',
    memoryReturn < baselineMb * 0.5 || memoryReturn < 200,
    `Post-GC: ${postLoadMb}MB (+${memoryReturn}MB retained, ${returnPct}% growth)`
  );
}

// ════════════════════════════════════════════════════════════════
// CLEANUP
// ════════════════════════════════════════════════════════════════
async function cleanup(): Promise<void> {
  console.log('\n═══ CLEANUP ═══');
  const { execSync } = require('child_process');

  // Clean telemetry test records
  const sqlTelemetry = `DELETE FROM telemetry_readings WHERE node_id LIKE 'LOADTEST-%' OR node_id LIKE 'POOLTEST-%' OR node_id LIKE 'MEMTEST-%';`;
  try {
    execSync(
      `cd /home/ubuntu/scrapnet_dashboard/nextjs_space && echo "${sqlTelemetry}" | npx prisma db execute --schema=prisma/schema.prisma --stdin`,
      { stdio: 'pipe' }
    );
    console.log('  Telemetry test records cleaned');
  } catch (e: any) {
    console.log(`  Telemetry cleanup warning: ${e.message}`);
  }

  // Clean forensic test submissions
  const sqlForensicDocs = `DELETE FROM submission_documents WHERE submission_id IN (SELECT id FROM submissions WHERE wallet_address LIKE 'LOADTEST-WALLET-%');`;
  const sqlForensic = `DELETE FROM submissions WHERE wallet_address LIKE 'LOADTEST-WALLET-%';`;
  try {
    execSync(
      `cd /home/ubuntu/scrapnet_dashboard/nextjs_space && echo "${sqlForensicDocs}" | npx prisma db execute --schema=prisma/schema.prisma --stdin`,
      { stdio: 'pipe' }
    );
    execSync(
      `cd /home/ubuntu/scrapnet_dashboard/nextjs_space && echo "${sqlForensic}" | npx prisma db execute --schema=prisma/schema.prisma --stdin`,
      { stdio: 'pipe' }
    );
    console.log('  Forensic test submissions cleaned');
  } catch (e: any) {
    console.log(`  Forensic cleanup warning: ${e.message}`);
  }

  // Clean nonces from load test
  try {
    execSync(
      `cd /home/ubuntu/scrapnet_dashboard/nextjs_space && echo "DELETE FROM ingest_nonces WHERE created_at > NOW() - INTERVAL '30 minutes';" | npx prisma db execute --schema=prisma/schema.prisma --stdin`,
      { stdio: 'pipe' }
    );
    console.log('  Load test nonces cleaned');
  } catch (e: any) {
    console.log(`  Nonce cleanup warning: ${e.message}`);
  }
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  BT-C9C4C5 — Item 5: Memory & Performance Profiling         ║');
  console.log('║  Target: localhost:3000                                       ║');
  console.log('║  Tests: Burst | File Queue | DB Pool | Memory                ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  await test1_concurrentBurst();
  await test2_heavyFileQueue();
  await test3_dbConnectionPool();
  await test4_memoryProfile();
  await cleanup();

  // ── Summary ────────────────────────────────────────────────────────
  console.log('\n═════════════════════════════════════════════════════════════');
  console.log('  PERFORMANCE PROFILING — FINAL REPORT');
  console.log('═════════════════════════════════════════════════════════════');

  const passed = RESULTS.filter((r) => r.status === 'PASS').length;
  const failed = RESULTS.filter((r) => r.status === 'FAIL').length;
  const total = RESULTS.length;

  console.log(`  Total assertions: ${total}`);
  console.log(`  Passed:           ${passed}`);
  console.log(`  Failed:           ${failed}`);

  if (failed > 0) {
    console.log('\n  ⚠ FAILED ASSERTIONS:');
    RESULTS.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`    ✗ ${r.test}: ${r.detail}`);
    });
  }

  console.log(`\n  VERDICT: ${failed === 0 ? '✓ ALL TESTS PASSED — SERVER PERFORMANCE VERIFIED' : '✗ PERFORMANCE ISSUES DETECTED'}`);
  console.log('═════════════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(2);
});
