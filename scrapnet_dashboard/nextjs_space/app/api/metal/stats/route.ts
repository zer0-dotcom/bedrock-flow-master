import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Total logs and verified logs
    const [totalLogs, verifiedLogs] = await Promise.all([
      prisma.metalRecoveryLog.count(),
      prisma.metalRecoveryLog.count({
        where: { verificationStatus: 'VERIFIED' },
      }),
    ]);

    // Aggregate avoided emissions
    const emissionsAgg = await prisma.metalRecoveryLog.aggregate({
      _sum: {
        avoidedEmissionsKg: true,
        weightKg: true,
      },
    });

    // Verified emissions only
    const verifiedEmissionsAgg = await prisma.metalRecoveryLog.aggregate({
      where: { verificationStatus: 'VERIFIED' },
      _sum: {
        avoidedEmissionsKg: true,
        weightKg: true,
      },
    });

    // Group by metal type
    const byMetalType = await prisma.metalRecoveryLog.groupBy({
      by: ['metalType'],
      _sum: {
        weightKg: true,
        avoidedEmissionsKg: true,
      },
      _count: true,
    });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAgg = await prisma.metalRecoveryLog.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        avoidedEmissionsKg: true,
        weightKg: true,
      },
      _count: true,
    });

    const totalAvoidedKg = emissionsAgg._sum.avoidedEmissionsKg || 0;
    const totalAvoidedTonnes = totalAvoidedKg / 1000;
    const verifiedAvoidedKg = verifiedEmissionsAgg._sum.avoidedEmissionsKg || 0;
    const verifiedAvoidedTonnes = verifiedAvoidedKg / 1000;

    return NextResponse.json({
      totalLogs,
      verifiedLogs,
      pendingLogs: totalLogs - verifiedLogs,
      totalWeightKg: emissionsAgg._sum.weightKg || 0,
      verifiedWeightKg: verifiedEmissionsAgg._sum.weightKg || 0,
      totalAvoidedEmissionsKg: totalAvoidedKg,
      totalAvoidedEmissionsTonnes: totalAvoidedTonnes,
      verifiedAvoidedEmissionsKg: verifiedAvoidedKg,
      verifiedAvoidedEmissionsTonnes: verifiedAvoidedTonnes,
      byMetalType: byMetalType.map((item: { metalType: string; _count: number; _sum: { weightKg: number | null; avoidedEmissionsKg: number | null } }) => ({
        metalType: item.metalType,
        count: item._count,
        totalWeightKg: item._sum.weightKg || 0,
        avoidedEmissionsKg: item._sum.avoidedEmissionsKg || 0,
      })),
      recentActivity: {
        logsCount: recentAgg._count || 0,
        weightKg: recentAgg._sum.weightKg || 0,
        avoidedEmissionsKg: recentAgg._sum.avoidedEmissionsKg || 0,
      },
      // Carbon equivalencies
      equivalentTreesPlanted: Math.round(totalAvoidedKg / 21),
      equivalentCarMilesAvoided: Math.round(totalAvoidedKg / 0.411),
    });
  } catch (error) {
    console.error('Error fetching metal stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metal statistics' },
      { status: 500 }
    );
  }
}
