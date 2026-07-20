import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/leaderboard
 * Returns top 10 agents sorted by totalAgentCommission
 * Includes count of linked farmers (referrals)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Find all farmers who are agents (have referrals pointing to them)
    // and sort by totalAgentCommission
    const agents = await prisma.farmer.findMany({
      where: {
        // Only include farmers who have at least one referral OR have earned commission
        OR: [
          { referrals: { some: {} } },
          { totalAgentCommission: { gt: 0 } },
        ],
      },
      orderBy: {
        totalAgentCommission: 'desc',
      },
      take: limit,
      include: {
        _count: {
          select: {
            referrals: true,  // Count of farmers linked to this agent
          },
        },
      },
    });

    // Format response
    const leaderboard = agents.map((agent, index) => ({
      rank: index + 1,
      agent_id: agent.id,
      farmer_id: agent.farmerId,
      name: agent.name,
      email: agent.email,
      farm_name: agent.farmName,
      is_verified: agent.isVerified,
      total_agent_commission: agent.totalAgentCommission,
      linked_farmers_count: agent._count.referrals,
      total_feedstock_kg: agent.totalFeedstockKg,
      total_credits_earned: agent.totalCreditsEarned,
      created_at: agent.createdAt.toISOString(),
    }));

    // Calculate aggregate stats
    const totalCommissions = agents.reduce((sum, a) => sum + a.totalAgentCommission, 0);
    const totalLinkedFarmers = agents.reduce((sum, a) => sum + a._count.referrals, 0);

    return NextResponse.json({
      success: true,
      leaderboard,
      stats: {
        total_agents: agents.length,
        total_commissions: totalCommissions,
        total_linked_farmers: totalLinkedFarmers,
        average_commission: agents.length > 0 ? totalCommissions / agents.length : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching agent leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
