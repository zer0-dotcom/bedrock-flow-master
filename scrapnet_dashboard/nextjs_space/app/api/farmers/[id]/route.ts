import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const farmer = await prisma.farmer.findUnique({
      where: { id },
      include: {
        biocharBatches: { take: 10, orderBy: { createdAt: 'desc' } },
        credits: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    }

    return NextResponse.json(farmer);
  } catch (error) {
    console.error('Error fetching farmer:', error);
    return NextResponse.json({ error: 'Failed to fetch farmer' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.farmName !== undefined) updateData.farmName = body.farmName;
    if (body.farmLocation !== undefined) updateData.farmLocation = body.farmLocation;
    if (body.gpsCoordinates !== undefined) updateData.gpsCoordinates = body.gpsCoordinates;
    if (body.isVerified !== undefined) {
      updateData.isVerified = body.isVerified;
      if (body.isVerified) {
        updateData.verifiedAt = new Date();
      }
    }

    const farmer = await prisma.farmer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(farmer);
  } catch (error) {
    console.error('Error updating farmer:', error);
    return NextResponse.json({ error: 'Failed to update farmer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.farmer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting farmer:', error);
    return NextResponse.json({ error: 'Failed to delete farmer' }, { status: 500 });
  }
}
