import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  calculateGreenAlpha,
  executeSmartSettlement,
  OperationalData,
  TradeSettlement,
  INDUSTRY_BASELINES,
  CARBON_MARKET_PRICES,
  TRANSPARENCY_PREMIUMS,
  GREEN_ALPHA_ENGINE,
} from '@/lib/green-alpha-engine';

export const dynamic = 'force-dynamic';

/**
 * TRADE SETTLEMENT & ALPHA CALCULATION ENGINE API
 *
 * Handles trade initiation, Layer 1 verification, and smart settlement.
 * Provides real-time valuation based on Green Alpha calculations.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      return NextResponse.json({
        engine: GREEN_ALPHA_ENGINE,
        baselines: INDUSTRY_BASELINES,
        carbonPrices: CARBON_MARKET_PRICES,
        transparencyPremiums: TRANSPARENCY_PREMIUMS,
        status: 'ONLINE',
        layer1Connected: true,
      });
    }

    if (action === 'settlements') {
      const status = searchParams.get('status');
      const assetClass = searchParams.get('assetClass');
      const limit = parseInt(searchParams.get('limit') || '50', 10);

      // Fetch from universal ledger as settlements proxy
      const where: Record<string, unknown> = {};
      if (status) where.complianceState = status;
      if (assetClass) where.extractionType = assetClass;

      const entries = await prisma.universalLedgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const settlements = entries.map((entry) => ({
        settlementId: `STL-${entry.entryId.slice(0, 8).toUpperCase()}`,
        tradeId: `TRD-${entry.entryId.slice(-8).toUpperCase()}`,
        status: entry.complianceState === 'COMPLIANT' ? 'VERIFIED' : 'SPECULATIVE',
        assetClass: entry.extractionType,
        totalValue: entry.totalValueUsd,
        greenAlpha: entry.carbonAvoidedTonnes,
        layer1Verified: entry.complianceState === 'COMPLIANT',
        settledAt: entry.createdAt,
      }));

      return NextResponse.json({ settlements, count: settlements.length });
    }

    if (action === 'baselines') {
      const assetClass = searchParams.get('assetClass');
      if (assetClass && INDUSTRY_BASELINES[assetClass as keyof typeof INDUSTRY_BASELINES]) {
        return NextResponse.json({
          assetClass,
          baseline: INDUSTRY_BASELINES[assetClass as keyof typeof INDUSTRY_BASELINES],
        });
      }
      return NextResponse.json({ baselines: INDUSTRY_BASELINES });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Trade Settlement GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'calculate-alpha') {
      const { operationalData, carbonPrice, premiumTier } = body;

      if (!operationalData || !operationalData.assetClass || !operationalData.assetId) {
        return NextResponse.json(
          { error: 'Missing operationalData with assetClass and assetId' },
          { status: 400 }
        );
      }

      const data: OperationalData = {
        assetClass: operationalData.assetClass,
        assetId: operationalData.assetId,
        quantity: operationalData.quantity || 1,
        energyDraw: operationalData.energyDraw,
        rapContent: operationalData.rapContent,
        biocharSequestration: operationalData.biocharSequestration,
        recycledContent: operationalData.recycledContent,
        renewableEnergy: operationalData.renewableEnergy,
        digitalPackets: operationalData.digitalPackets,
        displacedMiles: operationalData.displacedMiles,
        timestamp: new Date().toISOString(),
        sourceNodeId: operationalData.sourceNodeId || 'BEDROCK_NETWORK',
      };

      const result = calculateGreenAlpha(
        data,
        carbonPrice || CARBON_MARKET_PRICES.BEDROCK_VERIFIED,
        premiumTier || 'LAYER_1_VERIFIED'
      );

      return NextResponse.json({
        success: true,
        alphaResult: result,
        note: 'Green Alpha calculated. Initiate settlement to verify on Layer 1.',
      });
    }

    if (action === 'initiate-trade') {
      const { operationalData, carbonPrice, premiumTier, previousTokenValue } = body;

      if (!operationalData || !operationalData.assetClass || !operationalData.assetId) {
        return NextResponse.json(
          { error: 'Missing operationalData with assetClass and assetId' },
          { status: 400 }
        );
      }

      const data: OperationalData = {
        assetClass: operationalData.assetClass,
        assetId: operationalData.assetId,
        quantity: operationalData.quantity || 1,
        energyDraw: operationalData.energyDraw,
        rapContent: operationalData.rapContent,
        biocharSequestration: operationalData.biocharSequestration,
        recycledContent: operationalData.recycledContent,
        renewableEnergy: operationalData.renewableEnergy,
        digitalPackets: operationalData.digitalPackets,
        displacedMiles: operationalData.displacedMiles,
        timestamp: new Date().toISOString(),
        sourceNodeId: operationalData.sourceNodeId || 'BEDROCK_NETWORK',
      };

      // Calculate Green Alpha
      const alphaResult = calculateGreenAlpha(
        data,
        carbonPrice || CARBON_MARKET_PRICES.BEDROCK_VERIFIED,
        premiumTier || 'LAYER_1_VERIFIED'
      );

      // Execute Smart Settlement with Layer 1 ping
      const settlement: TradeSettlement = await executeSmartSettlement(
        alphaResult,
        previousTokenValue || 0
      );

      // Map asset class to extraction type (Prisma enum: DEAD_MASS, RESONANCE, PARTICIPATION)
      const getExtractionType = (assetClass: string): 'DEAD_MASS' | 'RESONANCE' | 'PARTICIPATION' => {
        switch (assetClass) {
          case 'ASPHALT':
          case 'METAL_RECOVERY':
          case 'REAL_ESTATE':
            return 'DEAD_MASS';
          case 'BIOCHAR':
          case 'AGRICULTURE':
            return 'PARTICIPATION';
          case 'DIGITAL_SECURITY':
            return 'RESONANCE'; // Digital transfers are in the Resonance category
          default:
            return 'RESONANCE';
        }
      };

      // If verified, record in ledger; if not, flag for remediation
      if (settlement.layer1Verified) {
        const inputHash = require('crypto')
          .createHash('sha256')
          .update(JSON.stringify(alphaResult))
          .digest('hex');

        await prisma.universalLedgerEntry.create({
          data: {
            entryId: settlement.tradeId,
            extractionType: getExtractionType(alphaResult.assetClass),
            sourceNodeId: data.sourceNodeId,
            inputHash,
            resultJson: JSON.stringify(alphaResult),
            totalValueUsd: alphaResult.valuation.totalValue,
            founderYieldUsd: alphaResult.valuation.totalValue * 0.7,
            stewardshipUsd: alphaResult.valuation.totalValue * 0.2,
            publicResilienceUsd: alphaResult.valuation.totalValue * 0.1,
            carbonAvoidedTonnes: alphaResult.delta.value / 1000,
            complianceState: 'COMPLIANT',
            tokenType: 'GREEN_ALPHA',
            tokenMinted: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        settlement,
        layer3Status: settlement.layer1Verified ? 'TRADE_EXECUTED' : 'FLAGGED_FOR_REMEDIATION',
        note: settlement.layer1Verified
          ? 'Smart Settlement executed. Asset token value updated.'
          : 'Trade flagged as Speculative. Moved to Remediation Log.',
      });
    }

    if (action === 'batch-settlement') {
      const { trades } = body;

      if (!trades || !Array.isArray(trades)) {
        return NextResponse.json(
          { error: 'Missing trades array' },
          { status: 400 }
        );
      }

      const results = [];
      let verifiedCount = 0;
      let speculativeCount = 0;

      for (const trade of trades) {
        const data: OperationalData = {
          assetClass: trade.assetClass,
          assetId: trade.assetId,
          quantity: trade.quantity || 1,
          energyDraw: trade.energyDraw,
          rapContent: trade.rapContent,
          biocharSequestration: trade.biocharSequestration,
          recycledContent: trade.recycledContent,
          renewableEnergy: trade.renewableEnergy,
          digitalPackets: trade.digitalPackets,
          displacedMiles: trade.displacedMiles,
          timestamp: new Date().toISOString(),
          sourceNodeId: trade.sourceNodeId || 'BEDROCK_NETWORK',
        };

        const alphaResult = calculateGreenAlpha(data);
        const settlement = await executeSmartSettlement(alphaResult);

        if (settlement.layer1Verified) {
          verifiedCount++;
        } else {
          speculativeCount++;
        }

        results.push({
          tradeId: settlement.tradeId,
          status: settlement.status,
          totalValue: settlement.alphaResult.valuation.totalValue,
          greenAlpha: settlement.alphaResult.delta.value / 1000,
        });
      }

      return NextResponse.json({
        success: true,
        batchSize: trades.length,
        verifiedCount,
        speculativeCount,
        results,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Trade Settlement POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
