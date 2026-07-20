import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google
 * Initiates the Google OAuth 2.0 authorization flow.
 * Generates a CSRF state token, stores it in a cookie, and redirects to Google.
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Derive the public-facing base URL
    // CRITICAL: request.url contains the internal proxy hostname in production,
    // so we MUST use NEXTAUTH_URL or x-forwarded-host for browser-facing redirects.
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
    const baseUrl = process.env.NEXTAUTH_URL || `${forwardedProto}://${host}`;
    const redirectUri = `${baseUrl}/api/auth/callback/google`;

    console.log(`[Google SSO] Using baseUrl: ${baseUrl}, redirectUri: ${redirectUri}`);

    if (!clientId) {
      console.error('[Google SSO] GOOGLE_CLIENT_ID not configured');
      return NextResponse.redirect(`${baseUrl}/login?error=sso_not_configured`);
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Set state cookie for CSRF verification
    const response = NextResponse.redirect(googleAuthUrl);
    response.cookies.set('google-oauth-state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    console.log('[Google SSO] Redirecting to Google authorization endpoint');
    return response;
  } catch (error) {
    console.error('[Google SSO] Error initiating OAuth flow:', error);
    const fallbackBase = process.env.NEXTAUTH_URL || 'https://bedrockesg.com';
    return NextResponse.redirect(`${fallbackBase}/login?error=sso_error`);
  }
}
