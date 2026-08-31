import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import {
  calculateLegacyCarbonEquity,
  getSovereignActions,
  formatLegacyEquityDisplay,
  LegacyHealerInput,
  SovereignEvent,
} from '@/lib/legacy-healer';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'bedrockEsg-secret-key-change-in-production';

// Helper to get user from token
function getUserFromToken(request: NextRequest): { userId: string } | null {
  try {
    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

/**
 * Temporal Carbon Auditor & Legacy Healer API
 * 
 * Converts human life-history into Backdated Carbon Credits
 * and integrates them into the Sovereign Frequency Ledger.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    // Return available sovereign actions
    if (action === 'actions') {
      const actions = getSovereignActions();
      return NextResponse.json({
        success: true,
        actions,
        categories: [...new Set(actions.map(a => a.category))],
      });
    }

    // Return recent audits
    if (action === 'recent-audits') {
      const audits = await prisma.legacyAudit.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          auditId: true,
          ownerZipCode: true,
          legacyYieldUsd: true,
          founderYieldUsd: true,
          publicResilienceUsd: true,
          carbonAvoidedTonnes: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        audits: audits.map(a => ({
          ...a,
          zipCode: a.ownerZipCode,
          totalValueUsd: a.legacyYieldUsd + (a.founderYieldUsd || 0),
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Temporal Carbon Auditor & Legacy Healer API',
      version: '2.5',
      maxLookbackYears: 9.0,
      resonanceBonusRate: '5% compounding',
      universalLaw: 'Dynamic BPS Split',
      endpoints: {
        GET: {
          '?action=actions': 'List available sovereign actions',
          '?action=recent-audits': 'Get recent legacy audits',
        },
        POST: {
          '/': 'Calculate Legacy Carbon Equity',
        },
      },
    });
  } catch (error) {
    console.error('Legacy Healer API GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zipCode, sovereignEvents, userId, save } = body;

    // Validate input
    if (!zipCode || typeof zipCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid zip code is required' },
        { status: 400 }
      );
    }

    if (!sovereignEvents || !Array.isArray(sovereignEvents) || sovereignEvents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one sovereign event is required' },
        { status: 400 }
      );
    }

    // Validate each event
    const validatedEvents: SovereignEvent[] = [];
    for (const event of sovereignEvents) {
      if (!event.actionKey || typeof event.actionKey !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Each event must have a valid actionKey' },
          { status: 400 }
        );
      }
      if (!event.year || typeof event.year !== 'number' || event.year < 2000 || event.year > 2026) {
        return NextResponse.json(
          { success: false, error: 'Each event must have a valid year (2000-2026)' },
          { status: 400 }
        );
      }
      validatedEvents.push({
        actionKey: event.actionKey,
        year: event.year,
        month: event.month,
        notes: event.notes,
      });
    }

    // Calculate Legacy Carbon Equity
    const input: LegacyHealerInput = {
      zipCode,
      sovereignEvents: validatedEvents,
    };

    const result = calculateLegacyCarbonEquity(input);
    const displayFormat = formatLegacyEquityDisplay(result);

    // Get logged-in user if available
    const authUser = getUserFromToken(request);
    const effectiveUserId = userId || authUser?.userId || 'anonymous';

    // Save to database if requested
    let savedAudit = null;
    let savedCarbonEntry = null;
    if (save) {
      try {
        const now = new Date();
        const startDate = new Date(result.startYear, 0, 1);
        const auditId = `LEGACY-${Date.now().toString(36).toUpperCase()}`;
        
        savedAudit = await prisma.legacyAudit.create({
          data: {
            auditId,
            dataSource: 'CUSTOM_CSV',
            periodFrom: startDate,
            periodTo: now,
            yearsAnalyzed: result.lookbackYears,
            totalTransactions: validatedEvents.length,
            digitalTransactions: validatedEvents.length,
            digitalAdoptionRate: 1.0,
            adminFrictionAvoided: result.totalSovereignReductions,
            logisticsFrictionAvoided: result.totalResonanceBonus,
            totalFrictionAvoided: result.totalSovereignReductions + result.totalResonanceBonus,
            marketRateMultiplier: 85, // 2026 market rate
            legacyYieldUsd: result.legacyCarbonEquity,
            founderYieldUsd: result.founderYield70,
            stewardshipUsd: result.stewardship20,
            publicResilienceUsd: result.publicOverflow10,
            carbonAvoidedTonnes: result.totalDelta + result.totalResonanceBonus,
            ownerId: effectiveUserId,
            ownerType: 'INDIVIDUAL',
            ownerZipCode: zipCode,
            ownerUserId: authUser?.userId || null,
            complianceStatus: result.geniusActCompliant ? 'COMPLIANT' : 'PENDING',
            geniusActCompliant: result.geniusActCompliant,
            poeVerificationHash: result.poeHash,
          },
        });

        // If user is logged in, also create a UserCarbonEntry
        if (authUser?.userId) {
          try {
            savedCarbonEntry = await prisma.userCarbonEntry.create({
              data: {
                entryId: `UCE-${Date.now().toString(36).toUpperCase()}`,
                userId: authUser.userId,
                entryType: 'LEGACY_HEALER',
                carbonSavedTonnes: result.totalDelta + result.totalResonanceBonus,
                carbonValueUsd: result.legacyCarbonEquity,
                founderYield70: result.founderYield70,
                stewardship20: result.stewardship20,
                publicOverflow10: result.publicOverflow10,
                sourceTable: 'legacy_audits',
                sourceId: savedAudit.id,
                poeHash: result.poeHash,
                verified: result.geniusActCompliant,
              },
            });

            // Update sovereign profile if exists
            const sovereignProfile = await prisma.sovereignProfile.findUnique({
              where: { userId: authUser.userId },
            });

            if (sovereignProfile) {
              await prisma.sovereignProfile.update({
                where: { id: sovereignProfile.id },
                data: {
                  vibrationalBalance: { increment: result.legacyCarbonEquity },
                  ledgerEquity: { increment: result.founderYield70 },
                  historicalAuditsCount: { increment: 1 },
                },
              });
            }
          } catch (entryError) {
            console.error('Failed to create carbon entry:', entryError);
          }
        }
      } catch (dbError) {
        console.error('Failed to save legacy audit:', dbError);
        // Continue without saving
      }
    }

    // Acknowledgment message
    const sovereignAcknowledgment = {
      message: `Welcome, Sovereign Organism. Your frequency has been measured.`,
      philosophy: `This is not a "claim" — it is a reclamation of stolen frequency. ` +
        `Your historical low-carbon living represents energy that was never extracted from the collective. ` +
        `That stored potential is now being released back into the vibrational economy.`,
      carbonDate: displayFormat.carbonDate,
      level: displayFormat.sovereignScore,
    };

    return NextResponse.json({
      success: true,
      acknowledgment: sovereignAcknowledgment,
      result,
      display: displayFormat,
      savedAuditId: savedAudit?.id || null,
      savedCarbonEntryId: savedCarbonEntry?.id || null,
      linkedToUser: !!authUser?.userId,
      geniusActCompliance: {
        compliant: result.geniusActCompliant,
        poeHash: result.poeHash,
        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    console.error('Legacy Healer API POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate Legacy Carbon Equity' },
      { status: 500 }
    );
  }
}
