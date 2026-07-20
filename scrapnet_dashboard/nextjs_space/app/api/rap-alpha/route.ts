import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import {
  RAP_ALPHA_ENGINE,
  VIRGIN_MIX_BASELINE,
  RAP_MIX_SPECS,
  RAP_CARBON_MARKET,
  MIX_TYPE_SPECS,
  calculateCarbonAlpha,
  calculateEconomicAlpha,
  generateGuardianVerification,
  executeRAPAlphaSettlement,
  getRAPEngineStatus,
  MixDesignInput,
  MixType,
} from '@/lib/rap-alpha-engine';

export const dynamic = 'force-dynamic';

/**
 * RAP ECONOMIC & CARBON ALPHA ENGINE API
 *
 * Calculates the financial and environmental "Alpha" (surplus value)
 * of RAP mixes versus 100% Virgin mixes.
 *
 * Baselines:
 * - Virgin Mix: 60 kg CO2/ton, Market Price
 * - 40% RAP (Bedrock Standard): <45 kg CO2/ton, -25% Material Cost
 *
 * Verification:
 * - "Aethex-Verified" only if Guardian Layer confirms mix-design integrity
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    // Engine status and configuration
    if (action === 'status') {
      const status = getRAPEngineStatus();
      return NextResponse.json({
        engine: RAP_ALPHA_ENGINE,
        status: 'ONLINE',
        configuration: status,
        verificationLayers: {
          guardianLayer: {
            type: 'Mix-Design Integrity Verification',
            status: 'ACTIVE',
          },
          aethexVerification: {
            type: 'Dual-Layer Attestation',
            status: 'ACTIVE',
          },
        },
        bedrockStandard: {
          rapPercentage: 40,
          carbonTarget: '<45 kg CO2/ton',
          materialSavings: '25%',
          binderReduction: '1.5%',
        },
      });
    }

    // Baselines and constants
    if (action === 'baselines') {
      return NextResponse.json({
        virginMix: VIRGIN_MIX_BASELINE,
        rapSpecs: RAP_MIX_SPECS,
        carbonMarket: RAP_CARBON_MARKET,
        mixTypes: MIX_TYPE_SPECS,
        formula: {
          greenAlpha: 'Green Alpha ($) = (Virgin Cost - RAP Cost) + (Carbon Credits × Market Price)',
          carbonAlpha: 'Carbon Alpha = Baseline CO2 - Actual CO2',
          economicAlpha: 'Economic Alpha = Material Savings + Binder Savings + Carbon Credit Value',
        },
      });
    }

    // Calculate for specific RAP percentage (quick calculation)
    if (action === 'calculate') {
      const rapPercentage = parseFloat(searchParams.get('rapPercentage') || '40');
      const tonnage = parseFloat(searchParams.get('tonnage') || '1000');
      const mixType = (searchParams.get('mixType') || 'HMA') as MixType;

      const input: MixDesignInput = {
        mixDesignId: `CALC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        rapPercentage,
        mixType,
        tonnage,
      };

      const carbonAlpha = calculateCarbonAlpha(input);
      const economicAlpha = calculateEconomicAlpha(input, carbonAlpha);

      return NextResponse.json({
        input: {
          rapPercentage,
          tonnage,
          mixType,
        },
        carbonAlpha: {
          baseline: `${carbonAlpha.baseline.carbonKgPerTonne} kg CO2/tonne`,
          actual: `${carbonAlpha.actual.carbonKgPerTonne.toFixed(1)} kg CO2/tonne`,
          saved: `${carbonAlpha.delta.carbonSavedTonnes.toFixed(2)} tonnes CO2`,
          reduction: `${carbonAlpha.delta.percentReduction.toFixed(1)}%`,
        },
        economicAlpha: {
          materialSavings: `$${economicAlpha.materialCosts.totalSavings.toFixed(2)}`,
          binderSavings: `$${economicAlpha.binderSavings.binderSavingsUsd.toFixed(2)}`,
          carbonCredits: `$${economicAlpha.carbonCredits.totalValue.toFixed(2)}`,
          totalGreenAlpha: `$${economicAlpha.greenAlpha.totalGreenAlphaUsd.toFixed(2)}`,
        },
        perTonneMetrics: {
          carbonSavedKg: (carbonAlpha.delta.carbonSavedKg / tonnage).toFixed(2),
          greenAlphaUsd: (economicAlpha.greenAlpha.totalGreenAlphaUsd / tonnage).toFixed(2),
        },
      });
    }

    // Fetch settlement history
    if (action === 'settlements') {
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const status = searchParams.get('status');

      const where: Record<string, unknown> = {
        tokenType: 'RAP_ALPHA',
      };
      if (status) {
        where.complianceState = status === 'VERIFIED' ? 'COMPLIANT' : 'FLAGGED';
      }

      const entries = await prisma.universalLedgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const settlements = entries.map((entry) => {
        const resultData = entry.resultJson ? JSON.parse(entry.resultJson as string) : {};
        return {
          settlementId: entry.entryId,
          mixDesignId: resultData.mixDesignId || 'N/A',
          rapPercentage: resultData.rapPercentage || 0,
          tonnage: resultData.tonnage || 0,
          carbonSavedTonnes: entry.carbonAvoidedTonnes,
          greenAlphaUsd: entry.totalValueUsd,
          status: entry.complianceState === 'COMPLIANT' ? 'AETHEX_VERIFIED' : 'SPECULATIVE',
          settledAt: entry.createdAt,
        };
      });

      return NextResponse.json({
        settlements,
        count: settlements.length,
        aggregates: {
          totalTonnage: settlements.reduce((sum, s) => sum + s.tonnage, 0),
          totalCO2Saved: settlements.reduce((sum, s) => sum + s.carbonSavedTonnes, 0),
          totalGreenAlpha: settlements.reduce((sum, s) => sum + s.greenAlphaUsd, 0),
        },
      });
    }

    // Compare RAP percentages
    if (action === 'compare') {
      const tonnage = parseFloat(searchParams.get('tonnage') || '1000');
      const mixType = (searchParams.get('mixType') || 'HMA') as MixType;

      const comparisons = [20, 30, 40, 50].map((rapPercentage) => {
        const input: MixDesignInput = {
          mixDesignId: `COMP-${rapPercentage}`,
          rapPercentage,
          mixType,
          tonnage,
        };

        const carbonAlpha = calculateCarbonAlpha(input);
        const economicAlpha = calculateEconomicAlpha(input, carbonAlpha);

        return {
          rapPercentage,
          carbonKgPerTonne: carbonAlpha.actual.carbonKgPerTonne,
          carbonSavedTonnes: carbonAlpha.delta.carbonSavedTonnes,
          reductionPercent: carbonAlpha.delta.percentReduction,
          materialSavingsUsd: economicAlpha.materialCosts.totalSavings,
          binderSavingsUsd: economicAlpha.binderSavings.binderSavingsUsd,
          carbonCreditsUsd: economicAlpha.carbonCredits.totalValue,
          totalGreenAlphaUsd: economicAlpha.greenAlpha.totalGreenAlphaUsd,
          description: RAP_MIX_SPECS[rapPercentage]?.description || 'Custom Mix',
        };
      });

      return NextResponse.json({
        tonnage,
        mixType,
        baseline: {
          carbonKgPerTonne: VIRGIN_MIX_BASELINE.carbonKgPerTonne,
          costPerTonne: VIRGIN_MIX_BASELINE.materialCostPerTonne,
        },
        comparisons,
        recommendation: {
          rapPercentage: 40,
          reason: 'Optimal balance of carbon reduction (-26.7%) and economic value',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('RAP Alpha GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Calculate and settle RAP Alpha
    if (action === 'settle') {
      const { mixDesignId, rapPercentage, mixType, tonnage, binderGrade, plantLocation, projectId } = body;

      if (!mixDesignId || rapPercentage === undefined || !tonnage) {
        return NextResponse.json(
          { error: 'Missing required fields: mixDesignId, rapPercentage, tonnage' },
          { status: 400 }
        );
      }

      const input: MixDesignInput = {
        mixDesignId,
        rapPercentage,
        mixType: mixType || 'HMA',
        tonnage,
        binderGrade,
        plantLocation,
        projectId,
      };

      // Execute settlement
      const settlement = await executeRAPAlphaSettlement(input);

      // Record in ledger if verified
      if (settlement.verificationStatus === 'AETHEX_VERIFIED') {
        const inputHash = crypto
          .createHash('sha256')
          .update(JSON.stringify(settlement.carbonAlpha))
          .digest('hex');

        await prisma.universalLedgerEntry.create({
          data: {
            entryId: settlement.settlementId,
            extractionType: 'DEAD_MASS', // Asphalt is DEAD_MASS category
            sourceNodeId: plantLocation || 'RAP_PLANT',
            inputHash,
            resultJson: JSON.stringify({
              mixDesignId,
              rapPercentage,
              tonnage,
              mixType: input.mixType,
              carbonAlpha: settlement.carbonAlpha.delta,
              economicAlpha: settlement.economicAlpha.greenAlpha,
              guardianVerification: settlement.guardianVerification,
            }),
            totalValueUsd: settlement.economicAlpha.greenAlpha.totalGreenAlphaUsd,
            founderYieldUsd: settlement.economicAlpha.greenAlpha.totalGreenAlphaUsd * 0.7,
            stewardshipUsd: settlement.economicAlpha.greenAlpha.totalGreenAlphaUsd * 0.2,
            publicResilienceUsd: settlement.economicAlpha.greenAlpha.totalGreenAlphaUsd * 0.1,
            carbonAvoidedTonnes: settlement.carbonAlpha.delta.carbonSavedTonnes,
            complianceState: 'COMPLIANT',
            tokenType: 'RAP_ALPHA',
            tokenMinted: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        settlement: {
          settlementId: settlement.settlementId,
          mixDesignId: settlement.mixDesignId,
          verificationStatus: settlement.verificationStatus,
          layer1Hash: settlement.layer1Hash,
          settledAt: settlement.settledAt,
        },
        carbonAlpha: {
          baseline: settlement.carbonAlpha.baseline,
          actual: settlement.carbonAlpha.actual,
          delta: settlement.carbonAlpha.delta,
        },
        economicAlpha: {
          materialCosts: settlement.economicAlpha.materialCosts,
          binderSavings: settlement.economicAlpha.binderSavings,
          carbonCredits: settlement.economicAlpha.carbonCredits,
          greenAlpha: settlement.economicAlpha.greenAlpha,
        },
        verification: settlement.guardianVerification
          ? {
              status: 'AETHEX_VERIFIED',
              guardianNodeId: settlement.guardianVerification.guardianNodeId,
              signatureHash: settlement.guardianVerification.signatureHash,
              integrityConfirmed: settlement.guardianVerification.integrityConfirmed,
            }
          : {
              status: 'SPECULATIVE',
              reason: 'Guardian Layer integrity check failed',
            },
        assetToken: settlement.assetTokenMapping,
      });
    }

    // Batch settlement
    if (action === 'batch-settle') {
      const { mixDesigns } = body;

      if (!mixDesigns || !Array.isArray(mixDesigns)) {
        return NextResponse.json(
          { error: 'Missing mixDesigns array' },
          { status: 400 }
        );
      }

      const results = [];
      let verifiedCount = 0;
      let speculativeCount = 0;
      let totalCarbonSaved = 0;
      let totalGreenAlpha = 0;

      for (const design of mixDesigns) {
        const input: MixDesignInput = {
          mixDesignId: design.mixDesignId || `BATCH-${crypto.randomBytes(4).toString('hex')}`,
          rapPercentage: design.rapPercentage || 40,
          mixType: design.mixType || 'HMA',
          tonnage: design.tonnage || 100,
        };

        const settlement = await executeRAPAlphaSettlement(input);

        if (settlement.verificationStatus === 'AETHEX_VERIFIED') {
          verifiedCount++;
        } else {
          speculativeCount++;
        }

        totalCarbonSaved += settlement.carbonAlpha.delta.carbonSavedTonnes;
        totalGreenAlpha += settlement.economicAlpha.greenAlpha.totalGreenAlphaUsd;

        results.push({
          settlementId: settlement.settlementId,
          mixDesignId: settlement.mixDesignId,
          rapPercentage: input.rapPercentage,
          status: settlement.verificationStatus,
          carbonSavedTonnes: settlement.carbonAlpha.delta.carbonSavedTonnes,
          greenAlphaUsd: settlement.economicAlpha.greenAlpha.totalGreenAlphaUsd,
        });
      }

      return NextResponse.json({
        success: true,
        batchSize: mixDesigns.length,
        verifiedCount,
        speculativeCount,
        totals: {
          carbonSavedTonnes: totalCarbonSaved,
          greenAlphaUsd: totalGreenAlpha,
        },
        results,
      });
    }

    // Verify mix design only (no settlement)
    if (action === 'verify') {
      const { mixDesignId, rapPercentage, mixType, tonnage } = body;

      if (!mixDesignId || rapPercentage === undefined || !tonnage) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const input: MixDesignInput = {
        mixDesignId,
        rapPercentage,
        mixType: mixType || 'HMA',
        tonnage,
      };

      const verification = generateGuardianVerification(input);

      return NextResponse.json({
        success: true,
        mixDesignId,
        verification: {
          verificationId: verification.verificationId,
          guardianNodeId: verification.guardianNodeId,
          integrityConfirmed: verification.integrityConfirmed,
          status: verification.integrityConfirmed ? 'AETHEX_VERIFIED' : 'REJECTED',
          mixDesignHash: verification.mixDesignHash,
          signedAt: verification.signedAt,
        },
        note: verification.integrityConfirmed
          ? 'Mix design integrity confirmed by Guardian Layer'
          : 'Mix design failed integrity check',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('RAP Alpha POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
