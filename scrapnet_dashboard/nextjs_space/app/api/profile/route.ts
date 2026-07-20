import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'bedrockEsg-secret-key-change-in-production';

/**
 * POST /api/profile
 * Create or update user profile based on role
 * This endpoint is used during onboarding and profile updates
 */
export async function POST(request: NextRequest) {
  try {
    // Get token
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

    const body = await request.json();
    const { role, profileData } = body;

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['FARMER', 'REALTOR', 'BUSINESS_OWNER', 'SOVEREIGN_INDIVIDUAL'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user role
      const updatedUser = await tx.user.update({
        where: { id: decoded.userId },
        data: {
          role,
          onboardingComplete: true,
        },
      });

      // Create role-specific profile
      let profile = null;
      switch (role) {
        case 'FARMER':
          // Delete existing profiles from other roles
          await tx.realtorProfile.deleteMany({ where: { userId: decoded.userId } });
          await tx.businessProfile.deleteMany({ where: { userId: decoded.userId } });
          await tx.sovereignProfile.deleteMany({ where: { userId: decoded.userId } });
          
          profile = await tx.farmerProfile.upsert({
            where: { userId: decoded.userId },
            update: {
              landType: profileData.landType || 'CROPLAND',
              acreage: parseFloat(profileData.acreage) || 0,
              historicalYieldJson: profileData.historicalYieldJson || null,
              farmName: profileData.farmName || null,
              farmLocation: profileData.farmLocation || null,
              primaryCrop: profileData.primaryCrop || null,
            },
            create: {
              userId: decoded.userId,
              landType: profileData.landType || 'CROPLAND',
              acreage: parseFloat(profileData.acreage) || 0,
              historicalYieldJson: profileData.historicalYieldJson || null,
              farmName: profileData.farmName || null,
              farmLocation: profileData.farmLocation || null,
              primaryCrop: profileData.primaryCrop || null,
            },
          });
          break;

        case 'REALTOR':
          await tx.farmerProfile.deleteMany({ where: { userId: decoded.userId } });
          await tx.businessProfile.deleteMany({ where: { userId: decoded.userId } });
          await tx.sovereignProfile.deleteMany({ where: { userId: decoded.userId } });
          
          profile = await tx.realtorProfile.upsert({
            where: { userId: decoded.userId },
            update: {
              propertyListingCount: parseInt(profileData.propertyListingCount) || 0,
              avgEfficiencyRating: parseFloat(profileData.avgEfficiencyRating) || 0,
              licenseNumber: profileData.licenseNumber || null,
              brokerage: profileData.brokerage || null,
              marketRegion: profileData.marketRegion || null,
            },
            create: {
              userId: decoded.userId,
              propertyListingCount: parseInt(profileData.propertyListingCount) || 0,
              avgEfficiencyRating: parseFloat(profileData.avgEfficiencyRating) || 0,
              licenseNumber: profileData.licenseNumber || null,
              brokerage: profileData.brokerage || null,
              marketRegion: profileData.marketRegion || null,
            },
          });
          break;

        case 'BUSINESS_OWNER':
          await tx.farmerProfile.deleteMany({ where: { userId: decoded.userId } });
          await tx.realtorProfile.deleteMany({ where: { userId: decoded.userId } });
          await tx.sovereignProfile.deleteMany({ where: { userId: decoded.userId } });
          
          profile = await tx.businessProfile.upsert({
            where: { userId: decoded.userId },
            update: {
              scope1Emissions: parseFloat(profileData.scope1Emissions) || 0,
              scope2Emissions: parseFloat(profileData.scope2Emissions) || 0,
              scope3Emissions: parseFloat(profileData.scope3Emissions) || 0,
              companyName: profileData.companyName || null,
              industry: profileData.industry || null,
              employeeCount: parseInt(profileData.employeeCount) || null,
            },
            create: {
              userId: decoded.userId,
              scope1Emissions: parseFloat(profileData.scope1Emissions) || 0,
              scope2Emissions: parseFloat(profileData.scope2Emissions) || 0,
              scope3Emissions: parseFloat(profileData.scope3Emissions) || 0,
              companyName: profileData.companyName || null,
              industry: profileData.industry || null,
              employeeCount: parseInt(profileData.employeeCount) || null,
            },
          });
          break;

        case 'SOVEREIGN_INDIVIDUAL':
          await tx.farmerProfile.deleteMany({ where: { userId: decoded.userId } });
          await tx.realtorProfile.deleteMany({ where: { userId: decoded.userId } });
          await tx.businessProfile.deleteMany({ where: { userId: decoded.userId } });
          
          profile = await tx.sovereignProfile.upsert({
            where: { userId: decoded.userId },
            update: {
              zipCode: profileData.zipCode || profileData.streetAddress || null,
              householdSize: parseInt(profileData.householdSize) || 1,
              annualFootprint: parseFloat(profileData.annualUtilityBaseline) || null,
              offsetGoal: parseFloat(profileData.sovereignShareCapacity) || null,
            },
            create: {
              userId: decoded.userId,
              zipCode: profileData.zipCode || profileData.streetAddress || null,
              householdSize: parseInt(profileData.householdSize) || 1,
              annualFootprint: parseFloat(profileData.annualUtilityBaseline) || null,
              offsetGoal: parseFloat(profileData.sovereignShareCapacity) || null,
            },
          });
          break;
      }

      return { user: updatedUser, profile };
    });

    // Generate new token with updated role
    const newToken = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        onboardingComplete: true,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        onboardingComplete: result.user.onboardingComplete,
      },
      profile: result.profile,
      redirectUrl: '/vault',
    });

    // Update cookie with new token
    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        farmerProfile: true,
        realtorProfile: true,
        businessProfile: true,
        sovereignProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

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
      role: user.role,
      profile: activeProfile,
      onboardingComplete: user.onboardingComplete,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}
