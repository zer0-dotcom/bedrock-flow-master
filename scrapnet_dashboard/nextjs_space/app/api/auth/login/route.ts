import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'bedrockEsg-secret-key-change-in-production';

/**
 * POST /api/auth/login
 * Role-aware login with single identifier field (email or username)
 * 
 * Request body:
 *   - identifier: Email or username
 *   - password: User password
 * 
 * Response:
 *   - On success: User data with redirect URL based on role
 *   - If not verified: Account pending message
 *   - On failure: Error message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Email/Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      },
      include: {
        location: true,
        farmer: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is verified
    if (!user.isVerified) {
      // For agents, show agent-specific message
      if (user.role === 'AGENT' && user.agentStatus === 'REVIEW_REQUIRED') {
        return NextResponse.json({
          success: false,
          error: 'Account Pending',
          message: 'Your agent account is under review. You will be notified once approved.',
          accountPending: true,
          agentStatus: 'REVIEW_REQUIRED',
          userId: user.id,
          role: user.role,
        }, { status: 403 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Account Pending',
        message: 'Your account is pending verification. Please contact an administrator to activate your account.',
        accountPending: true,
        userId: user.id,
        role: user.role,
      }, { status: 403 });
    }
    
    // For verified agents, check agent status
    if (user.role === 'AGENT' && user.agentStatus !== 'APPROVED') {
      if (user.agentStatus === 'REVIEW_REQUIRED') {
        return NextResponse.json({
          success: false,
          error: 'Account Pending',
          message: 'Your agent account is under review. You cannot verify yards until approved.',
          accountPending: true,
          agentStatus: 'REVIEW_REQUIRED',
          userId: user.id,
          role: user.role,
        }, { status: 403 });
      }
      
      if (user.agentStatus === 'SUSPENDED') {
        return NextResponse.json({
          success: false,
          error: 'Account Suspended',
          message: 'Your agent account has been suspended. Please contact support.',
          accountSuspended: true,
          userId: user.id,
          role: user.role,
        }, { status: 403 });
      }
    }

    // Check if user needs to complete onboarding
    if (!user.onboardingComplete) {
      // Generate JWT token for onboarding
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          onboardingComplete: false,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          onboardingComplete: false,
        },
        redirectUrl: '/onboarding',
        token,
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      return response;
    }

    // Determine redirect URL based on role
    let redirectUrl: string;
    switch (user.role) {
      case 'AGENT':
        redirectUrl = '/agent-portal';
        break;
      case 'FARMER':
        // Redirect to dashboard with locationId if assigned
        if (user.locationId) {
          redirectUrl = `/dashboard/location/${user.locationId}`;
        } else {
          redirectUrl = '/vault';
        }
        break;
      case 'ADMIN':
        redirectUrl = '/';
        break;
      case 'REALTOR':
      case 'BUSINESS_OWNER':
      case 'SOVEREIGN_INDIVIDUAL':
        redirectUrl = '/vault';
        break;
      default:
        redirectUrl = '/vault';
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        agentStatus: user.agentStatus,
        locationId: user.locationId,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        agentStatus: user.agentStatus,
        locationId: user.locationId,
        location: user.location ? {
          id: user.location.id,
          locationId: user.location.locationId,
          name: user.location.name,
          type: user.location.type,
          address: user.location.address,
        } : null,
        farmerId: user.farmerId,
      },
      redirectUrl,
      token,
    });

    // Set HTTP-only cookie for token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
