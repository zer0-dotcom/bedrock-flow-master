import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/locations
 * List all locations with optional type filtering
 * 
 * Query params:
 *   - type: 'RECYCLING_CENTER' | 'BIOCHAR_FACILITY' | 'HYBRID' | 'all'
 *   - active: 'true' | 'false' (filter by isActive status)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const activeFilter = searchParams.get('active');

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (type !== 'all') {
      where.type = type;
    }
    
    if (activeFilter !== null) {
      where.isActive = activeFilter === 'true';
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: { name: 'asc' },
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

    return NextResponse.json({
      success: true,
      locations: locations.map((loc) => ({
        id: loc.id,
        locationId: loc.locationId,
        name: loc.name,
        type: loc.type,
        address: loc.address,
        gpsCoordinates: loc.gpsCoordinates,
        isActive: loc.isActive,
        capacity: loc.capacity,
        certifications: loc.certifications ? JSON.parse(loc.certifications) : [],
        contactName: loc.contactName,
        contactPhone: loc.contactPhone,
        contactEmail: loc.contactEmail,
        usersCount: loc._count.users,
        recyclingLogsCount: loc._count.recyclingLogs,
        biocharBatchesCount: loc._count.biocharBatches,
        createdAt: loc.createdAt.toISOString(),
        updatedAt: loc.updatedAt.toISOString(),
      })),
      counts: {
        total: locations.length,
        byType: {
          RECYCLING_CENTER: locations.filter(l => l.type === 'RECYCLING_CENTER').length,
          BIOCHAR_FACILITY: locations.filter(l => l.type === 'BIOCHAR_FACILITY').length,
          HYBRID: locations.filter(l => l.type === 'HYBRID').length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/locations
 * Create a new location
 * 
 * Body:
 *   - name: string (required)
 *   - type: 'RECYCLING_CENTER' | 'BIOCHAR_FACILITY' | 'HYBRID' (default: RECYCLING_CENTER)
 *   - address: string (optional)
 *   - gpsCoordinates: string (optional)
 *   - capacity: number (optional, tonnes/day)
 *   - certifications: string[] (optional)
 *   - contactName: string (optional)
 *   - contactPhone: string (optional)
 *   - contactEmail: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      type = 'RECYCLING_CENTER',
      address, 
      gpsCoordinates,
      capacity,
      certifications,
      contactName,
      contactPhone,
      contactEmail,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Location name is required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['RECYCLING_CENTER', 'BIOCHAR_FACILITY', 'HYBRID'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid location type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate location ID based on type
    const prefix = type === 'RECYCLING_CENTER' ? 'RYC' : 
                   type === 'BIOCHAR_FACILITY' ? 'BCF' : 'HYB';
    const locationId = `${prefix}-${Date.now().toString(36).toUpperCase()}`;

    const location = await prisma.location.create({
      data: {
        locationId,
        name,
        type,
        address,
        gpsCoordinates,
        capacity,
        certifications: certifications ? JSON.stringify(certifications) : null,
        contactName,
        contactPhone,
        contactEmail,
        isActive: true,
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
        createdAt: location.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
