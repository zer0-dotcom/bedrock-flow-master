export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface MonthlyRow {
  month: string;
  carbonSaved: number | string | null;
  avgCarbonScore: number | string | null;
  projectCount: number | string | null;
  avgRapUsage: number | string | null;
}

export async function GET() {
  try {
    const [totalProjects, aggregates, greenTargetCount, monthlyData] = await Promise.all([
      prisma.project.count(),
      prisma.project.aggregate({
        _sum: {
          tonsCo2Saved: true,
        },
        _avg: {
          carbonScore: true,
          targetRapPercentage: true,
        },
      }),
      prisma.project.count({
        where: { meetsGreenTarget: true },
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

    const stats = {
      totalProjects,
      totalCarbonSaved: aggregates._sum?.tonsCo2Saved ?? 0,
      averageCarbonScore: aggregates._avg?.carbonScore ?? 0,
      averageRapUsage: aggregates._avg?.targetRapPercentage ?? 0,
      projectsMeetingGreenTarget: greenTargetCount,
      greenTargetPercentage: totalProjects > 0 ? (greenTargetCount / totalProjects) * 100 : 0,
      monthlyData: (monthlyData ?? []).map((m: MonthlyRow) => ({
        month: m?.month ?? '',
        carbonSaved: parseFloat(String(m?.carbonSaved ?? 0)),
        avgCarbonScore: parseFloat(String(m?.avgCarbonScore ?? 0)),
        projectCount: parseInt(String(m?.projectCount ?? 0)),
        avgRapUsage: parseFloat(String(m?.avgRapUsage ?? 0)),
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    // SSR-safe fallback: mirror the success `stats` shape with neutral/zeroed
    // values and empty lists so a Prisma/DB failure never yields a 500.
    const stats = {
      totalProjects: 0,
      totalCarbonSaved: 0,
      averageCarbonScore: 0,
      averageRapUsage: 0,
      projectsMeetingGreenTarget: 0,
      greenTargetPercentage: 0,
      monthlyData: [],
    };
    return NextResponse.json(stats);
  }
}
