import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  calculateDeadMass,
  calculateResonance,
  calculateParticipation,
  generateImpactReport,
  verifyZeroGreedPolicy,
  calculateLegacyAudit,
  calculateVibrationalEquity,
  processParametricInsurance,
  verifyGeniusActCompliance,
  generateSettlePulse,
  DeadMassInput,
  ResonanceInput,
  ParticipationInput,
  LegacyAuditInput,
  VibrationalEquityInput,
  ParametricInsuranceInput,
} from '@/lib/universal-law';
import { getBpsTable } from '@/lib/bps-config';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * BEDROCK ESG GLOBAL LEDGER API
 * Lead Actuary & Liquidity Architect
 * 
 * GET actions:
 * - split: Get Universal 70/20/10 split percentages
 * - entries: List universal ledger entries
 * - stats: Aggregate statistics
 * - impact-report: Generate/fetch impact reports
 * - public-resilience: Get Public Resilience pool status
 * - compliance: Check compliance status
 * 
 * POST actions:
 * - dead-mass: Module 1 - Industrial Extraction
 * - resonance: Module 2 - Creator Flow
 * - participation: Module 3 - CIP & FREALITY
 * - mint-token: Mint approved tokens
 * - restore-compliance: Restore high-friction transactions
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    switch (action) {
      case 'split': {
        // DYNAMIC BPS — read the live operator-configured table. No hardcoded
        // percentages: the label and every leg percentage derive from the
        // runtime config (defaults safely to a valid 10,000-sum table).
        const bpsTable = getBpsTable();
        return NextResponse.json({
          universalLaw: bpsTable.label,
          contractConfig: { bpsTable },
          bpsTable,
          split: {
            founderYield: bpsTable.earnerPct,
            stewardship: bpsTable.nodePct,
            publicResilience: bpsTable.depinPct,
          },
          description: {
            verifiedAssetValue: 'Direct liquidity for the source of energy',
            stewardship: 'Maintenance of Bedrock ESG/Unicon/Freality nodes',
            publicResilience: 'Non-custodial routing to Household Resilience Grants',
          },
        });
      }

      case 'entries': {
        const type = searchParams.get('type') as 'DEAD_MASS' | 'RESONANCE' | 'PARTICIPATION' | null;
        const nodeId = searchParams.get('nodeId');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const where: any = {};
        if (type) where.extractionType = type;
        if (nodeId) where.sourceNodeId = nodeId;
        
        const entries = await prisma.universalLedgerEntry.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        
        return NextResponse.json({ entries, count: entries.length });
      }

      case 'stats': {
        // Aggregate stats across all modules
        const [ledgerStats, deadMassStats, resonanceStats, socialYieldStats, grantStats] = await Promise.all([
          prisma.universalLedgerEntry.aggregate({
            _sum: {
              totalValueUsd: true,
              founderYieldUsd: true,
              stewardshipUsd: true,
              publicResilienceUsd: true,
              carbonAvoidedTonnes: true,
            },
            _count: true,
          }),
          prisma.deadMassExtraction.aggregate({
            _sum: { weightKg: true, carbonAvoidedTonnes: true, totalValueUsd: true },
            _count: true,
          }),
          prisma.resonancePrint.aggregate({
            _sum: { views: true, streams: true, carbonAvoidedTonnes: true, revenueUsd: true },
            _count: true,
          }),
          prisma.socialYield.aggregate({
            _sum: { totalYield: true, reductionKg: true },
            _count: true,
            where: { eligible: true },
          }),
          prisma.publicResilienceGrant.aggregate({
            _sum: { amountUsd: true },
            _count: true,
            where: { status: 'DISTRIBUTED' },
          }),
        ]);
        
        // Compliance stats
        const compliantCount = await prisma.universalLedgerEntry.count({
          where: { complianceState: 'COMPLIANT' },
        });
        const highFrictionCount = await prisma.universalLedgerEntry.count({
          where: { complianceState: 'HIGH_FRICTION' },
        });
        
        return NextResponse.json({
          universalLedger: {
            totalEntries: ledgerStats._count,
            totalValueUsd: ledgerStats._sum.totalValueUsd || 0,
            founderYieldUsd: ledgerStats._sum.founderYieldUsd || 0,
            stewardshipUsd: ledgerStats._sum.stewardshipUsd || 0,
            publicResilienceUsd: ledgerStats._sum.publicResilienceUsd || 0,
            carbonAvoidedTonnes: ledgerStats._sum.carbonAvoidedTonnes || 0,
          },
          module1_deadMass: {
            extractions: deadMassStats._count,
            totalWeightKg: deadMassStats._sum.weightKg || 0,
            carbonAvoidedTonnes: deadMassStats._sum.carbonAvoidedTonnes || 0,
            totalValueUsd: deadMassStats._sum.totalValueUsd || 0,
          },
          module2_resonance: {
            prints: resonanceStats._count,
            totalViews: resonanceStats._sum.views || 0,
            totalStreams: resonanceStats._sum.streams || 0,
            carbonAvoidedTonnes: resonanceStats._sum.carbonAvoidedTonnes || 0,
            totalRevenueUsd: resonanceStats._sum.revenueUsd || 0,
          },
          module3_participation: {
            eligibleParticipants: socialYieldStats._count,
            totalSocialYield: socialYieldStats._sum.totalYield || 0,
            totalReductionKg: socialYieldStats._sum.reductionKg || 0,
          },
          publicResilience: {
            grantsDistributed: grantStats._count,
            totalDistributedUsd: grantStats._sum.amountUsd || 0,
            poolAvailable: (ledgerStats._sum.publicResilienceUsd || 0) - (grantStats._sum.amountUsd || 0),
          },
          compliance: {
            compliant: compliantCount,
            highFriction: highFrictionCount,
            complianceRate: ledgerStats._count > 0 
              ? Math.round((compliantCount / ledgerStats._count) * 10000) / 100 
              : 100,
          },
        });
      }

      case 'impact-report': {
        const nodeId = searchParams.get('nodeId');
        const reportId = searchParams.get('reportId');
        
        if (reportId) {
          const report = await prisma.impactReport.findUnique({
            where: { reportId },
          });
          if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
          }
          return NextResponse.json(report);
        }
        
        // List reports for node
        const where = nodeId ? { nodeId } : {};
        const reports = await prisma.impactReport.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        
        return NextResponse.json({ reports, count: reports.length });
      }

      case 'public-resilience': {
        const region = searchParams.get('region');
        const status = searchParams.get('status');
        
        const where: any = {};
        if (region) where.region = region;
        if (status) where.status = status;
        
        const grants = await prisma.publicResilienceGrant.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        
        // Pool stats
        const totalPool = await prisma.universalLedgerEntry.aggregate({
          _sum: { publicResilienceUsd: true },
        });
        const distributed = await prisma.publicResilienceGrant.aggregate({
          _sum: { amountUsd: true },
          where: { status: 'DISTRIBUTED' },
        });
        
        return NextResponse.json({
          grants,
          pool: {
            total: totalPool._sum.publicResilienceUsd || 0,
            distributed: distributed._sum.amountUsd || 0,
            available: (totalPool._sum.publicResilienceUsd || 0) - (distributed._sum.amountUsd || 0),
          },
        });
      }

      case 'compliance': {
        const entries = await prisma.universalLedgerEntry.findMany({
          where: { complianceState: 'HIGH_FRICTION' },
          orderBy: { createdAt: 'desc' },
        });
        
        return NextResponse.json({
          highFrictionEntries: entries,
          count: entries.length,
          policy: 'Zero Greed Policy: 10% Public Resilience must be maintained',
        });
      }

      // ==================== MODULE 4: LEGACY AUDIT ====================
      case 'legacy-audits': {
        const ownerId = searchParams.get('ownerId');
        const dataSource = searchParams.get('dataSource');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const where: Record<string, unknown> = {};
        if (ownerId) where.ownerId = ownerId;
        if (dataSource) where.dataSource = dataSource;
        if (status) where.complianceStatus = status;
        
        const audits = await prisma.legacyAudit.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        
        // Aggregate stats
        const stats = await prisma.legacyAudit.aggregate({
          _sum: {
            legacyYieldUsd: true,
            founderYieldUsd: true,
            publicResilienceUsd: true,
            carbonAvoidedTonnes: true,
            totalTransactions: true,
            digitalTransactions: true,
          },
          _count: true,
        });
        
        return NextResponse.json({
          audits,
          count: audits.length,
          stats: {
            totalAudits: stats._count,
            totalLegacyYieldUsd: stats._sum.legacyYieldUsd || 0,
            totalPublicResilienceUsd: stats._sum.publicResilienceUsd || 0,
            totalCarbonAvoidedTonnes: stats._sum.carbonAvoidedTonnes || 0,
            totalTransactions: stats._sum.totalTransactions || 0,
            digitalTransactions: stats._sum.digitalTransactions || 0,
          },
        });
      }

      // ==================== REAL ESTATE: ASSET VALUATION ====================
      case 'vibrational-equity': {
        const ownerId = searchParams.get('ownerId');
        const state = searchParams.get('state');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const where: Record<string, unknown> = {};
        if (ownerId) where.ownerId = ownerId;
        if (state) where.equityState = state;
        
        const equities = await prisma.vibrationalEquity.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        
        // Aggregate stats
        const stats = await prisma.vibrationalEquity.aggregate({
          _sum: {
            equityValueUsd: true,
            batteryCapacityUsd: true,
            debtErasureAmountUsd: true,
            stewardshipFundsUsed: true,
          },
          _count: true,
        });
        
        const lockedCount = await prisma.vibrationalEquity.count({
          where: { equityState: 'LOCKED' },
        });
        
        return NextResponse.json({
          equities,
          count: equities.length,
          stats: {
            totalEquities: stats._count,
            totalEquityValueUsd: stats._sum.equityValueUsd || 0,
            totalBatteryCapacityUsd: stats._sum.batteryCapacityUsd || 0,
            totalDebtErasedUsd: stats._sum.debtErasureAmountUsd || 0,
            stewardshipFundsUsed: stats._sum.stewardshipFundsUsed || 0,
            lockedEquities: lockedCount,
          },
        });
      }

      // ==================== PARAMETRIC INSURANCE ====================
      case 'parametric-insurance': {
        const ownerId = searchParams.get('ownerId');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const where: Record<string, unknown> = {};
        if (ownerId) where.ownerId = ownerId;
        if (status) where.claimStatus = status;
        
        const policies = await prisma.parametricInsurance.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        
        // Aggregate stats
        const stats = await prisma.parametricInsurance.aggregate({
          _sum: {
            coverageAmountUsd: true,
            premiumPaidUsd: true,
            claimAmountUsd: true,
            accruedYieldUsd: true,
          },
          _count: true,
        });
        
        const noClaimCount = await prisma.parametricInsurance.count({
          where: { claimStatus: 'NO_CLAIM_YIELD' },
        });
        
        return NextResponse.json({
          policies,
          count: policies.length,
          stats: {
            totalPolicies: stats._count,
            totalCoverageUsd: stats._sum.coverageAmountUsd || 0,
            totalPremiumsUsd: stats._sum.premiumPaidUsd || 0,
            totalClaimsUsd: stats._sum.claimAmountUsd || 0,
            totalAccruedYieldUsd: stats._sum.accruedYieldUsd || 0,
            noClaimPolicies: noClaimCount,
          },
        });
      }

      // ==================== PULSE STRINGS (Live Marquee) ====================
      case 'pulse-strings': {
        const limit = parseInt(searchParams.get('limit') || '20');
        const type = searchParams.get('type');
        
        const where: Record<string, unknown> = {};
        if (type) where.pulseType = type;
        
        const pulses = await prisma.pulseString.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        
        // Mark as displayed
        const pulseIds = pulses.filter(p => !p.displayed).map(p => p.id);
        if (pulseIds.length > 0) {
          await prisma.pulseString.updateMany({
            where: { id: { in: pulseIds } },
            data: { displayed: true, displayedAt: new Date() },
          });
        }
        
        return NextResponse.json({
          pulses: pulses.map(p => ({
            id: p.pulseId,
            type: p.pulseType,
            string: p.pulseString,
            timestamp: p.createdAt,
            totalValueUsd: p.totalValueUsd,
            publicResilienceUsd: p.publicResilienceUsd,
            targetZipCode: p.targetZipCode,
          })),
          count: pulses.length,
        });
      }

      // ==================== V2.0 STATS (All Modules) ====================
      case 'v2-stats': {
        const [
          legacyStats,
          equityStats,
          insuranceStats,
          pulseStats,
        ] = await Promise.all([
          prisma.legacyAudit.aggregate({
            _sum: { legacyYieldUsd: true, publicResilienceUsd: true, carbonAvoidedTonnes: true },
            _count: true,
          }),
          prisma.vibrationalEquity.aggregate({
            _sum: { equityValueUsd: true, debtErasureAmountUsd: true },
            _count: true,
          }),
          prisma.parametricInsurance.aggregate({
            _sum: { coverageAmountUsd: true, accruedYieldUsd: true },
            _count: true,
          }),
          prisma.pulseString.count(),
        ]);
        
        return NextResponse.json({
          version: '2.0',
          modules: {
            module4_legacyAudit: {
              totalAudits: legacyStats._count,
              legacyYieldUsd: legacyStats._sum.legacyYieldUsd || 0,
              publicResilienceUsd: legacyStats._sum.publicResilienceUsd || 0,
              carbonAvoidedTonnes: legacyStats._sum.carbonAvoidedTonnes || 0,
            },
            realEstate_vibrationalEquity: {
              totalEquities: equityStats._count,
              totalEquityValueUsd: equityStats._sum.equityValueUsd || 0,
              totalDebtErasedUsd: equityStats._sum.debtErasureAmountUsd || 0,
            },
            insurance_parametric: {
              totalPolicies: insuranceStats._count,
              totalCoverageUsd: insuranceStats._sum.coverageAmountUsd || 0,
              accruedYieldUsd: insuranceStats._sum.accruedYieldUsd || 0,
            },
            pulseStrings: {
              totalPulses: pulseStats,
            },
          },
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Ledger API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'dead-mass': {
        const input = body.data as DeadMassInput;
        
        // Validate required fields
        if (!input.assetType || !input.weightKg || !input.verificationHash || !input.nodeId) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // Calculate dead mass extraction
        const result = calculateDeadMass(input);
        
        // Check Zero Greed Policy
        if (result.complianceStatus === 'HIGH_FRICTION') {
          return NextResponse.json({
            error: 'Zero Greed Policy Violation',
            message: 'Transaction bypasses 10% Public Resilience. Settlement blocked until ratio is restored.',
            result,
          }, { status: 403 });
        }
        
        // Save to database
        const entryId = `UL-${Date.now().toString(36).toUpperCase()}`;
        
        const [ledgerEntry, extraction] = await prisma.$transaction([
          prisma.universalLedgerEntry.create({
            data: {
              entryId,
              extractionType: 'DEAD_MASS',
              sourceNodeId: input.nodeId,
              totalValueUsd: input.totalValueUsd,
              founderYieldUsd: result.split.founderYieldUsd,
              stewardshipUsd: result.split.stewardshipUsd,
              publicResilienceUsd: result.split.publicResilienceUsd,
              carbonAvoidedTonnes: result.carbonAvoidedTonnes,
              deadMassKg: result.deadMassKg,
              complianceState: result.complianceStatus,
              tokenType: 'CARBON_NEGATIVE_RWA',
              inputHash: result.inputHash,
              resultJson: JSON.stringify(result),
              verificationHash: input.verificationHash,
            },
          }),
          prisma.deadMassExtraction.create({
            data: {
              extractionId: result.extractionId,
              assetType: input.assetType,
              weightKg: input.weightKg,
              destructionMethod: input.destructionMethod,
              verificationHash: input.verificationHash,
              gpsCoordinates: input.gpsCoordinates,
              iotTemperatureC: input.iotSensorData?.temperatureC,
              iotPressureBar: input.iotSensorData?.pressureBar,
              iotHumidityPercent: input.iotSensorData?.humidityPercent,
              iotTimestamp: input.iotSensorData?.timestampMs ? new Date(input.iotSensorData.timestampMs) : null,
              totalValueUsd: input.totalValueUsd,
              carbonAvoidedKg: result.carbonAvoidedKg,
              carbonAvoidedTonnes: result.carbonAvoidedTonnes,
              nodeId: input.nodeId,
              ledgerEntryId: entryId,
            },
          }),
        ]);
        
        return NextResponse.json({
          success: true,
          module: 'Industrial Extraction (Dead Mass)',
          ledgerEntryId: entryId,
          result,
          rwaToken: result.rwaToken,
        });
      }

      case 'resonance': {
        const input = body.data as ResonanceInput;
        
        if (!input.creatorId || !input.contentId || !input.contentType) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        const result = calculateResonance(input);
        
        if (result.complianceStatus === 'HIGH_FRICTION') {
          return NextResponse.json({
            error: 'Zero Greed Policy Violation',
            message: 'Transaction bypasses 10% Public Resilience. Settlement blocked.',
            result,
          }, { status: 403 });
        }
        
        const entryId = `UL-${Date.now().toString(36).toUpperCase()}`;
        
        const [ledgerEntry, resonancePrint] = await prisma.$transaction([
          prisma.universalLedgerEntry.create({
            data: {
              entryId,
              extractionType: 'RESONANCE',
              sourceNodeId: 'CREATOR_NETWORK',
              sourceEntityId: input.creatorId,
              totalValueUsd: input.revenueUsd,
              founderYieldUsd: result.split.founderYieldUsd,
              stewardshipUsd: result.split.stewardshipUsd,
              publicResilienceUsd: result.split.publicResilienceUsd,
              carbonAvoidedTonnes: result.avoidedLogistics.carbonAvoidedTonnes,
              complianceState: result.complianceStatus,
              tokenType: 'RESONANCE_PRINT',
              inputHash: crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex'),
              resultJson: JSON.stringify(result),
            },
          }),
          prisma.resonancePrint.create({
            data: {
              resonanceId: result.resonanceId,
              creatorId: input.creatorId,
              contentId: input.contentId,
              contentType: input.contentType,
              views: input.views,
              streams: input.streams,
              durationMinutes: input.durationMinutes,
              engagementScore: input.engagementScore,
              platform: input.platform,
              region: input.region,
              revenueUsd: input.revenueUsd,
              flightsAvoided: result.avoidedLogistics.flightsAvoided,
              plasticMediaTonnes: result.avoidedLogistics.plasticMediaTonnes,
              paperTonnes: result.avoidedLogistics.paperTonnes,
              carbonAvoidedTonnes: result.avoidedLogistics.carbonAvoidedTonnes,
              resonanceScore: result.resonancePrint.resonanceScore,
              ledgerEntryId: entryId,
            },
          }),
        ]);
        
        return NextResponse.json({
          success: true,
          module: 'Resonance Extraction (Creator Flow)',
          ledgerEntryId: entryId,
          result,
          resonancePrint: result.resonancePrint,
        });
      }

      case 'participation': {
        const input = body.data as ParticipationInput;
        
        if (!input.userId || !input.positiveActions || !input.consciousnessMetrics) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        const result = calculateParticipation(input);
        
        const entryId = `UL-${Date.now().toString(36).toUpperCase()}`;
        
        const [ledgerEntry, socialYield] = await prisma.$transaction([
          prisma.universalLedgerEntry.create({
            data: {
              entryId,
              extractionType: 'PARTICIPATION',
              sourceNodeId: 'FREALITY_NETWORK',
              sourceEntityId: input.userId,
              totalValueUsd: result.socialYield.totalYield,
              founderYieldUsd: result.socialYield.totalYield * 0.7,
              stewardshipUsd: result.socialYield.totalYield * 0.2,
              publicResilienceUsd: result.socialYield.totalYield * 0.1,
              carbonAvoidedTonnes: result.impactShift.reductionKg / 1000,
              complianceState: result.complianceStatus,
              tokenType: 'SOCIAL_YIELD',
              inputHash: crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex'),
              resultJson: JSON.stringify(result),
            },
          }),
          prisma.socialYield.create({
            data: {
              participationId: result.participationId,
              userId: input.userId,
              previousFootprintKg: result.impactShift.previousFootprintKg,
              currentFootprintKg: result.impactShift.currentFootprintKg,
              reductionKg: result.impactShift.reductionKg,
              reductionPercent: result.impactShift.reductionPercent,
              consciousnessScore: result.consciousnessScore,
              previousLevel: input.consciousnessMetrics.previousLevel,
              currentLevel: input.consciousnessMetrics.currentLevel,
              levelUp: result.levelUp,
              positiveActionsCount: input.positiveActions.length,
              positiveActionsJson: JSON.stringify(input.positiveActions),
              eligible: result.socialYield.eligible,
              yieldAmount: result.socialYield.yieldAmount,
              bonusMultiplier: result.socialYield.bonusMultiplier,
              totalYield: result.socialYield.totalYield,
              ledgerEntryId: entryId,
            },
          }),
        ]);
        
        return NextResponse.json({
          success: true,
          module: 'Participation Extraction (CIP & FREALITY)',
          ledgerEntryId: entryId,
          result,
          socialYield: result.socialYield,
        });
      }

      case 'generate-report': {
        const { nodeId, periodFrom, periodTo } = body;
        
        if (!nodeId || !periodFrom || !periodTo) {
          return NextResponse.json({ error: 'nodeId, periodFrom, periodTo required' }, { status: 400 });
        }
        
        // Get all entries for the node in the period
        const entries = await prisma.universalLedgerEntry.findMany({
          where: {
            sourceNodeId: nodeId,
            createdAt: {
              gte: new Date(periodFrom),
              lte: new Date(periodTo),
            },
          },
        });
        
        // Transform entries for report generation
        const transactions = entries.map(e => ({
          split: {
            founderYield: e.founderYieldUsd,
            stewardship: e.stewardshipUsd,
            publicResilience: e.publicResilienceUsd,
            total: e.totalValueUsd,
          },
          carbonTonnes: e.carbonAvoidedTonnes,
          complianceStatus: e.complianceState,
        }));
        
        const report = generateImpactReport(nodeId, transactions, periodFrom, periodTo);
        
        // Save report
        const savedReport = await prisma.impactReport.create({
          data: {
            reportId: report.reportId,
            nodeId: report.nodeId,
            periodFrom: new Date(periodFrom),
            periodTo: new Date(periodTo),
            deadMassKg: report.massAvoided.deadMassKg,
            carbonAvoidedTonnes: report.massAvoided.carbonAvoidedTonnes,
            equivalentFlights: report.massAvoided.equivalentFlights,
            equivalentCars: report.massAvoided.equivalentCars,
            publicResilienceUsd: report.familiesSustained.totalPublicResilienceUsd,
            averageGrantUsd: report.familiesSustained.averageGrantUsd,
            householdsReached: report.familiesSustained.householdsReached,
            founderYieldTotal: report.splitCompliance.founderYieldTotal,
            stewardshipTotal: report.splitCompliance.stewardshipTotal,
            complianceRate: report.splitCompliance.complianceRate,
            certificationHash: report.certificationHash,
          },
        });
        
        return NextResponse.json({
          success: true,
          report,
        });
      }

      case 'distribute-grant': {
        const { householdId, recipientName, region, amountUsd, grantType, sourceEntryIds } = body;
        
        if (!householdId || !region || !amountUsd || !grantType) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // Check available pool
        const totalPool = await prisma.universalLedgerEntry.aggregate({
          _sum: { publicResilienceUsd: true },
        });
        const distributed = await prisma.publicResilienceGrant.aggregate({
          _sum: { amountUsd: true },
        });
        
        const available = (totalPool._sum.publicResilienceUsd || 0) - (distributed._sum.amountUsd || 0);
        
        if (amountUsd > available) {
          return NextResponse.json({
            error: 'Insufficient pool funds',
            available,
            requested: amountUsd,
          }, { status: 400 });
        }
        
        const grantId = `PRG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        const grant = await prisma.publicResilienceGrant.create({
          data: {
            grantId,
            householdId,
            recipientName,
            region,
            amountUsd,
            grantType,
            sourceEntryIds: sourceEntryIds || [],
            status: 'PENDING',
          },
        });
        
        return NextResponse.json({
          success: true,
          grant,
          poolRemaining: available - amountUsd,
        });
      }

      case 'restore-compliance': {
        const { entryId, adjustedSplit } = body;
        
        if (!entryId) {
          return NextResponse.json({ error: 'entryId required' }, { status: 400 });
        }
        
        const entry = await prisma.universalLedgerEntry.findUnique({
          where: { entryId },
        });
        
        if (!entry) {
          return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }
        
        if (entry.complianceState !== 'HIGH_FRICTION') {
          return NextResponse.json({ error: 'Entry is not in HIGH_FRICTION state' }, { status: 400 });
        }
        
        // Verify the adjusted split complies with Zero Greed Policy
        const complianceCheck = verifyZeroGreedPolicy({
          founderYield: adjustedSplit?.founderYieldUsd || entry.founderYieldUsd,
          stewardship: adjustedSplit?.stewardshipUsd || entry.stewardshipUsd,
          publicResilience: adjustedSplit?.publicResilienceUsd || entry.publicResilienceUsd,
          total: entry.totalValueUsd,
        });
        
        if (complianceCheck === 'HIGH_FRICTION') {
          return NextResponse.json({
            error: 'Adjusted split still violates Zero Greed Policy',
            required: '10% minimum for Public Resilience',
          }, { status: 400 });
        }
        
        // Restore compliance
        const updated = await prisma.universalLedgerEntry.update({
          where: { entryId },
          data: {
            complianceState: 'RESTORED',
            complianceRestoredAt: new Date(),
            founderYieldUsd: adjustedSplit?.founderYieldUsd || entry.founderYieldUsd,
            stewardshipUsd: adjustedSplit?.stewardshipUsd || entry.stewardshipUsd,
            publicResilienceUsd: adjustedSplit?.publicResilienceUsd || entry.publicResilienceUsd,
          },
        });
        
        return NextResponse.json({
          success: true,
          message: 'Compliance restored. Settlement unblocked.',
          entry: updated,
        });
      }

      // ==================== MODULE 4: LEGACY AUDIT (Historical Healing) ====================
      case 'legacy-audit': {
        const input = body.data as LegacyAuditInput;
        
        if (!input.dataSource || !input.periodFrom || !input.periodTo || !input.ownerId || !input.ownerType) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // Calculate legacy audit
        const result = calculateLegacyAudit(input);
        
        // Verify GENIUS Act compliance
        const geniusCompliance = verifyGeniusActCompliance(
          'LEGACY_AUDIT',
          {
            founderYield: result.split.founderYieldUsd,
            stewardship: result.split.stewardshipUsd,
            publicResilience: result.split.publicResilienceUsd,
            total: result.legacyYieldUsd,
          },
          result.poeVerificationHash
        );
        
        // Save to database
        const audit = await prisma.legacyAudit.create({
          data: {
            auditId: result.auditId,
            dataSource: input.dataSource,
            dataSourceRef: input.dataSourceRef,
            uploadedFileHash: input.uploadedFileHash,
            periodFrom: new Date(input.periodFrom),
            periodTo: new Date(input.periodTo),
            yearsAnalyzed: result.period.yearsAnalyzed,
            totalTransactions: result.transactionAnalysis.totalTransactions,
            digitalTransactions: result.transactionAnalysis.digitalTransactions,
            digitalAdoptionRate: result.transactionAnalysis.digitalAdoptionRate,
            adminFrictionAvoided: result.frictionAvoided.adminFrictionUsd,
            logisticsFrictionAvoided: result.frictionAvoided.logisticsFrictionUsd,
            totalFrictionAvoided: result.frictionAvoided.totalFrictionUsd,
            marketRateMultiplier: result.marketRateMultiplier,
            legacyYieldUsd: result.legacyYieldUsd,
            founderYieldUsd: result.split.founderYieldUsd,
            stewardshipUsd: result.split.stewardshipUsd,
            publicResilienceUsd: result.split.publicResilienceUsd,
            carbonAvoidedTonnes: result.carbonAvoidedTonnes,
            ownerId: input.ownerId,
            ownerType: input.ownerType,
            ownerZipCode: input.ownerZipCode,
            complianceStatus: result.complianceStatus,
            geniusActCompliant: geniusCompliance.compliant,
            poeVerificationHash: result.poeVerificationHash,
            pulseStringGenerated: result.pulseString,
          },
        });
        
        // Create pulse string record
        const pulseId = `PS-${Date.now().toString(36).toUpperCase()}`;
        await prisma.pulseString.create({
          data: {
            pulseId,
            pulseType: 'RETRO_SETTLE',
            pulseString: result.pulseString,
            referenceId: result.auditId,
            referenceType: 'LEGACY_AUDIT',
            founderYieldUsd: result.split.founderYieldUsd,
            stewardshipUsd: result.split.stewardshipUsd,
            publicResilienceUsd: result.split.publicResilienceUsd,
            totalValueUsd: result.legacyYieldUsd,
            targetZipCode: input.ownerZipCode,
          },
        });
        
        return NextResponse.json({
          success: true,
          module: 'Legacy Audit (Historical Healing)',
          result,
          geniusActCompliance: geniusCompliance,
          pulseString: result.pulseString,
        });
      }

      // ==================== REAL ESTATE: ASSET VALUATION ====================
      case 'vibrational-equity': {
        const input = body.data as VibrationalEquityInput;
        
        if (!input.propertyAddress || !input.propertyType || !input.propertyZipCode ||
            input.currentValueUsd === undefined || input.mortgageBalanceUsd === undefined ||
            !input.ownerId) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // Calculate asset valuation
        const result = calculateVibrationalEquity(input);
        
        // Save to database
        const equity = await prisma.vibrationalEquity.create({
          data: {
            equityId: result.equityId,
            propertyAddress: input.propertyAddress,
            propertyType: input.propertyType,
            propertyZipCode: input.propertyZipCode,
            mlsNumber: input.mlsNumber,
            parcelNumber: input.parcelNumber,
            currentValueUsd: result.valuation.currentValueUsd,
            mortgageBalanceUsd: result.valuation.mortgageBalanceUsd,
            equityValueUsd: result.valuation.equityValueUsd,
            batteryCapacityUsd: result.liquidBattery.capacityUsd,
            batteryChargePercent: result.liquidBattery.chargePercent,
            equityState: result.liquidBattery.state,
            ownerId: input.ownerId,
            ownerName: input.ownerName,
            debtErasureActive: result.debtErasure?.active || false,
            debtErasureAmountUsd: result.debtErasure?.amountUsd,
            debtErasureStartedAt: result.debtErasure?.active ? new Date() : null,
            stewardshipFundsUsed: result.debtErasure?.stewardshipFundsRequired,
          },
        });
        
        // Create pulse string for debt erasure
        if (result.debtErasure) {
          const pulseId = `PS-${Date.now().toString(36).toUpperCase()}`;
          await prisma.pulseString.create({
            data: {
              pulseId,
              pulseType: 'DEBT_ERASURE',
              pulseString: result.debtErasure.pulseString,
              referenceId: result.equityId,
              referenceType: 'EQUITY',
              totalValueUsd: result.debtErasure.amountUsd,
              targetZipCode: input.propertyZipCode,
            },
          });
        }
        
        return NextResponse.json({
          success: true,
          module: 'Asset Valuation (Liquid Battery)',
          result,
          rwaEligible: result.rwaTokenPotential.eligibleForMint,
        });
      }

      // ==================== PARAMETRIC INSURANCE ====================
      case 'parametric-insurance': {
        const input = body.data as ParametricInsuranceInput;
        
        if (!input.policyType || input.coverageAmountUsd === undefined || 
            input.premiumPaidUsd === undefined || !input.policyStartDate ||
            !input.policyEndDate || !input.assetDescription || !input.ownerId) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // Process insurance
        const result = processParametricInsurance(input);
        
        // Save to database
        const policy = await prisma.parametricInsurance.create({
          data: {
            policyId: result.policyId,
            policyType: input.policyType,
            coverageAmountUsd: input.coverageAmountUsd,
            premiumPaidUsd: input.premiumPaidUsd,
            deductibleUsd: input.deductibleUsd || 0,
            policyStartDate: new Date(input.policyStartDate),
            policyEndDate: new Date(input.policyEndDate),
            assetDescription: input.assetDescription,
            assetLocationGps: input.assetLocationGps,
            assetZipCode: input.assetZipCode,
            iotDeviceIds: input.iotDeviceIds || [],
            satelliteDataSource: input.satelliteDataSource,
            parametricTrigger: input.parametricTrigger ? JSON.stringify(input.parametricTrigger) : null,
            claimStatus: result.claimStatus,
            claimFiledAt: input.fileClaim ? new Date() : null,
            claimVerifiedAt: result.iotVerification?.verified ? new Date() : null,
            claimSettledAt: result.settlement ? new Date() : null,
            claimAmountUsd: input.claimAmountUsd,
            noClaimDays: result.noClaimYield?.noClaimDays || 0,
            accruedYieldUsd: result.noClaimYield?.accruedYieldUsd || 0,
            yieldAprPercent: result.noClaimYield?.yieldAprPercent || 5.0,
            ownerId: input.ownerId,
            ownerName: input.ownerName,
            verificationHash: result.iotVerification?.verificationHash,
            lastPulseString: result.settlement?.pulseString,
          },
        });
        
        // Create pulse string for claim settlement
        if (result.settlement) {
          const pulseId = `PS-${Date.now().toString(36).toUpperCase()}`;
          await prisma.pulseString.create({
            data: {
              pulseId,
              pulseType: 'CLAIM_SETTLE',
              pulseString: result.settlement.pulseString,
              referenceId: result.policyId,
              referenceType: 'INSURANCE',
              founderYieldUsd: result.settlement.split.founderYieldUsd,
              stewardshipUsd: result.settlement.split.stewardshipUsd,
              publicResilienceUsd: result.settlement.split.publicResilienceUsd,
              totalValueUsd: result.settlement.afterDeductibleUsd,
              targetZipCode: input.assetZipCode,
            },
          });
        }
        
        return NextResponse.json({
          success: true,
          module: 'Parametric Insurance (IoT Verified)',
          result,
          noPhysicalAdjusterNeeded: result.iotVerification?.noPhysicalAdjusterNeeded ?? true,
        });
      }

      // ==================== GENIUS ACT COMPLIANCE CHECK ====================
      case 'verify-genius-act': {
        const { extractionType, split, verificationHash } = body;
        
        if (!extractionType || !split) {
          return NextResponse.json({ error: 'extractionType and split required' }, { status: 400 });
        }
        
        const compliance = verifyGeniusActCompliance(extractionType, split, verificationHash);
        
        return NextResponse.json({
          success: true,
          compliance,
          act: '2026 GENIUS Act',
          requirement: 'All prints must be verified via Proof of Extraction (PoE) before minting',
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Ledger API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
