export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAethexerKey, PROTOCOL_VERSION } from '@/lib/aethexer-auth';

/**
 * POST /api/v1/admin/purge-test-artifacts
 *
 * GATED DESTRUCTION — Purges diagnostic/test records from the database.
 *
 * REQUIRES:
 *   1. Valid Aethexer authentication
 *   2. Body must contain { confirmationToken: "PURGE" } — exact string match
 *
 * Targets:
 *   - TelemetryReadings where nodeId starts with 'DIAG-' or 'TEST-'
 *   - IngestNonces flagged as diagnostic
 *   - Any other test artifacts
 *
 * This is a DESTRUCTIVE operation. The confirmation gate prevents accidental invocation.
 */
export async function POST(request: NextRequest) {
  try {
    // Dual auth: Aethexer key OR browser session (Founder/Admin)
    const aethexerAuth = await validateAethexerKey(request);
    let authed = aethexerAuth.valid;

    if (!authed) {
      const { extractUser } = await import('@/lib/rbac-guard');
      const { hasPermission } = await import('@/lib/rbac');
      const user = extractUser(request);
      if (user && hasPermission(user.role, 'platform:manage')) {
        authed = true;
      }
    }

    if (!authed) {
      return NextResponse.json(
        { protocol: PROTOCOL_VERSION, error: 'UNAUTHORIZED', message: 'Aethexer key or Founder session required.' },
        { status: 401 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { protocol: PROTOCOL_VERSION, error: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // ── CONFIRMATION GATE ─────────────────────────────────────────────
    if (!body.confirmationToken || body.confirmationToken !== 'PURGE') {
      return NextResponse.json(
        {
          protocol: PROTOCOL_VERSION,
          error: 'CONFIRMATION_REQUIRED',
          message: 'Destructive operation requires confirmationToken: "PURGE" in request body.',
        },
        { status: 403 }
      );
    }

    console.log('[PURGE] Confirmation gate passed — executing artifact cleanup');

    // ── PURGE TARGETS ─────────────────────────────────────────────────
    const purgeResults: { target: string; deleted: number }[] = [];

    // 1. Diagnostic telemetry readings (DIAG-* or TEST-* prefix)
    const telemetryPurge = await prisma.telemetryReading.deleteMany({
      where: {
        OR: [
          { nodeId: { startsWith: 'DIAG-' } },
          { nodeId: { startsWith: 'TEST-' } },
        ],
      },
    });
    purgeResults.push({ target: 'telemetry_readings (DIAG-*/TEST-*)', deleted: telemetryPurge.count });

    // 2. Diagnostic ingest nonces
    const noncePurge = await prisma.ingestNonce.deleteMany({
      where: {
        OR: [
          { nonce: { contains: 'diag' } },
          { nonce: { contains: 'test' } },
        ],
      },
    });
    purgeResults.push({ target: 'ingest_nonces (diagnostic)', deleted: noncePurge.count });

    const totalDeleted = purgeResults.reduce((s, r) => s + r.deleted, 0);

    console.log(`[PURGE] Complete — ${totalDeleted} total records removed`);

    return NextResponse.json({
      protocol: PROTOCOL_VERSION,
      status: 'PURGE_COMPLETE',
      summary: {
        totalDeleted,
        targets: purgeResults,
      },
      meta: {
        operator: aethexerAuth.valid ? 'aethexer-key' : 'browser-session',
        executedAt: new Date().toISOString(),
        confirmationValid: true,
      },
    });
  } catch (error: any) {
    console.error('[PURGE] Error:', error);
    return NextResponse.json(
      { protocol: PROTOCOL_VERSION, error: 'INTERNAL_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/purge-test-artifacts
 *
 * Preview what would be purged — non-destructive scan.
 */
export async function GET(request: NextRequest) {
  try {
    // Dual auth: Aethexer key OR browser session
    const aethexerAuth = await validateAethexerKey(request);
    let authed = aethexerAuth.valid;
    if (!authed) {
      const { extractUser } = await import('@/lib/rbac-guard');
      const { hasPermission } = await import('@/lib/rbac');
      const user = extractUser(request);
      if (user && hasPermission(user.role, 'platform:manage')) authed = true;
    }
    if (!authed) {
      return NextResponse.json({ protocol: PROTOCOL_VERSION, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const diagTelemetry = await prisma.telemetryReading.count({
      where: {
        OR: [
          { nodeId: { startsWith: 'DIAG-' } },
          { nodeId: { startsWith: 'TEST-' } },
        ],
      },
    });

    const diagNonces = await prisma.ingestNonce.count({
      where: {
        OR: [
          { nonce: { contains: 'diag' } },
          { nonce: { contains: 'test' } },
        ],
      },
    });

    return NextResponse.json({
      protocol: PROTOCOL_VERSION,
      status: 'PURGE_PREVIEW',
      targets: [
        { target: 'telemetry_readings (DIAG-*/TEST-*)', count: diagTelemetry },
        { target: 'ingest_nonces (diagnostic)', count: diagNonces },
      ],
      totalArtifacts: diagTelemetry + diagNonces,
      note: 'Send POST with { confirmationToken: "PURGE" } to execute.',
    });
  } catch (error: any) {
    console.error('[PURGE Preview] Error:', error);
    return NextResponse.json(
      { protocol: PROTOCOL_VERSION, error: 'INTERNAL_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
