import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  calculateTradeCarbon,
  calculateDigitalHum,
  calculatePortfolioCarbonDebt,
  processZerOOffset,
  generateBacktrace,
  getStockCarbonData,
  getAllStockCarbonData,
  getAvailableTickers,
  GLOBAL_DATA_CENTERS,
  PortfolioHolding,
  OffsetRequest,
} from '@/lib/financed-emissions';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Financed Emissions Impact Engine API
 * 
 * GET actions:
 * - digital-hum: Real-time energy draw visualization
 * - stock-data: Carbon intensity for specific ticker
 * - all-stocks: Full carbon intensity database
 * - tickers: Available ticker list
 * - data-centers: Global financial data center info
 * - backtrace: Retrieve backtrace details
 * - offsets: List portfolio offsets for an institution
 * - available-credits: Get available Avoided Logistics credits for retirement
 * 
 * POST actions:
 * - trade-footprint: Calculate operational carbon for trades
 * - portfolio-carbon: Calculate portfolio carbon debt
 * - zero-offset: Process ZerO offset request
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'digital-hum';

    switch (action) {
      case 'digital-hum': {
        const hum = calculateDigitalHum();
        
        // Include active data center details
        const activeCenters = GLOBAL_DATA_CENTERS.filter(dc => 
          hum.activeDataCenters.includes(dc.id)
        );
        
        const backtrace = generateBacktrace('TRADE_FOOTPRINT', [
          {
            source: 'Bedrock ESG Digital Hum Model v2026.1',
            dataType: 'Real-time trade volume estimation',
            methodology: 'Time-weighted global market activity analysis',
            confidence: 'MEDIUM',
          },
          {
            source: 'ISO 14064-3:2019',
            dataType: 'Carbon accounting standard',
            methodology: 'GHG Protocol Scope 2 calculation',
            confidence: 'HIGH',
          },
        ]);
        
        return NextResponse.json({
          ...hum,
          activeDataCenterDetails: activeCenters,
          dailyEstimate: {
            tradesPerDay: hum.estimatedGlobalTradesPerSecond * 86400,
            co2eKgPerDay: Math.round((hum.co2ePerSecond * 86400) / 1000),
            co2eTonnesPerDay: Math.round((hum.co2ePerSecond * 86400) / 1000000 * 100) / 100,
          },
          backtrace,
        });
      }

      case 'stock-data': {
        const ticker = searchParams.get('ticker');
        if (!ticker) {
          return NextResponse.json({ error: 'Ticker required' }, { status: 400 });
        }
        
        const data = getStockCarbonData(ticker);
        if (!data) {
          return NextResponse.json({ 
            error: `No carbon data available for ticker: ${ticker}`,
            availableTickers: getAvailableTickers(),
          }, { status: 404 });
        }
        
        const backtrace = generateBacktrace('PORTFOLIO_CARBON', [
          {
            source: data.dataSource,
            dataType: 'Company carbon intensity (tCO2e/$M revenue)',
            methodology: 'GHG Protocol Corporate Standard',
            confidence: 'HIGH',
          },
        ]);
        
        return NextResponse.json({ ...data, backtrace });
      }

      case 'all-stocks': {
        const data = getAllStockCarbonData();
        
        // Group by sector
        const bySector: Record<string, typeof data> = {};
        for (const stock of data) {
          if (!bySector[stock.sector]) bySector[stock.sector] = [];
          bySector[stock.sector].push(stock);
        }
        
        const backtrace = generateBacktrace('PORTFOLIO_CARBON', [
          {
            source: 'Multiple CDP/TCFD Reports 2024',
            dataType: 'Company carbon intensity database',
            methodology: 'Aggregated sustainability disclosures',
            confidence: 'HIGH',
          },
        ]);
        
        return NextResponse.json({
          totalStocks: data.length,
          stocks: data,
          bySector,
          availableTickers: getAvailableTickers(),
          backtrace,
        });
      }

      case 'tickers': {
        return NextResponse.json({
          tickers: getAvailableTickers(),
          count: getAvailableTickers().length,
        });
      }

      case 'data-centers': {
        const region = searchParams.get('region');
        let centers = GLOBAL_DATA_CENTERS;
        
        if (region) {
          centers = centers.filter(dc => 
            dc.region.toLowerCase().includes(region.toLowerCase())
          );
        }
        
        const backtrace = generateBacktrace('DATA_CENTER', [
          {
            source: 'Exchange Data Center Registry 2026',
            dataType: 'Financial infrastructure metadata',
            methodology: 'Direct operator reporting',
            confidence: 'HIGH',
          },
          {
            source: 'Grid Carbon Intensity API',
            dataType: 'Regional grid emission factors',
            methodology: 'Location-based accounting (GHG Protocol)',
            confidence: 'MEDIUM',
          },
        ]);
        
        return NextResponse.json({
          dataCenters: centers,
          count: centers.length,
          totalCapacityMW: centers.reduce((sum, dc) => sum + dc.estimatedCapacityMW, 0),
          backtrace,
        });
      }

      case 'backtrace': {
        const backtraceId = searchParams.get('id');
        if (!backtraceId) {
          return NextResponse.json({ error: 'Backtrace ID required' }, { status: 400 });
        }
        
        // Check emission logs for backtrace
        const log = await prisma.financedEmissionLog.findFirst({
          where: { backtraceId },
        });
        
        if (log) {
          return NextResponse.json({
            found: true,
            backtraceId,
            emissionType: log.emissionType,
            createdAt: log.createdAt,
            totalEmissions: log.totalEmissions,
            scope1: log.scope1Emissions,
            scope2: log.scope2Emissions,
            scope3: log.scope3Emissions,
            backtraceData: log.backtraceJson ? JSON.parse(log.backtraceJson) : null,
          });
        }
        
        // Check portfolio offsets
        const offset = await prisma.portfolioOffset.findFirst({
          where: { portfolioBacktraceId: backtraceId },
          include: { retiredCredits: true },
        });
        
        if (offset) {
          return NextResponse.json({
            found: true,
            backtraceId,
            type: 'PORTFOLIO_OFFSET',
            offset: {
              offsetId: offset.offsetId,
              institutionName: offset.institutionName,
              originalDebt: offset.originalDebtTonnes,
              creditsRetired: offset.creditsRetiredTonnes,
              status: offset.status,
              retiredCredits: offset.retiredCredits,
            },
          });
        }
        
        return NextResponse.json({ 
          found: false, 
          backtraceId,
          message: 'No records found for this backtrace ID',
        });
      }

      case 'offsets': {
        const institutionId = searchParams.get('institutionId');
        
        const where = institutionId ? { institutionId } : {};
        
        const offsets = await prisma.portfolioOffset.findMany({
          where,
          include: { retiredCredits: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        
        const stats = await prisma.portfolioOffset.aggregate({
          where,
          _sum: {
            originalDebtTonnes: true,
            creditsRetiredTonnes: true,
          },
          _count: true,
        });
        
        return NextResponse.json({
          offsets,
          stats: {
            totalOffsets: stats._count,
            totalDebtTonnes: stats._sum.originalDebtTonnes || 0,
            totalRetiredTonnes: stats._sum.creditsRetiredTonnes || 0,
          },
        });
      }

      case 'available-credits': {
        // Get verified vault verifications with unverified credits
        const verifications = await prisma.vaultVerification.findMany({
          where: {
            status: 'COMPLETED',
            creditStatus: { in: ['UNVERIFIED', 'PENDING_HASH'] },
          },
          select: {
            id: true,
            verificationId: true,
            unverifiedCredits: true,
            avoidedCo2Kg: true,
            destructionVideoHash: true,
            currencyType: true,
            totalValue: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        
        const availableCredits = verifications.map(v => ({
          verificationId: v.verificationId,
          creditAmount: v.unverifiedCredits || (v.avoidedCo2Kg ? v.avoidedCo2Kg / 1000 : 0),
          creditType: v.destructionVideoHash ? 'DESTRUCTION_TOKENIZATION' : 'AVOIDED_LOGISTICS',
          destructionHash: v.destructionVideoHash,
          currencyType: v.currencyType,
          originalValue: v.totalValue,
          createdAt: v.createdAt,
        }));
        
        const totalAvailable = availableCredits.reduce((sum, c) => sum + c.creditAmount, 0);
        
        return NextResponse.json({
          availableCredits,
          totalAvailableTonnes: Math.round(totalAvailable * 1000) / 1000,
          count: availableCredits.length,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Impact API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'trade-footprint';

    switch (action) {
      case 'trade-footprint': {
        const { tradeCount = 1 } = body;
        
        const result = calculateTradeCarbon(tradeCount);
        const hum = calculateDigitalHum();
        
        const backtrace = generateBacktrace('TRADE_FOOTPRINT', [
          {
            source: 'Bedrock ESG Trade Carbon Model v2026.1',
            dataType: 'Operational carbon per execution',
            methodology: 'ISO 14064 compliant calculation',
            confidence: 'HIGH',
          },
        ]);
        
        // Log the calculation
        const logId = `TF-${Date.now().toString(36).toUpperCase()}`;
        await prisma.financedEmissionLog.create({
          data: {
            logId,
            emissionType: 'TRADE_FOOTPRINT',
            inputDataJson: JSON.stringify({ tradeCount }),
            resultJson: JSON.stringify(result),
            totalEmissions: result.totalTonnes,
            backtraceId: backtrace.backtraceId,
            backtraceJson: JSON.stringify(backtrace),
          },
        });
        
        return NextResponse.json({
          ...result,
          currentMarketStatus: hum.marketStatus,
          globalTradesPerSecond: hum.estimatedGlobalTradesPerSecond,
          backtrace,
          logId,
        });
      }

      case 'portfolio-carbon': {
        const { holdings, institutionId } = body as {
          holdings: PortfolioHolding[];
          institutionId?: string;
        };
        
        if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
          return NextResponse.json({ error: 'Holdings array required' }, { status: 400 });
        }
        
        const result = calculatePortfolioCarbonDebt(holdings);
        
        const backtrace = generateBacktrace('PORTFOLIO_CARBON', [
          {
            source: 'CDP/TCFD Corporate Disclosures 2024',
            dataType: 'Scope 1, 2, 3 emissions intensity',
            methodology: 'PCAF Partnership for Carbon Accounting Financials',
            confidence: 'HIGH',
          },
          {
            source: 'GHG Protocol Corporate Standard',
            dataType: 'Financed emissions methodology',
            methodology: 'Ownership-based attribution',
            confidence: 'HIGH',
          },
        ]);
        
        // Log the calculation
        const logId = `PC-${Date.now().toString(36).toUpperCase()}`;
        await prisma.financedEmissionLog.create({
          data: {
            logId,
            emissionType: 'PORTFOLIO_CARBON',
            inputDataJson: JSON.stringify({ holdings }),
            resultJson: JSON.stringify(result),
            totalEmissions: result.totals.totalCarbonDebt,
            scope1Emissions: result.totals.totalScope1,
            scope2Emissions: result.totals.totalScope2,
            scope3Emissions: result.totals.totalScope3,
            backtraceId: result.backtraceId,
            backtraceJson: JSON.stringify(backtrace),
            institutionId,
          },
        });
        
        return NextResponse.json({
          ...result,
          backtrace,
          logId,
        });
      }

      case 'zero-offset': {
        const offsetRequest = body as OffsetRequest;
        
        if (!offsetRequest.portfolioBacktraceId || !offsetRequest.carbonDebtTonnes) {
          return NextResponse.json({ 
            error: 'portfolioBacktraceId and carbonDebtTonnes required' 
          }, { status: 400 });
        }
        
        if (!offsetRequest.retiredCredits || offsetRequest.retiredCredits.length === 0) {
          return NextResponse.json({ 
            error: 'At least one credit to retire is required' 
          }, { status: 400 });
        }
        
        const result = processZerOOffset(offsetRequest);
        
        // Save to database
        const offset = await prisma.portfolioOffset.create({
          data: {
            offsetId: result.offsetId,
            institutionId: offsetRequest.institutionId,
            institutionName: offsetRequest.institutionName,
            portfolioBacktraceId: offsetRequest.portfolioBacktraceId,
            portfolioValueUsd: 0, // Would come from portfolio calc
            originalDebtTonnes: result.originalDebt,
            creditsRetiredTonnes: result.creditsRetired,
            remainingDebtTonnes: result.remainingDebt,
            coveragePercent: result.coveragePercent,
            status: result.status,
            certificationHash: result.certificate.certificationHash,
            certificateJson: JSON.stringify(result.certificate),
            validUntil: new Date(result.certificate.validUntil),
            retiredCredits: {
              create: result.retiredCertificates.map(rc => ({
                verificationId: rc.verificationId,
                creditType: offsetRequest.retiredCredits.find(
                  c => c.verificationId === rc.verificationId
                )?.creditType || 'AVOIDED_LOGISTICS',
                creditAmountTonnes: rc.creditAmount,
                retirementHash: rc.retirementHash,
                retiredAt: new Date(rc.retiredAt),
                destructionHash: offsetRequest.retiredCredits.find(
                  c => c.verificationId === rc.verificationId
                )?.destructionHash,
              })),
            },
          },
          include: { retiredCredits: true },
        });
        
        // Update vault verifications to mark credits as retired
        for (const credit of offsetRequest.retiredCredits) {
          await prisma.vaultVerification.updateMany({
            where: { verificationId: credit.verificationId },
            data: { creditStatus: 'VERIFIED' },
          });
        }
        
        return NextResponse.json({
          success: true,
          offset,
          result,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Impact API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
