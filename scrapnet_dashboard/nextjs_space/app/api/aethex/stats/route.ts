export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/aethex/stats
 *
 * Returns live protocol telemetry from the Submission and Settlement models:
 *   - packetsCreated:    Total submissions (each submission = 1 digital packet)
 *   - emissionsSaved:    Sum of co2SavedKg across all settled submissions
 *   - verificationRate:  % of non-draft submissions that reached FORENSIC_VERIFIED or beyond
 *   - activeNodes:       Count of distinct wallet addresses with activity in the last 30 days
 *   - settlementsExecuted: Total settlements with executed = true
 *   - totalValueSettled: Sum of totalValueUsd for executed settlements
 *   - solanaAnchored:    Count of settlements with a solanaSignature
 *   - founderApproved:   Count of submissions with founderApproved = true
 */
export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalSubmissions,
      statusCounts,
      activeWallets,
      settlementAgg,
      solanaAnchoredCount,
      founderApprovedCount,
      emissionsAgg,
    ] = await Promise.all([
      // Total digital packets (submissions)
      prisma.submission.count(),

      // Count by status for verification rate calc
      prisma.submission.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Distinct active wallets in last 30 days
      prisma.submission.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { walletAddress: true },
        distinct: ['walletAddress'],
      }),

      // Settlement aggregates
      prisma.settlement.aggregate({
        where: { executed: true },
        _count: { id: true },
        _sum: { totalValueUsd: true },
      }),

      // Solana-anchored settlements
      prisma.settlement.count({
        where: { solanaSignature: { not: null } },
      }),

      // Founder-approved submissions
      prisma.submission.count({
        where: { founderApproved: true },
      }),

      // CO2 saved aggregate from submissions with carbonTonnes
      prisma.submission.aggregate({
        _sum: { carbonTonnes: true },
      }),
    ]);

    // Calculate verification rate
    const verifiedStatuses = ['FORENSIC_VERIFIED', 'SETTLEMENT_COMPLETE'];
    const nonDraftCount = statusCounts
      .filter((s) => s.status !== 'DRAFT')
      .reduce((sum, s) => sum + s._count.id, 0);
    const verifiedCount = statusCounts
      .filter((s) => verifiedStatuses.includes(s.status))
      .reduce((sum, s) => sum + s._count.id, 0);
    const verificationRate = nonDraftCount > 0
      ? Math.round((verifiedCount / nonDraftCount) * 100)
      : 100; // Default 100% when no submissions to verify

    return NextResponse.json({
      packetsCreated: totalSubmissions,
      emissionsSaved: (emissionsAgg._sum.carbonTonnes ?? 0) * 1000, // Convert tonnes to kg for display granularity
      verificationRate,
      activeNodes: activeWallets.length,
      settlementsExecuted: settlementAgg._count.id,
      totalValueSettled: settlementAgg._sum.totalValueUsd ?? 0,
      solanaAnchored: solanaAnchoredCount,
      founderApproved: founderApprovedCount,
    });
  } catch (error) {
    console.error('[Aethex Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch protocol stats' },
      { status: 500 }
    );
  }
}
