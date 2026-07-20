export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAethexerKey, PROTOCOL_VERSION } from '@/lib/aethexer-auth';
import { UNIVERSAL_SPLIT } from '@/lib/universal-law';
import crypto from 'crypto';

/**
 * GET /api/v1/discovery
 * Public read — returns all discovery assets with optional verdict filter.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verdict = searchParams.get('verdict');
    const category = searchParams.get('category');

    const where: any = {};
    if (verdict) where.verdict = verdict;
    if (category) where.category = category;

    const assets = await prisma.discoveryAsset.findMany({
      where,
      orderBy: [{ category: 'asc' }, { estimatedValueUsd: 'desc' }],
    });

    const pendingCount = await prisma.discoveryAsset.count({ where: { verdict: 'PENDING_SOVEREIGN_REVIEW' } });
    const approvedCount = await prisma.discoveryAsset.count({ where: { verdict: 'AUTO_APPROVED' } });

    return NextResponse.json({
      protocol: PROTOCOL_VERSION,
      total: assets.length,
      pendingCount,
      approvedCount,
      assets: assets.map(a => ({
        id: a.id,
        symbol: a.symbol,
        name: a.name,
        category: a.category,
        location: a.location,
        estimatedValueUsd: a.estimatedValueUsd,
        sovereignShare70: a.sovereignShare70,
        verdict: a.verdict,
        subClassification: a.subClassification,
        outreachSent: a.outreachSent,
        settlementId: a.settlementId,
        settled: a.settled,
        settledAt: a.settledAt?.toISOString() || null,
        approvedAt: a.approvedAt?.toISOString() || null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('[Discovery] GET Error:', error);
    return NextResponse.json(
      { protocol: PROTOCOL_VERSION, error: 'INTERNAL_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/discovery
 *
 * Admin actions on discovery assets:
 *   - approve_all: Approve all pending assets
 *   - approve:     Approve specific assets by symbol
 *   - reject:      Flag specific assets for field re-scan
 *
 * Auth: Aethexer key OR Founder/Admin browser session (auth-token cookie).
 */
export async function POST(request: NextRequest) {
  try {
    // Dual auth: Aethexer key OR browser session (Founder/Admin)
    const aethexerAuth = await validateAethexerKey(request);
    let authed = aethexerAuth.valid;
    let authMethod = aethexerAuth.authMethod || 'unknown';

    if (!authed) {
      // Fallback: check browser session JWT
      const { extractUser } = await import('@/lib/rbac-guard');
      const { hasPermission } = await import('@/lib/rbac');
      const user = extractUser(request);
      if (user && hasPermission(user.role, 'platform:manage')) {
        authed = true;
        authMethod = `session:${user.role}`;
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

    const { action, symbols } = body;

    // ── REJECT / RE-SCAN ──────────────────────────────────────────────
    if (action === 'reject') {
      if (!symbols?.length) {
        return NextResponse.json(
          { protocol: PROTOCOL_VERSION, error: 'MISSING_SYMBOLS', message: 'symbols[] required for reject action.' },
          { status: 400 }
        );
      }

      const updated = await prisma.discoveryAsset.updateMany({
        where: { symbol: { in: symbols } },
        data: {
          verdict: 'PENDING_SOVEREIGN_REVIEW',
          settled: false,
          settledAt: null,
          settlementId: null,
          approvedAt: null,
        },
      });

      console.log(`[Discovery Reject] ${updated.count} asset(s) flagged for re-scan by ${authMethod}`);

      return NextResponse.json({
        protocol: PROTOCOL_VERSION,
        status: 'REJECT_COMPLETE',
        summary: { totalRejected: updated.count, symbols },
        meta: { authMethod, timestamp: new Date().toISOString() },
      });
    }

    if (action !== 'approve_all' && action !== 'approve') {
      return NextResponse.json(
        { protocol: PROTOCOL_VERSION, error: 'INVALID_ACTION', message: 'action must be approve_all, approve, or reject' },
        { status: 400 }
      );
    }

    // Fetch pending assets to approve
    const where: any = { verdict: 'PENDING_SOVEREIGN_REVIEW' };
    if (action === 'approve' && symbols?.length) {
      where.symbol = { in: symbols };
    }

    const pendingAssets = await prisma.discoveryAsset.findMany({ where });

    if (pendingAssets.length === 0) {
      return NextResponse.json({
        protocol: PROTOCOL_VERSION,
        status: 'NO_PENDING_ASSETS',
        message: 'No pending discovery assets to approve.',
      });
    }

    const results: any[] = [];
    const now = new Date();

    for (const asset of pendingAssets) {
      // Calculate 70/20/10 settlement on sovereign share
      const totalValueUsd = asset.sovereignShare70;
      const founderYieldUsd = Math.round(totalValueUsd * UNIVERSAL_SPLIT.FOUNDER_YIELD * 100) / 100;
      const stewardshipUsd = Math.round(totalValueUsd * UNIVERSAL_SPLIT.STEWARDSHIP * 100) / 100;
      const publicResilienceUsd = Math.round(totalValueUsd * UNIVERSAL_SPLIT.PUBLIC_RESILIENCE * 100) / 100;

      const settlementId = `DISC-${asset.symbol}-${Date.now().toString(36).toUpperCase()}`;

      await prisma.discoveryAsset.update({
        where: { id: asset.id },
        data: {
          verdict: 'AUTO_APPROVED',
          settlementId,
          settled: true,
          settledAt: now,
          approvedAt: now,
        },
      });

      console.log(`[Discovery Approve] ${asset.symbol} → AUTO_APPROVED | Settlement: ${settlementId}`);

      results.push({
        symbol: asset.symbol,
        name: asset.name,
        category: asset.category,
        previousVerdict: 'PENDING_SOVEREIGN_REVIEW',
        newVerdict: 'AUTO_APPROVED',
        settlement: {
          id: settlementId,
          sovereignShare70Usd: totalValueUsd,
          split: {
            assetSovereign: founderYieldUsd,
            platformProcessor: stewardshipUsd,
            publicResilience: publicResilienceUsd,
          },
        },
        approvedAt: now.toISOString(),
      });
    }

    return NextResponse.json({
      protocol: PROTOCOL_VERSION,
      status: 'APPROVAL_COMPLETE',
      summary: {
        totalApproved: results.length,
      },
      results,
      meta: {
        engine: 'Macro-Asset Discovery — Gated Approval',
        timestamp: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Discovery] POST Error:', error);
    return NextResponse.json(
      { protocol: PROTOCOL_VERSION, error: 'INTERNAL_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
