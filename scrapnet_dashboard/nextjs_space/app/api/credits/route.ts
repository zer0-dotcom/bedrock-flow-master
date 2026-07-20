import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const farmerId = searchParams.get('farmerId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (farmerId) where.farmerId = farmerId;

    const credits = await prisma.farmerCredit.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: { farmer: true },
    });

    return NextResponse.json(credits);
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, creditIds } = body;

    if (action === 'issue') {
      // Issue pending credits
      const updated = await prisma.farmerCredit.updateMany({
        where: {
          id: { in: creditIds },
          status: 'pending',
        },
        data: {
          status: 'issued',
          issuedAt: new Date(),
        },
      });

      return NextResponse.json({ updated: updated.count });
    }

    if (action === 'redeem') {
      // Redeem issued credits
      const { tokenId, transactionHash } = body;
      
      const updated = await prisma.farmerCredit.updateMany({
        where: {
          id: { in: creditIds },
          status: 'issued',
        },
        data: {
          status: 'redeemed',
          redeemedAt: new Date(),
          tokenId,
          transactionHash,
        },
      });

      return NextResponse.json({ updated: updated.count });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing credits:', error);
    return NextResponse.json({ error: 'Failed to process credits' }, { status: 500 });
  }
}
