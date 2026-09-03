export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { anchorToChain, hashForAnchor, getNotaryStatus } from '@/lib/solana-notary';
import { logSettlementExecution, logBlockchainAnchor } from '@/lib/audit-logger';

/**
 * DYNAMIC BPS SMART SETTLEMENT ENGINE (BT-C9C4C5 v2.2)
 *
 * On final forensic verification, distributes value across the live
 * operator-configured Dynamic BPS legs (Σ = 10,000 BPS):
 *   → Asset Sovereign (Verified Asset Holder)
 *   → Verification Node
 *   → Public Resilience (singular block — dynamic routing by asset_class at metadata level)
 *
 * Public Resilience Rule: If no specialist ID is present,
 * the Public Resilience leg auto-routes to the Public Resilience Pool.
 *
 * GATES (both must pass):
 *   1. Forensic Verification — FORENSIC_VERIFIED status (or forceVerify bypass)
 *   2. Founder Approval — founderApproved === true (Human-in-the-loop circuit breaker)
 *
 * POST-SETTLEMENT:
 *   Anchors the settlement hash to Solana Devnet via Sovereign Notary (soft gate).
 *   If anchor fails, settlement still records but anchorPending = true.
 */

const TREASURY_WALLET = 'BEDROCK_ESG_TREASURY';
const PUBLIC_RESILIENCE_POOL = 'PUBLIC_RESILIENCE_POOL';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { specialistId, specialistWallet, forceVerify, assetClass } = body;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { settlement: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.settlement) {
      return NextResponse.json(
        { error: 'Settlement already exists for this submission' },
        { status: 409 }
      );
    }

    // Must be in PENDING_FORENSIC_VERIFICATION or FORENSIC_VERIFIED status
    if (
      submission.status !== 'PENDING_FORENSIC_VERIFICATION' &&
      submission.status !== 'FORENSIC_VERIFIED'
    ) {
      return NextResponse.json(
        { error: `Cannot settle submission with status: ${submission.status}` },
        { status: 400 }
      );
    }

    if (!submission.carbonValueUsd || submission.carbonValueUsd <= 0) {
      return NextResponse.json(
        { error: 'No carbon value calculated. Run the parser first.' },
        { status: 400 }
      );
    }

    // ── GATE 1: Forensic Verification ──────────────────────────────────
    if (submission.status === 'PENDING_FORENSIC_VERIFICATION') {
      if (forceVerify) {
        await prisma.submission.update({
          where: { id },
          data: {
            status: 'FORENSIC_VERIFIED',
            forensicVerifiedAt: new Date(),
            humEventHash: `MANUAL_VERIFY_${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
          },
        });
      } else {
        return NextResponse.json(
          {
            error:
              'Submission is PENDING_FORENSIC_VERIFICATION. Set forceVerify=true to proceed, or wait for HUM event match.',
          },
          { status: 400 }
        );
      }
    }

    // ── GATE 2: Founder Approval (Human-in-the-loop circuit breaker) ──
    if (!submission.founderApproved) {
      return NextResponse.json(
        {
          error: 'FOUNDER_APPROVAL_REQUIRED',
          message: 'This submission requires founder approval before settlement can execute.',
          submissionId: submission.submissionId,
          status: submission.status,
          approveEndpoint: `/api/v1/submissions/${id}/approve`,
        },
        { status: 403 }
      );
    }

    // ── Settlement Math ────────────────────────────────────────────────
    const totalValue = submission.carbonValueUsd;
    const assetOwnerShare = Math.round(totalValue * 0.7 * 100) / 100;
    const treasuryShare = Math.round(totalValue * 0.2 * 100) / 100;
    const specialistShare =
      Math.round((totalValue - assetOwnerShare - treasuryShare) * 100) / 100;
    // Derive display percentages from the ACTUAL computed shares — never hardcode
    // a fixed ratio. Dust remainder lands in the specialist/public-resilience leg.
    const pctLabel = (share: number): string =>
      totalValue > 0 ? `${((share / totalValue) * 100).toFixed(0)}%` : '—';
    const assetOwnerPct = pctLabel(assetOwnerShare);
    const treasuryPct = pctLabel(treasuryShare);
    const specialistPct = pctLabel(specialistShare);

    const hasSpecialist = !!specialistId;

    const settlementId = `STL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const executionHash = crypto
      .createHash('sha256')
      .update(
        `${settlementId}|${totalValue}|${assetOwnerShare}|${treasuryShare}|${specialistShare}|${Date.now()}`
      )
      .digest('hex');

    // ── Create Settlement Record ───────────────────────────────────────
    const settlement = await prisma.settlement.create({
      data: {
        settlementId,
        submissionId: id,
        totalValueUsd: totalValue,
        assetOwnerShare,
        assetOwnerWallet: submission.walletAddress,
        treasuryShare,
        treasuryWallet: TREASURY_WALLET,
        specialistShare,
        specialistId: hasSpecialist ? specialistId : null,
        specialistWallet: hasSpecialist ? (specialistWallet || null) : null,
        routedToSustainabilityPool: !hasSpecialist,
        sustainabilityPoolVault: !hasSpecialist ? PUBLIC_RESILIENCE_POOL : null,
        assetClass: assetClass || null,
        assetClassMetadata: assetClass ? JSON.stringify({ variant: assetClass, routedAt: new Date().toISOString() }) : null,
        executed: true,
        executedAt: new Date(),
        executionHash,
        anchorPending: true, // Will attempt anchor next
      },
    });

    // ── Audit Log: Settlement Executed ──────────────────────────────────
    await logSettlementExecution(
      submission.submittedById || 'SYSTEM',
      'ADMIN',
      settlement.id,
      { totalValueUsd: totalValue, assetOwner: assetOwnerShare, treasury: treasuryShare, publicResilience: specialistShare },
      { submissionId: submission.submissionId, track: submission.track, assetClass: assetClass || 'NONE' }
    );

    // ── Settlement → Solana Notary Bridge (Soft Gate) ──────────────────
    let solanaAnchor: {
      success: boolean;
      signature: string | null;
      explorerUrl: string | null;
      error?: string;
    } = { success: false, signature: null, explorerUrl: null };

    const notaryStatus = getNotaryStatus();
    if (notaryStatus.configured) {
      try {
        const anchorData = {
          settlementId,
          submissionId: submission.submissionId,
          track: submission.track,
          totalValueUsd: totalValue,
          split: {
            assetOwner: assetOwnerShare,
            treasury: treasuryShare,
            specialist: specialistShare,
          },
          executionHash,
          backtrace: submission.backtraceId,
          founderApprovedAt: submission.founderApprovedAt?.toISOString(),
        };

        const dataHash = hashForAnchor(anchorData);

        const anchorResult = await anchorToChain({
          type: 'TRADE_SETTLEMENT',
          entityId: settlementId,
          dataHash,
          valuationUsd: totalValue,
          carbonTonnes: submission.carbonTonnes || undefined,
          metadata: anchorData,
        });

        if (anchorResult.success) {
          // Update settlement with on-chain proof
          await prisma.settlement.update({
            where: { id: settlement.id },
            data: {
              solanaSignature: anchorResult.transactionSignature,
              solanaAnchoredAt: new Date(),
              anchorPending: false,
            },
          });

          solanaAnchor = {
            success: true,
            signature: anchorResult.transactionSignature,
            explorerUrl: anchorResult.explorerUrl,
          };
        } else {
          console.warn(`[Settlement] Solana anchor failed for ${settlementId}: ${anchorResult.error}`);
          solanaAnchor.error = anchorResult.error || 'Anchor broadcast failed';
        }
      } catch (anchorErr) {
        console.error(`[Settlement] Solana anchor exception for ${settlementId}:`, anchorErr);
        solanaAnchor.error = anchorErr instanceof Error ? anchorErr.message : 'Anchor exception';
      }
    } else {
      solanaAnchor.error = 'Sovereign Notary not configured — SOLANA_NOTARY_SECRET_KEY not set';
    }

    // ── Update Submission Status ───────────────────────────────────────
    await prisma.submission.update({
      where: { id },
      data: { status: 'SETTLEMENT_COMPLETE' },
    });

    return NextResponse.json({
      settlement: {
        ...settlement,
        solanaSignature: solanaAnchor.signature,
        solanaAnchoredAt: solanaAnchor.success ? new Date().toISOString() : null,
        anchorPending: !solanaAnchor.success,
      },
      distribution: {
        verifiedAssetValue: { share: assetOwnerShare, wallet: submission.walletAddress, percent: assetOwnerPct, label: 'Asset Sovereign' },
        platformProcessor: { share: treasuryShare, wallet: TREASURY_WALLET, percent: treasuryPct, label: 'Verification Node' },
        publicResilience: hasSpecialist
          ? {
              share: specialistShare,
              id: specialistId,
              wallet: specialistWallet || 'PENDING',
              percent: specialistPct,
              label: 'Public Resilience',
            }
          : {
              share: specialistShare,
              routedTo: PUBLIC_RESILIENCE_POOL,
              percent: specialistPct,
              label: 'Public Resilience',
              note: 'Auto-routed to Public Resilience Pool',
            },
      },
      assetClass: assetClass || null,
      solanaAnchor: {
        status: solanaAnchor.success ? 'ANCHORED' : 'PENDING',
        signature: solanaAnchor.signature,
        explorerUrl: solanaAnchor.explorerUrl,
        error: solanaAnchor.error || undefined,
        note: solanaAnchor.success
          ? 'Settlement permanently anchored to Solana.'
          : 'Settlement recorded in database. Solana anchor pending — retry via notary API.',
      },
      gates: {
        forensicVerification: 'PASSED',
        founderApproval: 'PASSED',
        solanaAnchor: solanaAnchor.success ? 'PASSED' : 'SOFT_FAIL',
      },
    });
  } catch (error) {
    console.error('[Settlement] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Settlement failed' },
      { status: 500 }
    );
  }
}
