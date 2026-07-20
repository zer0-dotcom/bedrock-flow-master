export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withRbac } from '@/lib/rbac-guard';

/**
 * GET /api/audit-logs — Query audit trail (ADMIN+ only)
 * Query params: eventType, entityType, entityId, limit, offset
 */
export const GET = withRbac('audit_logs:view', async (req) => {
  const url = new URL(req.url);
  const eventType = url.searchParams.get('eventType');
  const entityType = url.searchParams.get('entityType');
  const entityId = url.searchParams.get('entityId');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const where: Record<string, unknown> = {};
  if (eventType) where.eventType = eventType;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: logs,
    pagination: { total, limit, offset },
  });
});
