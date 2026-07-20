import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'bedrockEsg-secret-key-change-in-production';

/**
 * GET /api/auth/me
 * Get current authenticated user data
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user with profile
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        farmerProfile: true,
        realtorProfile: true,
        businessProfile: true,
        sovereignProfile: true,
        location: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get active profile based on role
    let activeProfile = null;
    switch (user.role) {
      case 'FARMER':
        activeProfile = user.farmerProfile;
        break;
      case 'REALTOR':
        activeProfile = user.realtorProfile;
        break;
      case 'BUSINESS_OWNER':
        activeProfile = user.businessProfile;
        break;
      case 'SOVEREIGN_INDIVIDUAL':
        activeProfile = user.sovereignProfile;
        break;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        onboardingComplete: user.onboardingComplete,
        services: user.services,
        locationId: user.locationId,
        location: user.location,
        profile: activeProfile,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}
