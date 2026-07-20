import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [pending, issued, redeemed] = await Promise.all([
      prisma.farmerCredit.aggregate({
        where: { status: 'pending' },
        _count: { id: true },
        _sum: { creditAmount: true },
      }),
      prisma.farmerCredit.aggregate({
        where: { status: 'issued' },
        _count: { id: true },
        _sum: { creditAmount: true },
      }),
      prisma.farmerCredit.aggregate({
        where: { status: 'redeemed' },
        _count: { id: true },
        _sum: { creditAmount: true },
      }),
    ]);

    return NextResponse.json({
      pending: {
        count: pending._count.id || 0,
        amount: pending._sum.creditAmount || 0,
      },
      issued: {
        count: issued._count.id || 0,
        amount: issued._sum.creditAmount || 0,
      },
      redeemed: {
        count: redeemed._count.id || 0,
        amount: redeemed._sum.creditAmount || 0,
      },
      total: {
        count: (pending._count.id || 0) + (issued._count.id || 0) + (redeemed._count.id || 0),
        amount: (pending._sum.creditAmount || 0) + (issued._sum.creditAmount || 0) + (redeemed._sum.creditAmount || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching credit stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
