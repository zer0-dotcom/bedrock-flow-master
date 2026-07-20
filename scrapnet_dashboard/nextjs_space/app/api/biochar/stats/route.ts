import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [batchStats, farmerStats, highStabilityCount] = await Promise.all([
      prisma.biocharBatch.aggregate({
        _count: { id: true },
        _sum: {
          cdrCreditsTonnes: true,
          biocharYieldKg: true,
          dryWeightKg: true,
          permanenceFactor: true,
        },
        _avg: {
          permanenceFactor: true,
        },
      }),
      prisma.farmer.aggregate({
        _count: { id: true },
        _sum: { totalCreditsEarned: true },
      }),
      prisma.biocharBatch.count({
        where: { stabilityClass: 'high' },
      }),
    ]);

    const totalBatches = batchStats._count.id || 0;
    const highStabilityPercentage = totalBatches > 0 
      ? (highStabilityCount / totalBatches) * 100 
      : 0;

    return NextResponse.json({
      totalBatches,
      totalCdrCredits: batchStats._sum.cdrCreditsTonnes || 0,
      totalBiocharYield: batchStats._sum.biocharYieldKg || 0,
      totalFeedstockProcessed: batchStats._sum.dryWeightKg || 0,
      averageStabilityScore: batchStats._avg.permanenceFactor || 0,
      highStabilityPercentage,
      totalFarmers: farmerStats._count.id || 0,
      totalFarmerCredits: farmerStats._sum.totalCreditsEarned || 0,
    });
  } catch (error) {
    console.error('Error fetching biochar stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
