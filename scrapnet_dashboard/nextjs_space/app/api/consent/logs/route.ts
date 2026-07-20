export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET - Get consent audit logs for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const logs = await prisma.consentLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      userId,
      totalLogs: logs.length,
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        consentType: log.consentType,
        previousValue: log.previousValue,
        newValue: log.newValue,
        logHash: log.logHash,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress,
      })),
    });
  } catch (error) {
    console.error('Error fetching consent logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent logs' },
      { status: 500 }
    );
  }
}
