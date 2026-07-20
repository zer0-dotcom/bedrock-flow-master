import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/invitations
 * List all invitation codes (admin only)
 */
export async function GET() {
  try {
    const invitations = await prisma.invitationCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        code: inv.code,
        description: inv.description,
        maxUses: inv.maxUses,
        usedCount: inv.usedCount,
        usersCount: inv._count.users,
        isActive: inv.isActive,
        expiresAt: inv.expiresAt?.toISOString() || null,
        createdAt: inv.createdAt.toISOString(),
        createdBy: inv.createdBy,
      })),
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations
 * Create a new invitation code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, maxUses = 1, expiresInDays, createdBy } = body;

    // Generate unique invitation code
    const code = `SCRAP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Calculate expiration date if provided
    let expiresAt: Date | null = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const invitation = await prisma.invitationCode.create({
      data: {
        code,
        description,
        maxUses,
        expiresAt,
        createdBy,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        code: invitation.code,
        description: invitation.description,
        maxUses: invitation.maxUses,
        expiresAt: invitation.expiresAt?.toISOString() || null,
        createdAt: invitation.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
