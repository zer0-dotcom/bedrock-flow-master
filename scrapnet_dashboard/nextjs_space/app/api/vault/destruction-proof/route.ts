import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// POST - Submit destruction proof with video hash
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      verificationId,
      videoUrl,
      videoHash, // Pre-computed SHA-256 hash of video file
      destructionMethod,
      witnesses,
      operatorId,
    } = body;

    if (!verificationId || !videoUrl || !destructionMethod || !operatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: verificationId, videoUrl, destructionMethod, operatorId' },
        { status: 400 }
      );
    }

    // Fetch verification
    const verification = await prisma.vaultVerification.findUnique({
      where: { id: verificationId },
      include: { vaultNode: true },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Check status allows destruction proof
    const allowedStatuses = ['AI_VERIFIED', 'AI_FLAGGED', 'PENDING_DESTRUCTION'];
    if (!allowedStatuses.includes(verification.status)) {
      return NextResponse.json(
        { error: `Cannot submit destruction proof for status: ${verification.status}` },
        { status: 400 }
      );
    }

    // Verify operator has approval rights
    const operator = await prisma.vaultNodeOperator.findFirst({
      where: {
        userId: operatorId,
        vaultNodeId: verification.vaultNodeId,
      },
    });

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not authorized for this vault' },
        { status: 403 }
      );
    }

    // Generate cryptographic hash if not provided
    const finalVideoHash = videoHash || crypto
      .createHash('sha256')
      .update(`${videoUrl}-${Date.now()}-${verificationId}`)
      .digest('hex');

    // Create blockchain-ready metadata
    const blockchainMetadata = {
      type: 'DESTRUCTION_PROOF',
      verificationId: verification.verificationId,
      vaultNodeId: verification.vaultNode.nodeId,
      currencyType: verification.currencyType,
      totalValue: verification.totalValue,
      valueCurrency: verification.valueCurrency,
      destructionMethod,
      videoHash: finalVideoHash,
      destructionTimestamp: new Date().toISOString(),
      witnesses: witnesses || [],
      aiConfidenceScore: verification.aiConfidenceScore,
      hashAlgorithm: 'SHA-256',
      chainTargets: ['Hedera HCS', 'Polygon'],
    };

    // Update verification with destruction proof
    const updated = await prisma.vaultVerification.update({
      where: { id: verificationId },
      data: {
        status: 'DESTRUCTION_UPLOADED',
        destructionVideoUrl: videoUrl,
        destructionVideoHash: finalVideoHash,
        destructionTimestamp: new Date(),
        destructionMethod,
        destructionWitnesses: witnesses ? JSON.stringify(witnesses) : null,
        verifiedById: operatorId,
        blockchainJson: JSON.stringify(blockchainMetadata),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Destruction proof submitted successfully',
      videoHash: finalVideoHash,
      blockchainMetadata,
      verification: updated,
    });
  } catch (error) {
    console.error('Destruction proof error:', error);
    return NextResponse.json({ error: 'Failed to submit destruction proof' }, { status: 500 });
  }
}

// PUT - Complete verification (final approval)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationId, approverId, action } = body;

    if (!verificationId || !approverId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const verification = await prisma.vaultVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Check approver has rights
    const approver = await prisma.vaultNodeOperator.findFirst({
      where: {
        userId: approverId,
        vaultNodeId: verification.vaultNodeId,
        canApprove: true,
      },
    });

    if (!approver) {
      return NextResponse.json(
        { error: 'User does not have approval rights' },
        { status: 403 }
      );
    }

    const newStatus = action === 'approve' ? 'COMPLETED' : 'REJECTED';

    const updated = await prisma.vaultVerification.update({
      where: { id: verificationId },
      data: {
        status: newStatus,
        verifiedById: approverId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Verification ${action === 'approve' ? 'completed' : 'rejected'}`,
      verification: updated,
    });
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
