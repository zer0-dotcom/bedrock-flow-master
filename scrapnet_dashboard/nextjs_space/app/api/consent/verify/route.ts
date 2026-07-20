export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ConsentCheckResult, generateConsentMetadata } from '@/lib/consent';

/**
 * POST - Verify if a user has accepted terms and can process carbon calculations
 * This endpoint is used as a gate before carbon calculations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { 
          authorized: false,
          error: 'userId is required',
          message: 'User ID must be provided to verify consent',
        },
        { status: 400 }
      );
    }

    const consent = await prisma.userConsent.findUnique({
      where: { userId },
    });

    if (!consent) {
      return NextResponse.json({
        authorized: false,
        hasConsent: false,
        termsAccepted: false,
        carbonRightsTransfer: false,
        aiMonitoring: false,
        consentHash: null,
        message: 'No consent record found. User must accept Terms of Service, Carbon Rights Transfer, and AI Monitoring agreements before proceeding.',
      } as ConsentCheckResult & { authorized: boolean });
    }

    // Check if all required consents are accepted
    const isAuthorized = consent.termsAccepted && 
                         consent.carbonRightsTransfer && 
                         consent.aiMonitoring;

    if (!isAuthorized) {
      const missingConsents = [];
      if (!consent.termsAccepted) missingConsents.push('Terms of Service');
      if (!consent.carbonRightsTransfer) missingConsents.push('Carbon Rights Transfer');
      if (!consent.aiMonitoring) missingConsents.push('AI Monitoring');

      return NextResponse.json({
        authorized: false,
        hasConsent: false,
        termsAccepted: consent.termsAccepted,
        carbonRightsTransfer: consent.carbonRightsTransfer,
        aiMonitoring: consent.aiMonitoring,
        consentHash: consent.consentHash,
        missingConsents,
        message: `Missing required consents: ${missingConsents.join(', ')}. All agreements must be accepted to proceed.`,
      });
    }

    // User is authorized - return consent metadata for token attachment
    return NextResponse.json({
      authorized: true,
      hasConsent: true,
      termsAccepted: consent.termsAccepted,
      carbonRightsTransfer: consent.carbonRightsTransfer,
      aiMonitoring: consent.aiMonitoring,
      consentHash: consent.consentHash,
      consentMetadata: generateConsentMetadata(
        consent.consentHash,
        consent.carbonRightsTransfer,
        consent.aiMonitoring,
        consent.termsVersion,
        consent.termsAcceptedAt || new Date()
      ),
      message: 'User is authorized to process carbon calculations.',
    });
  } catch (error) {
    console.error('Error verifying consent:', error);
    return NextResponse.json(
      { 
        authorized: false,
        error: 'Failed to verify consent',
        message: 'An error occurred while verifying consent status.',
      },
      { status: 500 }
    );
  }
}
