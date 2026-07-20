export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// GET: List submissions with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track');
    const status = searchParams.get('status');
    const wallet = searchParams.get('wallet');

    const where: Record<string, unknown> = {};
    if (track) where.track = track;
    if (status) where.status = status;
    if (wallet) where.walletAddress = wallet;

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        documents: true,
        settlement: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('[Submissions] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// POST: Create a new submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { track, walletAddress, companyName, documents } = body;

    if (!track || !walletAddress) {
      return NextResponse.json(
        { error: 'track and walletAddress are required' },
        { status: 400 }
      );
    }

    const validTracks = ['TRACK_A_MATERIALS', 'TRACK_B_ENERGY_179D', 'TRACK_C_BIOCHAR_CDR'];
    if (!validTracks.includes(track)) {
      return NextResponse.json({ error: 'Invalid track' }, { status: 400 });
    }

    const submissionId = `SUB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const submission = await prisma.submission.create({
      data: {
        submissionId,
        track,
        walletAddress,
        companyName: companyName || null,
        status: 'DRAFT',
        documents: documents?.length
          ? {
              create: documents.map((doc: {
                fileName: string;
                fileType: string;
                fileSizeBytes: number;
                cloudStoragePath: string;
                fileHash: string;
              }) => ({
                fileName: doc.fileName,
                fileType: doc.fileType,
                fileSizeBytes: doc.fileSizeBytes,
                cloudStoragePath: doc.cloudStoragePath,
                fileHash: doc.fileHash,
              })),
            }
          : undefined,
      },
      include: { documents: true },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error('[Submissions] POST error:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
