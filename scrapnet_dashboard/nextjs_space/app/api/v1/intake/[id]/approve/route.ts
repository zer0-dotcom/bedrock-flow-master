// app/api/v1/intake/[id]/approve/route.ts
// Sprint 5 — CorporateIntake approval gate.
// POST, guarded FOUNDER/ADMIN (platform:manage). Additive-only; NO on-chain writes.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractUser } from '@/lib/rbac-guard';
import { hasAnyPermission } from '@/lib/rbac';
import { anchorToChain, hashForAnchor, getNotaryStatus } from '@/lib/solana-notary';

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
  let clientWalletAddress: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.clientWalletAddress === 'string' && body.clientWalletAddress.trim()) {
      clientWalletAddress = body.clientWalletAddress.trim();
    }
  } catch {
    clientWalletAddress = null;
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

  // ── Approve ──────────────────────────────────────────────────────
  const approvedAt = new Date();
  const updatedIntake = await prisma.corporateIntake.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedBy: user.id,
      approvedAt,
      clientWalletAddress,
    },
  });

  // ── Guarded, opt-in post-approval notary attestation ─────────────
  // Non-blocking: if the notary is unconfigured or the anchor fails, the
  // approval stands and attestationTxSig remains null. No rollback.
  const notaryStatus = getNotaryStatus();
  let attestationTxSig: string | null = null;
  let attestationError: string | null = null;

  if (notaryStatus.configured) {
    try {
      const anchorData = {
        submissionRef: intake.submissionRef,
        action: 'CORPORATE_INTAKE_APPROVED',
        operator: user.id,
        approvedAt: approvedAt.toISOString(),
        clientWalletAddress: clientWalletAddress ?? null,
      };
      const r = await anchorToChain({
        type: 'CORPORATE_INTAKE_APPROVED',
        entityId: intake.submissionRef,
        dataHash: hashForAnchor(anchorData),
        metadata: anchorData,
      });
      if (r.success) {
        attestationTxSig = r.transactionSignature;
        await prisma.corporateIntake.update({
          where: { id },
          data: { attestationTxSig },
        });
      } else {
        attestationError = r.error ?? 'Attestation failed';
      }
    } catch (err: any) {
      attestationError = err?.message ?? 'Attestation failed';
      console.error('[notary] anchorToChain failed:', attestationError);
    }
  } else {
    attestationError = 'Notary not configured — attestation skipped';
  }

  return NextResponse.json({
    success: true,
    id,
    status: 'APPROVED',
    approvedAt: updatedIntake.approvedAt,
    attestationTxSig,
    attestationError,
  });
}
