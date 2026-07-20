import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/agent-signup
 * Agent registration with invitation code validation
 * 
 * Request body:
 *   - invitationCode: Required invitation code
 *   - username: Unique username (required)
 *   - email: Valid email (required)
 *   - password: Password
 *   - name: Full name
 *   - phone: Optional phone number
 * 
 * Sets initial status to 'REVIEW_REQUIRED'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationCode, username, email, password, name, phone } = body;

    // Validate required fields
    if (!invitationCode || !username || !email || !password || !name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'All fields are required: invitation code, username, email, password, and name' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric, underscores, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores' 
        },
        { status: 400 }
      );
    }

    // Verify invitation code exists and is valid
    const invitation = await prisma.invitationCode.findUnique({
      where: { code: invitationCode },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation code' },
        { status: 400 }
      );
    }

    // Check if invitation is active
    if (!invitation.isActive) {
      return NextResponse.json(
        { success: false, error: 'This invitation code is no longer active' },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This invitation code has expired' },
        { status: 400 }
      );
    }

    // Check if invitation has reached max uses
    if (invitation.usedCount >= invitation.maxUses) {
      return NextResponse.json(
        { success: false, error: 'This invitation code has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'This username is already taken' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create agent user with REVIEW_REQUIRED status
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        name,
        phone,
        role: 'AGENT',
        isVerified: false,
        agentStatus: 'REVIEW_REQUIRED',
        agentStatusUpdatedAt: new Date(),
        invitationCodeId: invitation.id,
      },
    });

    // Increment invitation code usage
    await prisma.invitationCode.update({
      where: { id: invitation.id },
      data: { usedCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: 'Agent registration successful. Your account is pending review before you can verify yards.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        agentStatus: user.agentStatus,
        isVerified: user.isVerified,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Agent signup error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
