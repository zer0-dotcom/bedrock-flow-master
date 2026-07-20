import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/agent/pending-counts
 * Returns counts of pending verification items for agents
 */
export async function GET() {
  try {
    // Get pending biochar batches count
    const pendingBiocharBatches = await prisma.biocharBatch.count({
      where: {
        verificationStatus: 'PENDING',
      },
    });

    // Get pending recycling logs count
    const pendingRecyclingLogs = await prisma.recyclingLog.count({
      where: {
        verificationStatus: 'PENDING',
      },
    });

    // Total pending items
    const totalPending = pendingBiocharBatches + pendingRecyclingLogs;

    return NextResponse.json({
      success: true,
      counts: {
        biocharBatches: pendingBiocharBatches,
        recyclingLogs: pendingRecyclingLogs,
        total: totalPending,
      },
    });
  } catch (error) {
    console.error('Error fetching pending counts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending counts' },
      { status: 500 }
    );
  }
}
