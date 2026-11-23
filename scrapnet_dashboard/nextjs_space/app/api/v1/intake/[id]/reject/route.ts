// app/api/v1/intake/[id]/reject/route.ts
// Sprint 5 — CorporateIntake rejection gate.
// POST, guarded FOUNDER/ADMIN (platform:manage). Additive-only; NO on-chain writes.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractUser } from '@/lib/rbac-guard';
import { hasAnyPermission } from '@/lib/rbac';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  // ── Optional body ────────────────────────────────────────────────
  let rejectionReason: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.rejectionReason === 'string' && body.rejectionReason.trim()) {
      rejectionReason = body.rejectionReason.trim();
    }
  } catch {
    rejectionReason = null;
  }

  // ── Load + guard state ───────────────────────────────────────────
  const intake = await prisma.corporateIntake.findUnique({ where: { id } });
  if (!intake) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Submission not found.' },
      { status: 404 },
    );
  }
  if (intake.status !== 'PENDING_FORENSIC_REVIEW') {
    return NextResponse.json(
      { error: 'CONFLICT', message: `Submission is not pending review.`, status: intake.status },
      { status: 409 },
    );
  }

  // ── Reject ───────────────────────────────────────────────────────
  const rejectedAt = new Date();
  await prisma.corporateIntake.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectedBy: user.id,
      rejectedAt,
      rejectionReason,
    },
  });

  return NextResponse.json({ success: true, id, status: 'REJECTED', rejectedAt });
}
