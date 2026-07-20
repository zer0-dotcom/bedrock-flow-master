import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateCdrCredits, BiocharCalculatorInput, FeedstockType } from '@/lib/types';
import { generateConsentMetadata } from '@/lib/consent';

/**
 * Verify user consent before processing carbon calculations
 */
async function verifyUserConsent(userId: string | undefined) {
  if (!userId) {
    return {
      authorized: false,
      message: 'userId is required to process carbon calculations',
      consentHash: null,
      consentMetadata: null,
    };
  }

  const consent = await prisma.userConsent.findUnique({
    where: { userId },
  });

  if (!consent) {
    return {
      authorized: false,
      message: 'No consent record found. User must accept Terms of Service, Carbon Rights Transfer, and AI Monitoring agreements.',
      consentHash: null,
      consentMetadata: null,
    };
  }

  // TOKEN ACCESS GATE: Check if all required consents are accepted
  if (!consent.termsAccepted || !consent.carbonRightsTransfer || !consent.aiMonitoring) {
    const missing = [];
    if (!consent.termsAccepted) missing.push('Terms of Service');
    if (!consent.carbonRightsTransfer) missing.push('Carbon Rights Transfer');
    if (!consent.aiMonitoring) missing.push('AI Monitoring');
    
    return {
      authorized: false,
      message: `Missing required consents: ${missing.join(', ')}. All agreements must be accepted to process carbon calculations.`,
      consentHash: consent.consentHash,
      consentMetadata: null,
    };
  }

  // User is authorized - generate consent metadata for token attachment
  return {
    authorized: true,
    message: 'User is authorized',
    consentHash: consent.consentHash,
    consentMetadata: generateConsentMetadata(
      consent.consentHash,
      consent.carbonRightsTransfer,
      consent.aiMonitoring,
      consent.termsVersion,
      consent.termsAcceptedAt || new Date()
    ),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feedstockType = searchParams.get('feedstockType');
    const stabilityClass = searchParams.get('stabilityClass');
    const farmerId = searchParams.get('farmerId');
    const batchId = searchParams.get('batchId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};
    if (feedstockType) where.feedstockType = feedstockType;
    if (stabilityClass) where.stabilityClass = stabilityClass;
    if (farmerId) where.farmerId = farmerId;
    if (batchId) where.batchId = { contains: batchId, mode: 'insensitive' };

    const batches = await prisma.biocharBatch.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: { farmer: true },
    });

    // Parse certificate metadata for each batch
    const batchesWithCertificate = batches.map(batch => ({
      ...batch,
      certificateMetadata: batch.certificateJson ? JSON.parse(batch.certificateJson) : null,
    }));

    return NextResponse.json(batchesWithCertificate);
  } catch (error) {
    console.error('Error fetching biochar batches:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    // ==================== TOKEN ACCESS GATE ====================
    // Verify user consent before processing any carbon calculations
    const consentCheck = await verifyUserConsent(userId);
    
    if (!consentCheck.authorized) {
      return NextResponse.json({
        error: 'Consent required',
        authorized: false,
        message: consentCheck.message,
        consentHash: consentCheck.consentHash,
      }, { status: 403 });
    }
    // ===========================================================

    // Look up farmer's referrer (agent) if farmerId is provided
    let agentId: string | undefined;
    if (body.farmerId) {
      const farmer = await prisma.farmer.findUnique({
        where: { id: body.farmerId },
        select: { referrerId: true },
      });
      agentId = farmer?.referrerId || undefined;
    }

    if (action === 'calculate') {
      // Just calculate without saving
      const input: BiocharCalculatorInput = {
        feedstockType: body.feedstockType as FeedstockType,
        dryWeightKg: body.dryWeightKg,
        moistureContentPercent: body.moistureContentPercent,
        pyrolysisTempCelsius: body.pyrolysisTempCelsius,
        hCorgRatio: body.hCorgRatio,
        farmerId: body.farmerId,
        agentId: agentId,  // Pass agent/referrer ID for commission split
        gpsCoordinates: body.gpsCoordinates,
      };

      const result = calculateCdrCredits(input);
      
      // Attach consent hash to result for audit trail
      return NextResponse.json({
        ...result,
        consent_verified: true,
        consent_hash: consentCheck.consentHash,
        consent_metadata: consentCheck.consentMetadata,
      });
    }

    if (action === 'save') {
      // Calculate and save
      const input: BiocharCalculatorInput = {
        feedstockType: body.feedstockType as FeedstockType,
        dryWeightKg: body.dryWeightKg,
        moistureContentPercent: body.moistureContentPercent,
        pyrolysisTempCelsius: body.pyrolysisTempCelsius,
        hCorgRatio: body.hCorgRatio,
        farmerId: body.farmerId,
        agentId: agentId,  // Pass agent/referrer ID for commission split
        gpsCoordinates: body.gpsCoordinates,
      };

      const result = calculateCdrCredits(input);

      // Enhance Hedera Guardian metadata with consent information
      const enhancedGuardianMetadata = {
        ...result.hedera_guardian_metadata,
        consent: {
          consentHash: consentCheck.consentHash,
          carbonRightsTransfer: consentCheck.consentMetadata?.carbon_rights_transfer,
          aiMonitoring: consentCheck.consentMetadata?.ai_monitoring,
          termsVersion: consentCheck.consentMetadata?.terms_version,
          consentTimestamp: consentCheck.consentMetadata?.consent_timestamp,
        },
      };

      // Save to database with certificate metadata and commission breakdown
      const batch = await prisma.biocharBatch.create({
        data: {
          batchId: result.batch_id,
          feedstockType: result.feedstock_type,
          dryWeightKg: result.dry_weight_kg,
          moistureContentPercent: input.moistureContentPercent ?? 15,
          pyrolysisTempCelsius: result.pyrolysis_temperature_celsius,
          hCorgRatio: result.h_corg_ratio,
          effectiveDryWeightKg: result.effective_dry_weight_kg,
          biocharYieldKg: result.biochar_yield_kg,
          cdrCreditsTonnes: result.cdr_credits_tonnes,
          co2EquivalentTonnes: result.co2_equivalent_tonnes,
          stabilityClass: result.stability_class,
          permanenceYears: result.permanence_years,
          permanenceFactor: result.permanence_factor,
          processCompliant: result.process_compliant,
          warnings: result.warnings.length > 0 ? result.warnings.join('; ') : null,
          feedstockSourceGps: result.feedstock_source_gps === 'unverified' ? null : result.feedstock_source_gps,
          farmerId: result.farmer_id,
          farmerCreditAmount: result.farmer_credit_amount,
          agentId: result.agent_id,
          agentCommissionAmount: result.agent_commission_amount,
          scrapnetAmount: result.platformAmount,
          hederaGuardianJson: JSON.stringify(enhancedGuardianMetadata),
          guardianTimestamp: new Date(result.timestamp),
          certificateJson: JSON.stringify(result.certificate_metadata),
        },
      });

      // If farmer is linked, update farmer stats and create credit
      if (result.farmer_id) {
        await prisma.farmer.update({
          where: { id: result.farmer_id },
          data: {
            totalFeedstockKg: { increment: result.dry_weight_kg },
            totalCreditsEarned: { increment: result.farmer_credit_amount },
          },
        });

        // Create farmer credit record
        await prisma.farmerCredit.create({
          data: {
            creditId: `CREDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            creditAmount: result.farmer_credit_amount,
            creditType: 'biochar_contribution',
            status: 'pending',
            batchId: result.batch_id,
            farmerId: result.farmer_id,
          },
        });
      }

      // If agent is linked, update agent stats and create agent commission credit
      if (result.agent_id && result.agent_commission_amount > 0) {
        await prisma.farmer.update({
          where: { id: result.agent_id },
          data: {
            totalAgentCommission: { increment: result.agent_commission_amount },
          },
        });

        // Create agent commission credit record
        await prisma.farmerCredit.create({
          data: {
            creditId: `AGENT-COMM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            creditAmount: result.agent_commission_amount,
            creditType: 'agent_commission',
            status: 'pending',
            batchId: result.batch_id,
            farmerId: result.agent_id,  // Agent receives the commission
          },
        });
      }

      return NextResponse.json({ 
        batch, 
        result: {
          ...result,
          hedera_guardian_metadata: enhancedGuardianMetadata,
        },
        consent_verified: true,
        consent_hash: consentCheck.consentHash,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing biochar request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
