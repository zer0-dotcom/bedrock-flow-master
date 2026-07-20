import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Register a new user (defaults to FARMER role, pending verification)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, name, phone, role, locationId, yardId } = body;

    // Validate required fields
    if (!password || !name) {
      return NextResponse.json(
        { success: false, error: 'Password and name are required' },
        { status: 400 }
      );
    }

    // Must have either email or username
    if (!email && !username) {
      return NextResponse.json(
        { success: false, error: 'Either email or username is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email: email.toLowerCase() } : {},
          username ? { username: username.toLowerCase() } : {},
        ].filter(condition => Object.keys(condition).length > 0),
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Validate role
    const validRoles = ['ADMIN', 'AGENT', 'FARMER'];
    const userRole = role && validRoles.includes(role) ? role : 'FARMER';

    // Create user (unverified by default)
    // Support both locationId (new) and yardId (legacy) for backward compatibility
    const assignedLocationId = locationId || yardId;
    const user = await prisma.user.create({
      data: {
        email: email?.toLowerCase(),
        username: username?.toLowerCase(),
        passwordHash,
        name,
        phone,
        role: userRole,
        locationId: userRole === 'FARMER' ? assignedLocationId : null,
        isVerified: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Your account is pending verification.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
