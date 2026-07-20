export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { protocolSuccess, protocolError, generateBacktrace } from '@/lib/aethexer-protocol';

/**
 * FOUNDER APPROVAL GATE — Human-in-the-Loop Circuit Breaker
 *
 * PATCH /api/v1/submissions/[id]/approve
 *
 * Protected by JWT (founder/dashboard auth only).
 * Sets the founderApproved flag that gates settlement execution.
 *
 * Body:
 *   { approved: boolean, note?: string }
 *
 * State Machine:
 *   PENDING_FORENSIC_VERIFICATION or FORENSIC_VERIFIED → founderApproved = true
 *   Any status → founderApproved = false (revoke)
 */

const JWT_SECRET = process.env.JWT_SECRET || 'bedrockEsg-secret-key-change-in-production';

function verifyJwt(request: NextRequest): { valid: boolean; userId?: string; error?: string } {
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) return { valid: false, error: 'No authentication token provided.' };

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return { valid: true, userId: decoded.userId };
  } catch {
    return { valid: false, error: 'Invalid or expired authentication token.' };
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const backtrace = generateBacktrace();
  const { id } = await params;

  // ── Auth: JWT required (founder/dashboard only) ───────────────────
  const auth = verifyJwt(request);
  if (!auth.valid) {
    return protocolError('UNAUTHORIZED', auth.error || 'Authentication required.', 401, backtrace);
  }

  try {
    const body = await request.json();
    const { approved, note } = body;

    if (typeof approved !== 'boolean') {
      return protocolError(
        'INVALID_PAYLOAD',
        'Field "approved" (boolean) is required.',
        400,
        backtrace
      );
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { documents: true, settlement: true },
    });

    if (!submission) {
      return protocolError('NOT_FOUND', `Submission ${id} not found.`, 404, backtrace);
    }

    // Cannot approve if already settled
    if (submission.settlement) {
      return protocolError(
        'ALREADY_SETTLED',
        'Cannot modify approval on a settled submission.',
        409,
        backtrace
      );
    }

    // Must be past DRAFT to approve
    if (approved && submission.status === 'DRAFT') {
      return protocolError(
        'NOT_PARSED',
        'Submission is still in DRAFT. Run the forensic parser before requesting founder approval.',
        400,
        backtrace
      );
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        founderApproved: approved,
        founderApprovedAt: approved ? new Date() : null,
        founderApprovalNote: note || null,
      },
      include: { documents: true, settlement: true },
    });

    return protocolSuccess(
      {
        submissionId: updated.submissionId,
        id: updated.id,
        status: updated.status,
        founderApproved: updated.founderApproved,
        founderApprovedAt: updated.founderApprovedAt?.toISOString() || null,
        founderApprovalNote: updated.founderApprovalNote,
        approvedBy: auth.userId,
        nextStep: approved
          ? updated.status === 'FORENSIC_VERIFIED'
            ? `POST /api/submissions/${id}/settle to execute 70/20/10 settlement with Solana anchor.`
            : 'Awaiting forensic verification (HUM event match or forceVerify).'
          : 'Founder approval revoked. Settlement is blocked.',
      },
      backtrace
    );
  } catch (error) {
    console.error('[Founder Approval] Error:', error);
    return protocolError(
      'APPROVAL_FAILED',
      error instanceof Error ? error.message : 'Founder approval update failed.',
      500,
      backtrace
    );
  }
}

/**
 * GET /api/v1/submissions/[id]/approve
 *
 * Returns current approval status for a submission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const backtrace = generateBacktrace();
  const { id } = await params;

  const auth = verifyJwt(request);
  if (!auth.valid) {
    return protocolError('UNAUTHORIZED', auth.error || 'Authentication required.', 401, backtrace);
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        id: true,
        submissionId: true,
        status: true,
        founderApproved: true,
        founderApprovedAt: true,
        founderApprovalNote: true,
        settlement: { select: { id: true, settlementId: true } },
      },
    });

    if (!submission) {
      return protocolError('NOT_FOUND', `Submission ${id} not found.`, 404, backtrace);
    }

    return protocolSuccess(
      {
        submissionId: submission.submissionId,
        id: submission.id,
        status: submission.status,
        founderApproved: submission.founderApproved,
        founderApprovedAt: submission.founderApprovedAt?.toISOString() || null,
        founderApprovalNote: submission.founderApprovalNote,
        settled: !!submission.settlement,
        settlementId: submission.settlement?.settlementId || null,
      },
      backtrace
    );
  } catch (error) {
    console.error('[Founder Approval] GET Error:', error);
    return protocolError(
      'QUERY_FAILED',
      error instanceof Error ? error.message : 'Failed to fetch approval status.',
      500,
      backtrace
    );
  }
}
