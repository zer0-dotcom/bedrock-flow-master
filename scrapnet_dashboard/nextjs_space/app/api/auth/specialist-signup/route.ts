// app/api/auth/specialist-signup/route.ts
// Sprint 5 — Specialist signup. Creates AGENT user + SPECIALIST PartnerProfile
// with BOTH a SPEC- code and a REF- code (dual use).

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateUniqueRefCode, generateUniqueSpecCode } from '@/lib/partner-codes';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const specialty = typeof body.specialty === 'string' && body.specialty.trim()
      ? body.specialty.trim() : null;
    const companyName = typeof body.companyName === 'string' && body.companyName.trim()
      ? body.companyName.trim() : null;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Full name is required.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email is required.' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'AGENT',
        isVerified: true,
        onboardingComplete: true,
      },
    });

    const specCode = await generateUniqueSpecCode(prisma);
    const refCode = await generateUniqueRefCode(prisma);

    await prisma.partnerProfile.create({
      data: {
        userId: user.id,
        partnerType: 'SPECIALIST',
        refCode,
        specCode,
        companyName: companyName ?? specialty,
      },
    });

    return NextResponse.json({ success: true, refCode, specCode });
  } catch (error) {
    console.error('[specialist-signup] error:', error);
    return NextResponse.json({ success: false, error: 'An error occurred during signup.' }, { status: 500 });
  }
}
