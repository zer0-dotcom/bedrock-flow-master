export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateConsentHash, generateLogHash, generateConsentMetadata } from '@/lib/consent';

/**
 * GET - Check consent status for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const consent = await prisma.userConsent.findUnique({
      where: { userId },
      include: {
        consentLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!consent) {
      return NextResponse.json({
        hasConsent: false,
        termsAccepted: false,
        carbonRightsTransfer: false,
        aiMonitoring: false,
        consentHash: null,
        message: 'No consent record found for this user',
      });
    }

    return NextResponse.json({
      hasConsent: consent.termsAccepted,
      termsAccepted: consent.termsAccepted,
      carbonRightsTransfer: consent.carbonRightsTransfer,
      aiMonitoring: consent.aiMonitoring,
      consentHash: consent.consentHash,
      termsVersion: consent.termsVersion,
      termsAcceptedAt: consent.termsAcceptedAt,
      consentLogs: consent.consentLogs,
    });
  } catch (error) {
    console.error('Error checking consent:', error);
    return NextResponse.json(
      { error: 'Failed to check consent status' },
      { status: 500 }
    );
  }
}

/**
 * POST - Accept terms and log consent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      email,
      walletAddress,
      carbonRightsTransfer,
      aiMonitoring,
      termsVersion = '1.0',
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get request metadata for audit
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const now = new Date();
    const consentHash = generateConsentHash(
      userId,
      email || null,
      carbonRightsTransfer === true,
      aiMonitoring === true,
      now
    );

    // Check if user already has consent record
    const existingConsent = await prisma.userConsent.findUnique({
      where: { userId },
    });

    if (existingConsent) {
      // Update existing consent and log changes
      const logs = [];

      if (existingConsent.carbonRightsTransfer !== carbonRightsTransfer) {
        logs.push({
          userId,
          action: carbonRightsTransfer ? 'accept' : 'revoke',
          consentType: 'carbon_rights',
          previousValue: existingConsent.carbonRightsTransfer,
          newValue: carbonRightsTransfer === true,
          logHash: generateLogHash(userId, carbonRightsTransfer ? 'accept' : 'revoke', 'carbon_rights', existingConsent.carbonRightsTransfer, carbonRightsTransfer === true, now),
          ipAddress,
          userAgent,
        });
      }

      if (existingConsent.aiMonitoring !== aiMonitoring) {
        logs.push({
          userId,
          action: aiMonitoring ? 'accept' : 'revoke',
          consentType: 'ai_monitoring',
          previousValue: existingConsent.aiMonitoring,
          newValue: aiMonitoring === true,
          logHash: generateLogHash(userId, aiMonitoring ? 'accept' : 'revoke', 'ai_monitoring', existingConsent.aiMonitoring, aiMonitoring === true, now),
          ipAddress,
          userAgent,
        });
      }

      const updated = await prisma.userConsent.update({
        where: { userId },
        data: {
          email,
          walletAddress,
          termsAccepted: carbonRightsTransfer === true && aiMonitoring === true,
          carbonRightsTransfer: carbonRightsTransfer === true,
          aiMonitoring: aiMonitoring === true,
          termsAcceptedAt: carbonRightsTransfer && aiMonitoring ? now : existingConsent.termsAcceptedAt,
          carbonRightsAt: carbonRightsTransfer ? now : existingConsent.carbonRightsAt,
          aiMonitoringAt: aiMonitoring ? now : existingConsent.aiMonitoringAt,
          consentHash,
          ipAddress,
          userAgent,
          termsVersion,
          consentLogs: {
            create: logs,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Consent updated successfully',
        consentHash: updated.consentHash,
        termsAccepted: updated.termsAccepted,
        carbonRightsTransfer: updated.carbonRightsTransfer,
        aiMonitoring: updated.aiMonitoring,
        consentMetadata: generateConsentMetadata(
          updated.consentHash,
          updated.carbonRightsTransfer,
          updated.aiMonitoring,
          updated.termsVersion,
          now
        ),
      });
    }

    // Create new consent record
    const consent = await prisma.userConsent.create({
      data: {
        userId,
        email,
        walletAddress,
        termsAccepted: carbonRightsTransfer === true && aiMonitoring === true,
        carbonRightsTransfer: carbonRightsTransfer === true,
        aiMonitoring: aiMonitoring === true,
        termsAcceptedAt: carbonRightsTransfer && aiMonitoring ? now : null,
        carbonRightsAt: carbonRightsTransfer ? now : null,
        aiMonitoringAt: aiMonitoring ? now : null,
        consentHash,
        ipAddress,
        userAgent,
        termsVersion,
        consentLogs: {
          create: [
            {
              action: 'accept',
              consentType: 'terms',
              previousValue: false,
              newValue: true,
              logHash: generateLogHash(userId, 'accept', 'terms', false, true, now),
              ipAddress,
              userAgent,
            },
            ...(carbonRightsTransfer ? [{
              action: 'accept',
              consentType: 'carbon_rights',
              previousValue: false,
              newValue: true,
              logHash: generateLogHash(userId, 'accept', 'carbon_rights', false, true, now),
              ipAddress,
              userAgent,
            }] : []),
            ...(aiMonitoring ? [{
              action: 'accept',
              consentType: 'ai_monitoring',
              previousValue: false,
              newValue: true,
              logHash: generateLogHash(userId, 'accept', 'ai_monitoring', false, true, now),
              ipAddress,
              userAgent,
            }] : []),
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Consent recorded successfully',
      consentHash: consent.consentHash,
      termsAccepted: consent.termsAccepted,
      carbonRightsTransfer: consent.carbonRightsTransfer,
      aiMonitoring: consent.aiMonitoring,
      consentMetadata: generateConsentMetadata(
        consent.consentHash,
        consent.carbonRightsTransfer,
        consent.aiMonitoring,
        consent.termsVersion,
        now
      ),
    });
  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}
