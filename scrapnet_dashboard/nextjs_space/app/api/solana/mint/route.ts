import { NextRequest, NextResponse } from 'next/server';
import { mintProofOfAudit, isValidSolanaAddress, SOLANA_PROGRAM_ID } from '@/lib/solana-integration';

export const dynamic = 'force-dynamic';

/**
 * POST /api/solana/mint
 * Mint Proof of Audit on Solana blockchain
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress, auditType, carbonAmount, valueUsd, metadata } = body;

    // Validation
    if (!userId || !walletAddress) {
      return NextResponse.json(
        { success: false, error: 'userId and walletAddress are required' },
        { status: 400 }
      );
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Solana wallet address format' },
        { status: 400 }
      );
    }

    const validAuditTypes = ['CARBON_CREDIT', 'LEGACY_AUDIT', 'RE_HOSPITALITY'];
    if (!validAuditTypes.includes(auditType)) {
      return NextResponse.json(
        { success: false, error: `Invalid auditType. Must be one of: ${validAuditTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof carbonAmount !== 'number' || carbonAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'carbonAmount must be a positive number' },
        { status: 400 }
      );
    }

    // Mint the proof
    const result = await mintProofOfAudit({
      userId,
      walletAddress,
      auditType,
      carbonAmount,
      valueUsd: valueUsd || carbonAmount * 85.0,
      metadata,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionHash: result.transactionHash,
        blockHeight: result.blockHeight,
        programId: SOLANA_PROGRAM_ID,
        message: result.message,
      },
    });
  } catch (error: any) {
    console.error('Solana mint API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
