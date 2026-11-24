// app/api/v1/intake/route.ts
// Sprint 5 — CorporateIntake queue listing.
// GET, guarded FOUNDER/ADMIN (platform:manage). Paginated, status-filtered.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractUser } from '@/lib/rbac-guard';
import { hasAnyPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  // ── Auth: FOUNDER / ADMIN only ───────────────────────────────────
  const user = extractUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required' },
      { status: 401 },
    );
  }
  if (!hasAnyPermission(user.role, ['platform:manage'])) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Founder or Admin session required.', role: user.role },
      { status: 403 },
    );
  }

  // ── Query params ─────────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') ?? 'PENDING_FORENSIC_REVIEW';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10) || 25));

  const where = statusParam === 'ALL' ? {} : { status: statusParam };

  const [total, rows] = await Promise.all([
    prisma.corporateIntake.count({ where }),
    prisma.corporateIntake.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        submissionRef: true,
        companyName: true,
        contactName: true,
        contactEmail: true,
        fileName: true,
        fileSizeBytes: true,
        fileHash: true,
        status: true,
        referralCode: true,
        clientWalletAddress: true,
        attestationTxSig: true,
        approvedBy: true,
        approvedAt: true,
        rejectedBy: true,
        rejectedAt: true,
        rejectionReason: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ rows, total, page, limit });
}
