import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verified = searchParams.get('verified');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};
    if (verified === 'true') where.isVerified = true;
    if (verified === 'false') where.isVerified = false;

    const farmers = await prisma.farmer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: { biocharBatches: true, credits: true },
        },
      },
    });

    return NextResponse.json(farmers);
  } catch (error) {
    console.error('Error fetching farmers:', error);
    return NextResponse.json({ error: 'Failed to fetch farmers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const farmer = await prisma.farmer.create({
      data: {
        farmerId: `FARMER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        farmName: body.farmName || null,
        farmLocation: body.farmLocation || null,
        gpsCoordinates: body.gpsCoordinates || null,
        isVerified: false,
      },
    });

    return NextResponse.json(farmer);
  } catch (error) {
    console.error('Error creating farmer:', error);
    return NextResponse.json({ error: 'Failed to create farmer' }, { status: 500 });
  }
}
