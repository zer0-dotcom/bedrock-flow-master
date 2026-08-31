import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'bedrockEsg-secret-key-change-in-production';

/**
 * GET /api/vault
 * Get user's Personal Vault data including:
 * - Vibrational Carbon Balance
 * - Historical Audit Progress
 * - Ledger Equity
 * - Carbon entries summary
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user with all profiles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        farmerProfile: true,
        realtorProfile: true,
        businessProfile: true,
        sovereignProfile: true,
        carbonEntries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        legacyAuditsOwned: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate aggregated metrics
    const carbonEntries = user.carbonEntries || [];
    const legacyAudits = user.legacyAuditsOwned || [];

    // Total vibrational balance (sum of all carbon value)
    const totalVibrationalBalance = carbonEntries.reduce(
      (sum, entry) => sum + (entry.carbonValueUsd || 0),
      0
    );

    // Add legacy audit values
    const totalLegacyValue = legacyAudits.reduce(
      (sum, audit) => sum + (audit.legacyYieldUsd || 0),
      0
    );

    // Total ledger equity (Asset Sovereign / founder-yield leg)
    const totalLedgerEquity = carbonEntries.reduce(
      (sum, entry) => sum + (entry.founderYield70 || 0),
      0
    ) + legacyAudits.reduce(
      (sum, audit) => sum + (audit.founderYieldUsd || 0),
      0
    );

    // Total carbon saved
    const totalCarbonSaved = carbonEntries.reduce(
      (sum, entry) => sum + (entry.carbonSavedTonnes || 0),
      0
    ) + legacyAudits.reduce(
      (sum, audit) => sum + (audit.carbonAvoidedTonnes || 0),
      0
    );

    // Public overflow (Public Resilience leg)
    const totalPublicOverflow = carbonEntries.reduce(
      (sum, entry) => sum + (entry.publicOverflow10 || 0),
      0
    ) + legacyAudits.reduce(
      (sum, audit) => sum + (audit.publicResilienceUsd || 0),
      0
    );

    // Entries by type
    const entriesByType: Record<string, { count: number; value: number }> = {};
    carbonEntries.forEach(entry => {
      if (!entriesByType[entry.entryType]) {
        entriesByType[entry.entryType] = { count: 0, value: 0 };
      }
      entriesByType[entry.entryType].count++;
      entriesByType[entry.entryType].value += entry.carbonValueUsd || 0;
    });

    // Get active profile
    let activeProfile = null;
    let profileType = user.role;
    switch (user.role) {
      case 'FARMER':
        activeProfile = user.farmerProfile;
        break;
      case 'REALTOR':
        activeProfile = user.realtorProfile;
        break;
      case 'BUSINESS_OWNER':
        activeProfile = user.businessProfile;
        break;
      case 'SOVEREIGN_INDIVIDUAL':
        activeProfile = user.sovereignProfile;
        break;
    }

    // If sovereign profile exists, update cached values
    if (user.sovereignProfile) {
      await prisma.sovereignProfile.update({
        where: { id: user.sovereignProfile.id },
        data: {
          vibrationalBalance: totalVibrationalBalance + totalLegacyValue,
          ledgerEquity: totalLedgerEquity,
          historicalAuditsCount: legacyAudits.length,
        },
      });
    }

    // Pentagon data for visualization
    const pentagonData = {
      industrialMass: Math.min(100, (totalCarbonSaved / 10) * 100),
      resonanceYield: Math.min(100, (totalLedgerEquity / 10000) * 100),
      participationScore: Math.min(100, (carbonEntries.length / 20) * 100),
      legacyHealing: Math.min(100, (legacyAudits.length / 5) * 100),
      vibrationalEquity: Math.min(100, (totalPublicOverflow / 1000) * 100),
    };

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingComplete: user.onboardingComplete,
      },
      profile: activeProfile,
      profileType,
      metrics: {
        vibrationalBalance: totalVibrationalBalance + totalLegacyValue,
        ledgerEquity: totalLedgerEquity,
        carbonSavedTonnes: totalCarbonSaved,
        publicOverflow: totalPublicOverflow,
        totalEntries: carbonEntries.length,
        totalAudits: legacyAudits.length,
      },
      entriesByType,
      pentagonData,
      recentEntries: carbonEntries.slice(0, 10).map(e => ({
        id: e.id,
        entryId: e.entryId,
        type: e.entryType,
        carbonSaved: e.carbonSavedTonnes,
        value: e.carbonValueUsd,
        founderYield: e.founderYield70,
        verified: e.verified,
        createdAt: e.createdAt,
      })),
      recentAudits: legacyAudits.slice(0, 5).map(a => ({
        id: a.id,
        auditId: a.auditId,
        legacyYield: a.legacyYieldUsd,
        carbonAvoided: a.carbonAvoidedTonnes,
        yearsAnalyzed: a.yearsAnalyzed,
        compliant: a.geniusActCompliant,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Vault API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get vault data' },
      { status: 500 }
    );
  }
}
