import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import {
  detectJurisdictionFromGPS,
  checkTravelRule,
  calculateVAT,
  getJurisdictionSplitRules,
  generateComplianceAuditTrail,
  EXCHANGE_RATES_TO_USD,
  Jurisdiction,
} from '@/lib/compliance';

export const dynamic = 'force-dynamic';

/**
 * International Transaction Layer API
 * Handles multi-currency settlement with Travel Rule and VAT compliance
 */

// GET - Fetch transactions with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const jurisdiction = searchParams.get('jurisdiction');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single transaction lookup
    if (transactionId) {
      const tx = await prisma.internationalTransaction.findFirst({
        where: {
          OR: [
            { id: transactionId },
            { transactionId: transactionId },
          ],
        },
      });

      if (!tx) {
        return NextResponse.json({ found: false }, { status: 404 });
      }

      // Check privacy compliance for backtracking
      const canShowFullDetails = checkPrivacyCompliance(tx.originatorJurisdiction);

      return NextResponse.json({
        found: true,
        transaction: {
          ...tx,
          // Mask PII based on privacy laws
          originatorName: canShowFullDetails ? tx.originatorName : maskString(tx.originatorName),
          beneficiaryName: canShowFullDetails ? tx.beneficiaryName : maskString(tx.beneficiaryName),
          travelRuleDataJson: null, // Never expose raw PII
        },
        privacyNotice: !canShowFullDetails 
          ? 'Some details masked per GDPR/CCPA requirements' 
          : null,
      });
    }

    // List transactions
    const where: any = {};
    if (jurisdiction) where.originatorJurisdiction = jurisdiction;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.internationalTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          transactionId: true,
          type: true,
          originatorJurisdiction: true,
          beneficiaryJurisdiction: true,
          currencyCode: true,
          amount: true,
          amountUsd: true,
          travelRuleTriggered: true,
          vatApplicable: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.internationalTransaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    console.error('Transaction GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST - Create new international transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      originatorWallet,
      originatorName,
      originatorNodeId,
      originatorGpsLat,
      originatorGpsLng,
      beneficiaryWallet,
      beneficiaryName,
      beneficiaryNodeId,
      beneficiaryGpsLat,
      beneficiaryGpsLng,
      currencyCode,
      amount,
      // Optional explicit jurisdiction override
      explicitOriginatorJurisdiction,
      explicitBeneficiaryJurisdiction,
    } = body;

    // Validate required fields
    if (!originatorWallet || !beneficiaryWallet || !currencyCode || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Detect jurisdictions from GPS
    const originatorJurisdiction: Jurisdiction = explicitOriginatorJurisdiction ||
      (originatorGpsLat && originatorGpsLng 
        ? detectJurisdictionFromGPS(originatorGpsLat, originatorGpsLng)
        : 'UNKNOWN');

    const beneficiaryJurisdiction: Jurisdiction = explicitBeneficiaryJurisdiction ||
      (beneficiaryGpsLat && beneficiaryGpsLng
        ? detectJurisdictionFromGPS(beneficiaryGpsLat, beneficiaryGpsLng)
        : 'UNKNOWN');

    // Convert to USD
    const exchangeRate = EXCHANGE_RATES_TO_USD[currencyCode] || 1;
    const amountUsd = amount * exchangeRate;

    // Check Travel Rule
    const travelRuleCheck = checkTravelRule(originatorJurisdiction, amount, currencyCode);
    
    // Calculate VAT
    const vatCalc = calculateVAT(originatorJurisdiction, amount, true);

    // Get jurisdiction-specific split rules
    const splitRules = getJurisdictionSplitRules(originatorJurisdiction);

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Build credit distribution
    const creditDistribution = {
      totalCredits: amountUsd / 1000, // Simplified: $1000 = 1 credit
      bankShare: (amountUsd / 1000) * (splitRules.bankShare / 100),
      platformShare: (amountUsd / 1000) * (splitRules.platformShare / 100),
      sustainabilityShare: (amountUsd / 1000) * (splitRules.sustainabilityShare / 100),
      splitRules,
    };

    // Generate audit trail
    const auditTrail = generateComplianceAuditTrail(
      transactionId,
      originatorJurisdiction,
      travelRuleCheck.triggered,
      vatCalc.applicable
    );

    // Create transaction record
    const transaction = await prisma.internationalTransaction.create({
      data: {
        transactionId,
        type: type || 'SETTLEMENT',
        originatorNodeId,
        originatorWallet,
        originatorName,
        originatorJurisdiction,
        originatorGpsLat,
        originatorGpsLng,
        beneficiaryNodeId,
        beneficiaryWallet,
        beneficiaryName,
        beneficiaryJurisdiction,
        currencyCode,
        amount,
        amountUsd,
        exchangeRate,
        travelRuleTriggered: travelRuleCheck.triggered,
        vatApplicable: vatCalc.applicable,
        vatRate: vatCalc.rate,
        vatAmount: vatCalc.amount,
        taxJurisdiction: originatorJurisdiction,
        bankShare: creditDistribution.bankShare,
        platformShare: creditDistribution.platformShare,
        sustainabilityShare: creditDistribution.sustainabilityShare,
        creditDistributionJson: JSON.stringify(creditDistribution),
        treasuryBackupRequired: splitRules.requiresTreasuryBackup,
        whitepaperHashRequired: splitRules.requiresWhitepaperHash,
        status: 'PENDING',
        auditTrailJson: JSON.stringify(auditTrail),
      },
    });

    // If Travel Rule triggered, create PII exchange record
    if (travelRuleCheck.triggered) {
      await prisma.travelRuleExchange.create({
        data: {
          transactionId: transaction.id,
          originatorFullName: originatorName,
          beneficiaryFullName: beneficiaryName,
          jurisdictionThreshold: travelRuleCheck.threshold,
          jurisdictionCurrency: travelRuleCheck.thresholdCurrency,
          scheduledDeletion: new Date(Date.now() + 2555 * 24 * 60 * 60 * 1000), // ~7 years
        },
      });
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        transactionId: transaction.transactionId,
        type: transaction.type,
        status: transaction.status,
      },
      compliance: {
        originatorJurisdiction,
        beneficiaryJurisdiction,
        travelRule: {
          triggered: travelRuleCheck.triggered,
          threshold: travelRuleCheck.threshold,
          currency: travelRuleCheck.thresholdCurrency,
          piiExchangeInitiated: travelRuleCheck.triggered,
        },
        vat: vatCalc,
        splitRules: {
          bankShare: `${splitRules.bankShare}%`,
          platformShare: `${splitRules.platformShare}%`,
          sustainabilityShare: `${splitRules.sustainabilityShare}%`,
          jurisdictionRequirements: splitRules.additionalRequirements,
        },
      },
      creditDistribution,
    });
  } catch (error) {
    console.error('Transaction POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

// Helper: Check if full details can be shown based on privacy laws
function checkPrivacyCompliance(jurisdiction: Jurisdiction): boolean {
  // GDPR (EU) and CCPA (US/CA) require masking by default for public queries
  // In production, this would check the requester's authorization level
  return false; // Default to masked for public API
}

// Helper: Mask string for privacy
function maskString(str: string | null): string | null {
  if (!str) return null;
  if (str.length <= 4) return '****';
  return str.substring(0, 2) + '*'.repeat(str.length - 4) + str.substring(str.length - 2);
}
