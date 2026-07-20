import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generateTickerFeed,
  TradeSettlement,
  CARBON_MARKET_PRICES,
  INDUSTRY_BASELINES,
  AssetClass,
} from '@/lib/green-alpha-engine';

export const dynamic = 'force-dynamic';

/**
 * CAPITAL MARKETS TICKER FEED API
 *
 * Provides real-time JSON feed for the Capital Markets ticker.
 * Aggregates trade data by asset class with Green Alpha metrics.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const period = searchParams.get('period') || '24h';

    // Calculate time window
    const now = new Date();
    let startTime: Date;
    switch (period) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Fetch recent ledger entries
    const entries = await prisma.universalLedgerEntry.findMany({
      where: {
        createdAt: { gte: startTime },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Symbol mapping
    const symbolMap: Record<string, string> = {
      DEAD_MASS: 'BDRK.ASP',
      RESONANCE: 'BDRK.LOG',
      PARTICIPATION: 'BDRK.PRT',
      LEGACY_AUDIT: 'BDRK.LEG',
      VIBRATIONAL_EQUITY: 'BDRK.RE',
      BIOCHAR: 'BDRK.BIO',
      METAL_RECOVERY: 'BDRK.MTL',
      RE_HOSPITALITY_SALE: 'BDRK.RE',
      RE_HOSPITALITY_RENT: 'BDRK.RE',
      RE_HOSPITALITY_AIRBNB: 'BDRK.RE',
      ASPHALT: 'BDRK.ASP',
      REAL_ESTATE: 'BDRK.RE',
      AGRICULTURE: 'BDRK.AGR',
    };

    // Aggregate by symbol
    const aggregated = new Map<string, {
      symbol: string;
      assetClass: string;
      totalValue: number;
      totalAlpha: number;
      volume: number;
      verified: number;
      speculative: number;
    }>();

    for (const entry of entries) {
      const symbol = symbolMap[entry.extractionType] || 'BDRK.OTH';
      
      if (!aggregated.has(symbol)) {
        aggregated.set(symbol, {
          symbol,
          assetClass: entry.extractionType,
          totalValue: 0,
          totalAlpha: 0,
          volume: 0,
          verified: 0,
          speculative: 0,
        });
      }

      const agg = aggregated.get(symbol)!;
      agg.totalValue += entry.totalValueUsd;
      agg.totalAlpha += entry.carbonAvoidedTonnes;
      agg.volume++;
      if (entry.complianceState === 'COMPLIANT') {
        agg.verified++;
      } else {
        agg.speculative++;
      }
    }

    // Generate ticker entries
    const ticker = Array.from(aggregated.values()).map((agg) => {
      // Calculate mock 24h change (random for demo, would use historical data)
      const changePercent = (Math.random() - 0.3) * 10; // Bias slightly positive
      const change24h = agg.totalValue * (changePercent / 100);

      return {
        symbol: agg.symbol,
        name: getAssetClassName(agg.assetClass),
        lastTrade: agg.totalValue,
        change24h: change24h,
        changePercent24h: changePercent,
        volume24h: agg.volume,
        greenAlpha: agg.totalAlpha,
        alphaPerUnit: agg.volume > 0 ? agg.totalAlpha / agg.volume : 0,
        verificationRate: agg.volume > 0 ? (agg.verified / agg.volume) * 100 : 0,
        bid: agg.totalValue * 0.995,
        ask: agg.totalValue * 1.005,
        spread: 0.01,
        timestamp: now.toISOString(),
      };
    }).sort((a, b) => b.lastTrade - a.lastTrade);

    // Add market summary
    const marketSummary = {
      totalVolume: entries.length,
      totalValue: entries.reduce((sum, e) => sum + e.totalValueUsd, 0),
      totalGreenAlpha: entries.reduce((sum, e) => sum + e.carbonAvoidedTonnes, 0),
      verifiedTrades: entries.filter(e => e.complianceState === 'COMPLIANT').length,
      speculativeTrades: entries.filter(e => e.complianceState !== 'COMPLIANT').length,
      carbonPrice: CARBON_MARKET_PRICES.BEDROCK_VERIFIED,
      marketStatus: 'OPEN',
      lastUpdated: now.toISOString(),
    };

    // Add index calculation
    const bedrockIndex = {
      symbol: 'BDRK.IDX',
      name: 'Bedrock ESG Index',
      value: marketSummary.totalValue,
      change24h: marketSummary.totalValue * 0.023, // Mock 2.3% gain
      changePercent24h: 2.3,
      greenAlpha: marketSummary.totalGreenAlpha,
      components: ticker.length,
      timestamp: now.toISOString(),
    };

    if (format === 'minimal') {
      return NextResponse.json({
        ticker: ticker.map(t => ({
          s: t.symbol,
          p: t.lastTrade,
          c: t.changePercent24h,
          v: t.volume24h,
          a: t.greenAlpha,
        })),
        idx: bedrockIndex.value,
        ts: now.toISOString(),
      });
    }

    return NextResponse.json({
      ticker,
      index: bedrockIndex,
      marketSummary,
      period,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Ticker Feed GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getAssetClassName(type: string): string {
  const names: Record<string, string> = {
    DEAD_MASS: 'Asphalt Recovery',
    RESONANCE: 'Logistics Efficiency',
    PARTICIPATION: 'Stakeholder Actions',
    LEGACY_AUDIT: 'Historical Restoration',
    VIBRATIONAL_EQUITY: 'Real Estate',
    BIOCHAR: 'Biochar CDR',
    METAL_RECOVERY: 'Metal Recovery',
    RE_HOSPITALITY_SALE: 'Real Estate Sales',
    RE_HOSPITALITY_RENT: 'Real Estate Leasing',
    RE_HOSPITALITY_AIRBNB: 'Short-Term Rental',
    ASPHALT: 'Asphalt Production',
    REAL_ESTATE: 'Real Estate',
    AGRICULTURE: 'Agriculture',
  };
  return names[type] || type.replace(/_/g, ' ');
}
