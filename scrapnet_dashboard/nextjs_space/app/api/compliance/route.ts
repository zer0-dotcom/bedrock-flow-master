import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  REGULATORY_FRAMEWORKS,
  detectJurisdictionFromGPS,
  checkTravelRule,
  calculateVAT,
  getJurisdictionSplitRules,
  Jurisdiction,
} from '@/lib/compliance';

export const dynamic = 'force-dynamic';

/**
 * Global Compliance Status API
 * Returns real-time compliance status for all regulatory frameworks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Get jurisdiction-specific rules
    if (action === 'jurisdiction-rules') {
      const lat = parseFloat(searchParams.get('lat') || '0');
      const lng = parseFloat(searchParams.get('lng') || '0');
      const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction || 
        detectJurisdictionFromGPS(lat, lng);

      const rules = getJurisdictionSplitRules(jurisdiction);
      const framework = Object.values(REGULATORY_FRAMEWORKS).find(
        f => f.jurisdiction === jurisdiction
      );

      return NextResponse.json({
        success: true,
        jurisdiction,
        detectedFrom: searchParams.get('jurisdiction') ? 'explicit' : 'gps',
        splitRules: rules,
        framework: framework || null,
        travelRuleConfig: framework ? {
          threshold: framework.travelRuleThreshold,
          currency: framework.travelRuleCurrency,
        } : null,
      });
    }

    // Check Travel Rule for a specific amount
    if (action === 'check-travel-rule') {
      const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction || 'US';
      const amount = parseFloat(searchParams.get('amount') || '0');
      const currency = searchParams.get('currency') || 'USD';

      const result = checkTravelRule(jurisdiction, amount, currency);
      return NextResponse.json({
        success: true,
        ...result,
        jurisdiction,
        amount,
        currency,
      });
    }

    // Calculate VAT
    if (action === 'calculate-vat') {
      const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction || 'US';
      const amount = parseFloat(searchParams.get('amount') || '0');
      const isCarbonCredit = searchParams.get('carbonCredit') !== 'false';

      const result = calculateVAT(jurisdiction, amount, isCarbonCredit);
      return NextResponse.json({
        success: true,
        ...result,
        jurisdiction,
        originalAmount: amount,
        isCarbonCredit,
      });
    }

    // Fetch compliance frameworks from database (if seeded) or return defaults
    const dbFrameworks = await prisma.complianceFramework.findMany({
      orderBy: { jurisdiction: 'asc' },
    });

    // Merge with default frameworks
    const frameworks = dbFrameworks.length > 0 
      ? dbFrameworks.map(f => ({
          id: f.frameworkId,
          name: f.name,
          jurisdiction: f.jurisdiction,
          status: f.status,
          statusReason: f.statusReason,
          lastAuditDate: f.lastAuditDate?.toISOString().split('T')[0],
          nextAuditDate: f.nextAuditDate?.toISOString().split('T')[0],
          licenseNumber: f.licenseNumber,
          licenseExpiry: f.licenseExpiry?.toISOString().split('T')[0],
          regulatoryBody: f.regulatoryBody,
          requiresTreasuryBackup: f.requiresTreasuryBackup,
          requiresWhitepaperHash: f.requiresWhitepaperHash,
          travelRuleThreshold: f.travelRuleThreshold,
          travelRuleCurrency: f.travelRuleCurrency,
        }))
      : Object.values(REGULATORY_FRAMEWORKS);

    // Calculate overall "Safe-to-Operate" status
    const statusCounts = frameworks.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let overallStatus: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    if (statusCounts['NON_COMPLIANT'] > 0) {
      overallStatus = 'RED';
    } else if (statusCounts['WARNING'] > 0 || statusCounts['PENDING_REVIEW'] > 0) {
      overallStatus = 'YELLOW';
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overallStatus,
      safeToOperate: overallStatus !== 'RED',
      statusMessage: overallStatus === 'GREEN' 
        ? 'All regulatory frameworks compliant' 
        : overallStatus === 'YELLOW'
          ? 'Some frameworks require attention'
          : 'Critical compliance issues detected',
      frameworks,
      summary: {
        total: frameworks.length,
        compliant: statusCounts['COMPLIANT'] || 0,
        warning: statusCounts['WARNING'] || 0,
        nonCompliant: statusCounts['NON_COMPLIANT'] || 0,
        pendingReview: statusCounts['PENDING_REVIEW'] || 0,
      },
    });
  } catch (error) {
    console.error('Compliance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance status' },
      { status: 500 }
    );
  }
}

// POST - Seed or update compliance frameworks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'seed-defaults') {
      // Seed default frameworks
      const frameworks = Object.values(REGULATORY_FRAMEWORKS);
      
      for (const f of frameworks) {
        await prisma.complianceFramework.upsert({
          where: { frameworkId: f.id },
          update: {
            name: f.name,
            status: f.status as any,
            statusReason: f.statusReason,
            lastAuditDate: f.lastAuditDate ? new Date(f.lastAuditDate) : null,
            licenseNumber: f.licenseNumber,
            licenseExpiry: f.licenseExpiry ? new Date(f.licenseExpiry) : null,
            regulatoryBody: f.regulatoryBody,
            requiresTreasuryBackup: f.requiresTreasuryBackup,
            requiresWhitepaperHash: f.requiresWhitepaperHash,
            travelRuleThreshold: f.travelRuleThreshold,
            travelRuleCurrency: f.travelRuleCurrency,
          },
          create: {
            frameworkId: f.id,
            name: f.name,
            jurisdiction: f.jurisdiction as any,
            status: f.status as any,
            statusReason: f.statusReason,
            lastAuditDate: f.lastAuditDate ? new Date(f.lastAuditDate) : null,
            licenseNumber: f.licenseNumber,
            licenseExpiry: f.licenseExpiry ? new Date(f.licenseExpiry) : null,
            regulatoryBody: f.regulatoryBody,
            requiresTreasuryBackup: f.requiresTreasuryBackup,
            requiresWhitepaperHash: f.requiresWhitepaperHash,
            travelRuleThreshold: f.travelRuleThreshold,
            travelRuleCurrency: f.travelRuleCurrency,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Default compliance frameworks seeded',
        count: frameworks.length,
      });
    }

    // Update framework status
    if (action === 'update-status') {
      const { frameworkId, status, statusReason } = body;
      
      const updated = await prisma.complianceFramework.update({
        where: { frameworkId },
        data: {
          status,
          statusReason,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        framework: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Compliance POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update compliance data' },
      { status: 500 }
    );
  }
}
