import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/yards
 * DEPRECATED: Use /api/locations?type=RECYCLING_CENTER instead
 * 
 * This endpoint is maintained for backward compatibility.
 * Returns locations of type RECYCLING_CENTER formatted as yards.
 */
export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: {
        type: { in: ['RECYCLING_CENTER', 'HYBRID'] },
        isActive: true,
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    // Map to legacy yard format for backward compatibility
    return NextResponse.json({
      success: true,
      yards: locations.map((loc) => ({
        id: loc.id,
        yardId: loc.locationId,  // Map locationId to yardId
        name: loc.name,
        location: loc.address,   // Map address to location
        gpsCoordinates: loc.gpsCoordinates,
        usersCount: loc._count.users,
        createdAt: loc.createdAt.toISOString(),
        // New fields
        type: loc.type,
        isActive: loc.isActive,
      })),
      _deprecated: 'This endpoint is deprecated. Use /api/locations instead.',
    });
  } catch (error) {
    console.error('Error fetching yards:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch yards' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/yards
 * DEPRECATED: Use POST /api/locations instead
 * 
 * Creates a new location of type RECYCLING_CENTER
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, location: address, gpsCoordinates } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Yard name is required' },
        { status: 400 }
      );
    }

    // Generate location ID with RYC prefix (Recycling Center)
    const locationId = `RYC-${Date.now().toString(36).toUpperCase()}`;

    const loc = await prisma.location.create({
      data: {
        locationId,
        name,
        type: 'RECYCLING_CENTER',
        address,
        gpsCoordinates,
        isActive: true,
      },
    });

    // Return in legacy yard format
    return NextResponse.json({
      success: true,
      yard: {
        id: loc.id,
        yardId: loc.locationId,
        name: loc.name,
        location: loc.address,
        gpsCoordinates: loc.gpsCoordinates,
        createdAt: loc.createdAt.toISOString(),
        type: loc.type,
      },
      _deprecated: 'This endpoint is deprecated. Use POST /api/locations instead.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating yard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create yard' },
      { status: 500 }
    );
  }
}
