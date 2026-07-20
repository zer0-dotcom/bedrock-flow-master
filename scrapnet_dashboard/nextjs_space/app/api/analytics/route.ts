export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface ProjectSelect {
  createdAt: Date;
  tonsCo2Saved: number;
  carbonScore: number;
  targetRapPercentage: number;
  mixType: string;
  meetsGreenTarget: boolean;
}

interface MonthlyRow {
  month: string;
  carbonSaved: number | string | null;
  avgCarbonScore: number | string | null;
  projectCount: number | string | null;
  avgRapUsage: number | string | null;
}

export async function GET() {
  try {
    const [projects, mixTypeDistribution, monthlyData] = await Promise.all([
      prisma.project.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          createdAt: true,
          tonsCo2Saved: true,
          carbonScore: true,
          targetRapPercentage: true,
          mixType: true,
          meetsGreenTarget: true,
        },
      }),
      prisma.project.groupBy({
        by: ['mixType'],
        _count: { _all: true },
      }),
      prisma.$queryRaw<MonthlyRow[]>`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          SUM(tons_co2_saved) as "carbonSaved",
          AVG(carbon_score) as "avgCarbonScore",
          COUNT(*) as "projectCount",
          AVG(target_rap_percentage) as "avgRapUsage"
        FROM projects
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `,
    ]);

    // Calculate cumulative carbon savings
    let cumulative = 0;
    const cumulativeSavings = (projects ?? []).map((p: ProjectSelect) => {
      cumulative += p?.tonsCo2Saved ?? 0;
      return {
        date: p?.createdAt?.toISOString?.()?.split('T')?.[0] ?? '',
        cumulative: parseFloat(cumulative.toFixed(2)),
        individual: p?.tonsCo2Saved ?? 0,
      };
    });

    // RAP usage trends
    const rapTrends = (monthlyData ?? []).map((m: MonthlyRow) => ({
      month: m?.month ?? '',
      avgRapUsage: parseFloat(String(m?.avgRapUsage ?? 0)),
      projectCount: parseInt(String(m?.projectCount ?? 0)),
    }));

    // Mix type distribution
    const mixDistribution = (mixTypeDistribution ?? []).map((m) => ({
      name: m?.mixType ?? 'Unknown',
      value: m?._count?._all ?? 0,
    }));

    // Monthly carbon performance
    const monthlyPerformance = (monthlyData ?? []).map((m: MonthlyRow) => ({
      month: m?.month ?? '',
      avgCarbonScore: parseFloat(String(m?.avgCarbonScore ?? 0)),
      projectCount: parseInt(String(m?.projectCount ?? 0)),
    }));

    // Summary stats
    const totalCO2Saved = (projects ?? []).reduce((sum: number, p: ProjectSelect) => sum + (p?.tonsCo2Saved ?? 0), 0);
    const avgRapUsage = projects?.length > 0
      ? (projects ?? []).reduce((sum: number, p: ProjectSelect) => sum + (p?.targetRapPercentage ?? 0), 0) / projects.length
      : 0;
    const greenTargetCount = (projects ?? []).filter((p: ProjectSelect) => p?.meetsGreenTarget)?.length ?? 0;
    const greenTargetPercentage = projects?.length > 0
      ? (greenTargetCount / projects.length) * 100
      : 0;

    return NextResponse.json({
      cumulativeSavings,
      rapTrends,
      mixDistribution,
      monthlyPerformance,
      summary: {
        totalCO2Saved: parseFloat(totalCO2Saved.toFixed(2)),
        avgRapUsage: parseFloat(avgRapUsage.toFixed(2)),
        greenTargetPercentage: parseFloat(greenTargetPercentage.toFixed(1)),
        totalProjects: projects?.length ?? 0,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
