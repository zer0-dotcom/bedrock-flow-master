import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'bedrockEsg-secret-key-change-in-production';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

/**
 * GET /api/auth/callback/google
 * Handles the OAuth 2.0 callback from Google.
 * Exchanges the authorization code for tokens, validates identity,
 * finds or creates the user, auto-elevates ADMIN_MASTER_EMAIL to ADMIN,
 * issues a JWT, and redirects to the cockpit.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Derive the public-facing base URL for all redirects
    // CRITICAL: request.url contains the internal proxy hostname in production,
    // so we MUST use x-forwarded-host or NEXTAUTH_URL for browser-facing redirects.
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
    const baseUrl = process.env.NEXTAUTH_URL || `${forwardedProto}://${host}`;
    const redirectUri = `${baseUrl}/api/auth/callback/google`;

    console.log(`[Google SSO Callback] Using baseUrl: ${baseUrl}`);

    // Handle Google-side errors
    if (error) {
      console.error('[Google SSO Callback] Google returned error:', error);
      return NextResponse.redirect(`${baseUrl}/login?error=google_denied`);
    }

    if (!code || !state) {
      console.error('[Google SSO Callback] Missing code or state parameter');
      return NextResponse.redirect(`${baseUrl}/login?error=invalid_callback`);
    }

    // Verify CSRF state token
    const storedState = request.cookies.get('google-oauth-state')?.value;
    if (!storedState || storedState !== state) {
      console.error('[Google SSO Callback] State mismatch - possible CSRF attack');
      return NextResponse.redirect(`${baseUrl}/login?error=state_mismatch`);
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('[Google SSO Callback] Token exchange failed:', errorBody);
      return NextResponse.redirect(`${baseUrl}/login?error=token_exchange_failed`);
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Fetch user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error('[Google SSO Callback] Failed to fetch user info');
      return NextResponse.redirect(`${baseUrl}/login?error=userinfo_failed`);
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    if (!googleUser.email || !googleUser.email_verified) {
      console.error('[Google SSO Callback] Email not verified or missing');
      return NextResponse.redirect(`${baseUrl}/login?error=email_not_verified`);
    }

    console.log(`[Google SSO Callback] Authenticated Google user: ${googleUser.email}`);

    // Check if ADMIN_MASTER_EMAIL matches for auto-elevation
    const adminMasterEmail = process.env.ADMIN_MASTER_EMAIL?.toLowerCase();
    const isAdminMaster = adminMasterEmail && googleUser.email.toLowerCase() === adminMasterEmail;

    // Find existing user by email
    let user = await prisma.user.findFirst({
      where: { email: googleUser.email.toLowerCase() },
      include: { location: true },
    });

    if (user) {
      // Existing user - update role to ADMIN if this is the master email and not already ADMIN
      if (isAdminMaster && user.role !== 'ADMIN') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'ADMIN',
            isVerified: true,
            verifiedAt: new Date(),
            name: user.name || googleUser.name,
          },
          include: { location: true },
        });
        console.log(`[Google SSO Callback] Elevated ${googleUser.email} to ADMIN role`);
      }

      // Ensure verified status for Google-authenticated users
      if (!user.isVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true, verifiedAt: new Date() },
          include: { location: true },
        });
      }
    } else {
      // Create new user for Google SSO
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);
      const role = isAdminMaster ? 'ADMIN' : 'SOVEREIGN_INDIVIDUAL';

      user = await prisma.user.create({
        data: {
          email: googleUser.email.toLowerCase(),
          username: googleUser.email.toLowerCase().split('@')[0] + '_' + crypto.randomBytes(4).toString('hex'),
          passwordHash,
          name: googleUser.name || googleUser.email.split('@')[0],
          role,
          isVerified: true,
          verifiedAt: new Date(),
          onboardingComplete: isAdminMaster ? true : false,
        },
        include: { location: true },
      });

      console.log(`[Google SSO Callback] Created new user: ${googleUser.email} with role ${role}`);
    }

    // Determine redirect URL based on role (same logic as login route)
    let redirectUrl: string;
    if (!user.onboardingComplete && !isAdminMaster) {
      redirectUrl = '/onboarding';
    } else {
      switch (user.role) {
        case 'AGENT':
          redirectUrl = '/agent-portal';
          break;
        case 'ADMIN':
          redirectUrl = '/';
          break;
        case 'FARMER':
          redirectUrl = user.locationId ? `/dashboard/location/${user.locationId}` : '/vault';
          break;
        default:
          redirectUrl = '/vault';
      }
    }

    // Generate JWT token (same shape as login route)
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

    // Build redirect response using public base URL
    const response = NextResponse.redirect(`${baseUrl}${redirectUrl}`);

    // Set the same auth cookie as the login route
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Clear the OAuth state cookie
    response.cookies.delete('google-oauth-state');

    console.log(`[Google SSO Callback] Login successful for ${googleUser.email}, redirecting to ${redirectUrl}`);
    return response;
  } catch (error) {
    console.error('[Google SSO Callback] Unexpected error:', error);
    const fallbackBase = process.env.NEXTAUTH_URL || 'https://bedrockesg.com';
    return NextResponse.redirect(`${fallbackBase}/login?error=sso_error`);
  }
}
