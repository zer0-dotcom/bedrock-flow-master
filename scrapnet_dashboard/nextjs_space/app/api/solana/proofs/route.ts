import { NextRequest, NextResponse } from 'next/server';
import { getUserAuditProofs } from '@/lib/solana-integration';

export const dynamic = 'force-dynamic';

/**
 * GET /api/solana/proofs?userId=xxx
 * Get user's Solana audit proofs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const proofs = await getUserAuditProofs(userId);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        totalProofs: proofs.length,
        proofs: proofs.map(proof => ({
          id: proof.id,
          transactionHash: proof.transactionHash,
          programId: proof.programId,
          walletAddress: proof.walletAddress,
          auditType: proof.auditType,
          carbonAmount: proof.carbonAmount,
          valueUsd: proof.valueUsd,
          status: proof.status,
          blockHeight: proof.blockHeight,
          confirmedAt: proof.confirmedAt,
          createdAt: proof.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Solana proofs API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
