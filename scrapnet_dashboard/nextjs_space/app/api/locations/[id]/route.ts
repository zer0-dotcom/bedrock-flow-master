import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/locations/[id]
 * Get a specific location by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            users: true,
            recyclingLogs: true,
            biocharBatches: true,
          },
        },
        users: {
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        locationId: location.locationId,
        name: location.name,
        type: location.type,
        address: location.address,
        gpsCoordinates: location.gpsCoordinates,
        isActive: location.isActive,
        capacity: location.capacity,
        certifications: location.certifications ? JSON.parse(location.certifications) : [],
        contactName: location.contactName,
        contactPhone: location.contactPhone,
        contactEmail: location.contactEmail,
        usersCount: location._count.users,
        recyclingLogsCount: location._count.recyclingLogs,
        biocharBatchesCount: location._count.biocharBatches,
        recentUsers: location.users,
        createdAt: location.createdAt.toISOString(),
        updatedAt: location.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/locations/[id]
 * Update a location
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      name,
      type,
      address,
      gpsCoordinates,
      isActive,
      capacity,
      certifications,
      contactName,
      contactPhone,
      contactEmail,
    } = body;

    // Validate type if provided
    if (type) {
      const validTypes = ['RECYCLING_CENTER', 'BIOCHAR_FACILITY', 'HYBRID'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { success: false, error: `Invalid location type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(address !== undefined && { address }),
        ...(gpsCoordinates !== undefined && { gpsCoordinates }),
        ...(isActive !== undefined && { isActive }),
        ...(capacity !== undefined && { capacity }),
        ...(certifications !== undefined && { certifications: JSON.stringify(certifications) }),
        ...(contactName !== undefined && { contactName }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactEmail !== undefined && { contactEmail }),
      },
    });

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        locationId: location.locationId,
        name: location.name,
        type: location.type,
        address: location.address,
        gpsCoordinates: location.gpsCoordinates,
        isActive: location.isActive,
        capacity: location.capacity,
        certifications: location.certifications ? JSON.parse(location.certifications) : [],
        contactName: location.contactName,
        contactPhone: location.contactPhone,
        contactEmail: location.contactEmail,
        updatedAt: location.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/locations/[id]
 * Delete a location (soft delete by setting isActive to false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Check if location has related records
      const location = await prisma.location.findUnique({
        where: { id },
        include: {
          _count: {
            select: { 
              users: true,
              recyclingLogs: true,
              biocharBatches: true,
            },
          },
        },
      });

      if (!location) {
        return NextResponse.json(
          { success: false, error: 'Location not found' },
          { status: 404 }
        );
      }

      const totalRelated = location._count.users + location._count.recyclingLogs + location._count.biocharBatches;
      if (totalRelated > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete location with associated records. Use soft delete instead.',
            relatedCounts: location._count,
          },
          { status: 400 }
        );
      }

      await prisma.location.delete({ where: { id } });
    } else {
      // Soft delete
      await prisma.location.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Location permanently deleted' : 'Location deactivated',
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
