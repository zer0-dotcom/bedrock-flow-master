/**
 * Financed Emissions Impact Engine
 * 
 * Tracks the carbon footprint of digital financial markets:
 * 1. Digital Trade Footprint - Operational carbon per trade execution
 * 2. Portfolio Carbon Intensity - Scope 1, 2, 3 emissions for stock holdings
 * 3. ZerO Offset Protocol - Neutralize portfolio debt with Avoided Logistics Credits
 * 4. Backtrackable transparency for all data sources
 */

import crypto from 'crypto';

// ==================== DIGITAL TRADE FOOTPRINT ====================

/**
 * Baseline operational carbon per trade execution (2026 Standard)
 * Based on average data center energy consumption, network transmission,
 * and exchange infrastructure overhead
 */
export const TRADE_CARBON_BASELINE_GRAMS = 2.45; // g CO2e per execution

/**
 * Major financial data center regions and their estimated energy profiles
 * PUE = Power Usage Effectiveness (1.0 = perfect efficiency)
 */
export interface DataCenterProfile {
  id: string;
  name: string;
  region: string;
  coordinates: string;
  pue: number; // Power Usage Effectiveness
  gridCarbonIntensity: number; // g CO2/kWh
  estimatedCapacityMW: number;
  operator: string;
  exchanges: string[];
}

export const GLOBAL_DATA_CENTERS: DataCenterProfile[] = [
  {
    id: 'nyse-mahwah',
    name: 'NYSE Mahwah Data Center',
    region: 'North America',
    coordinates: '41.0885,-74.1438',
    pue: 1.35,
    gridCarbonIntensity: 340,
    estimatedCapacityMW: 40,
    operator: 'Intercontinental Exchange',
    exchanges: ['NYSE', 'NYSE American', 'NYSE Arca'],
  },
  {
    id: 'nasdaq-carteret',
    name: 'NASDAQ Carteret',
    region: 'North America',
    coordinates: '40.5851,-74.2279',
    pue: 1.40,
    gridCarbonIntensity: 345,
    estimatedCapacityMW: 35,
    operator: 'NASDAQ',
    exchanges: ['NASDAQ', 'NASDAQ Global Select'],
  },
  {
    id: 'lse-basildon',
    name: 'London Stock Exchange Basildon',
    region: 'Europe',
    coordinates: '51.5761,-0.4886',
    pue: 1.32,
    gridCarbonIntensity: 225,
    estimatedCapacityMW: 25,
    operator: 'LSEG',
    exchanges: ['LSE', 'AIM', 'Turquoise'],
  },
  {
    id: 'eurex-frankfurt',
    name: 'Eurex Frankfurt',
    region: 'Europe',
    coordinates: '50.1136,8.7147',
    pue: 1.28,
    gridCarbonIntensity: 380,
    estimatedCapacityMW: 20,
    operator: 'Deutsche Börse',
    exchanges: ['Eurex', 'Xetra', 'Frankfurt SE'],
  },
  {
    id: 'tse-tokyo',
    name: 'Tokyo Stock Exchange Arrowhead',
    region: 'Asia-Pacific',
    coordinates: '35.6804,139.7690',
    pue: 1.38,
    gridCarbonIntensity: 470,
    estimatedCapacityMW: 30,
    operator: 'Japan Exchange Group',
    exchanges: ['TSE', 'OSE', 'TOCOM'],
  },
  {
    id: 'hkex-tseung-kwan',
    name: 'HKEX Tseung Kwan O',
    region: 'Asia-Pacific',
    coordinates: '22.3102,114.2645',
    pue: 1.45,
    gridCarbonIntensity: 520,
    estimatedCapacityMW: 22,
    operator: 'Hong Kong Exchanges',
    exchanges: ['HKEX', 'SEHK'],
  },
  {
    id: 'sgx-singapore',
    name: 'SGX Reach Gateway',
    region: 'Asia-Pacific',
    coordinates: '1.2805,103.8509',
    pue: 1.50,
    gridCarbonIntensity: 410,
    estimatedCapacityMW: 18,
    operator: 'Singapore Exchange',
    exchanges: ['SGX', 'SGX-DT'],
  },
  {
    id: 'cme-aurora',
    name: 'CME Aurora Data Center',
    region: 'North America',
    coordinates: '41.7594,-88.3200',
    pue: 1.33,
    gridCarbonIntensity: 395,
    estimatedCapacityMW: 45,
    operator: 'CME Group',
    exchanges: ['CME', 'CBOT', 'NYMEX', 'COMEX'],
  },
];

/**
 * Calculate operational carbon for a single trade execution
 */
export function calculateTradeCarbon(tradeCount: number = 1): {
  totalGrams: number;
  totalKg: number;
  totalTonnes: number;
  perTrade: number;
} {
  const totalGrams = TRADE_CARBON_BASELINE_GRAMS * tradeCount;
  return {
    totalGrams: Math.round(totalGrams * 100) / 100,
    totalKg: Math.round((totalGrams / 1000) * 10000) / 10000,
    totalTonnes: Math.round((totalGrams / 1000000) * 1000000) / 1000000,
    perTrade: TRADE_CARBON_BASELINE_GRAMS,
  };
}

/**
 * Estimate current global trade volume energy draw ("Digital Hum")
 * Based on real-time market hours and historical volume patterns
 */
export interface DigitalHumReading {
  timestamp: string;
  estimatedGlobalTradesPerSecond: number;
  estimatedEnergyDrawMW: number;
  co2ePerSecond: number; // grams
  activeDataCenters: string[];
  marketStatus: 'PEAK' | 'ACTIVE' | 'LOW' | 'OVERNIGHT';
}

export function calculateDigitalHum(): DigitalHumReading {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay();
  
  // Determine market status based on global trading hours
  let marketStatus: 'PEAK' | 'ACTIVE' | 'LOW' | 'OVERNIGHT';
  let volumeMultiplier: number;
  let activeDataCenters: string[] = [];
  
  // Weekend = overnight
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    marketStatus = 'OVERNIGHT';
    volumeMultiplier = 0.05; // Crypto/futures only
    activeDataCenters = ['cme-aurora'];
  } else if (utcHour >= 13 && utcHour <= 16) {
    // US market overlap with Europe (peak)
    marketStatus = 'PEAK';
    volumeMultiplier = 1.0;
    activeDataCenters = ['nyse-mahwah', 'nasdaq-carteret', 'lse-basildon', 'eurex-frankfurt', 'cme-aurora'];
  } else if (utcHour >= 8 && utcHour <= 17) {
    // European/US hours
    marketStatus = 'ACTIVE';
    volumeMultiplier = 0.7;
    activeDataCenters = ['nyse-mahwah', 'nasdaq-carteret', 'lse-basildon', 'eurex-frankfurt', 'cme-aurora'];
  } else if (utcHour >= 0 && utcHour <= 8) {
    // Asian hours
    marketStatus = 'ACTIVE';
    volumeMultiplier = 0.5;
    activeDataCenters = ['tse-tokyo', 'hkex-tseung-kwan', 'sgx-singapore'];
  } else {
    marketStatus = 'LOW';
    volumeMultiplier = 0.2;
    activeDataCenters = ['cme-aurora']; // 24h futures
  }
  
  // Baseline: ~500,000 trades/second globally at peak
  const baseTradesPerSecond = 500000;
  const estimatedTrades = Math.round(baseTradesPerSecond * volumeMultiplier);
  
  // Energy estimate: ~0.00001 kWh per trade avg = 10W, multiply by trades
  const energyPerTradekWh = 0.00001;
  const estimatedEnergyMW = (estimatedTrades * energyPerTradekWh * 3600) / 1000; // Convert to MW
  
  // CO2 per second
  const co2ePerSecond = estimatedTrades * TRADE_CARBON_BASELINE_GRAMS;
  
  return {
    timestamp: now.toISOString(),
    estimatedGlobalTradesPerSecond: estimatedTrades,
    estimatedEnergyDrawMW: Math.round(estimatedEnergyMW * 100) / 100,
    co2ePerSecond: Math.round(co2ePerSecond * 100) / 100,
    activeDataCenters,
    marketStatus,
  };
}

// ==================== PORTFOLIO CARBON INTENSITY ====================

/**
 * Carbon intensity data for major stock tickers
 * Scope 1: Direct emissions (owned/controlled sources)
 * Scope 2: Indirect emissions (purchased electricity, steam, heating)
 * Scope 3: Value chain emissions (upstream/downstream)
 * Units: tonnes CO2e per $1M revenue
 */
export interface StockCarbonIntensity {
  ticker: string;
  companyName: string;
  sector: string;
  scope1: number; // tCO2e/$M revenue
  scope2: number;
  scope3: number;
  totalIntensity: number;
  dataYear: number;
  dataSource: string;
  lastUpdated: string;
  sustainabilityRating: 'A' | 'B' | 'C' | 'D' | 'F';
}

// 2024/2025 Carbon intensity data (tonnes CO2e per $1M revenue)
export const STOCK_CARBON_DATA: StockCarbonIntensity[] = [
  // Financial Services
  {
    ticker: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    sector: 'Financial Services',
    scope1: 2.1,
    scope2: 8.5,
    scope3: 485.2, // Financed emissions
    totalIntensity: 495.8,
    dataYear: 2024,
    dataSource: 'CDP Climate Report 2024',
    lastUpdated: '2025-03-15',
    sustainabilityRating: 'B',
  },
  {
    ticker: 'BLK',
    companyName: 'BlackRock, Inc.',
    sector: 'Asset Management',
    scope1: 0.8,
    scope2: 3.2,
    scope3: 892.4, // Financed emissions (largest asset manager)
    totalIntensity: 896.4,
    dataYear: 2024,
    dataSource: 'BlackRock TCFD Report 2024',
    lastUpdated: '2025-02-28',
    sustainabilityRating: 'C',
  },
  {
    ticker: 'GS',
    companyName: 'Goldman Sachs Group, Inc.',
    sector: 'Financial Services',
    scope1: 1.5,
    scope2: 6.8,
    scope3: 412.3,
    totalIntensity: 420.6,
    dataYear: 2024,
    dataSource: 'CDP Climate Report 2024',
    lastUpdated: '2025-03-10',
    sustainabilityRating: 'B',
  },
  // Technology
  {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    scope1: 0.3,
    scope2: 0.2,
    scope3: 45.8, // Supply chain
    totalIntensity: 46.3,
    dataYear: 2024,
    dataSource: 'Apple Environmental Progress Report 2024',
    lastUpdated: '2025-04-22',
    sustainabilityRating: 'A',
  },
  {
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    sector: 'Technology',
    scope1: 0.2,
    scope2: 0.1,
    scope3: 38.5,
    totalIntensity: 38.8,
    dataYear: 2024,
    dataSource: 'Microsoft Sustainability Report 2024',
    lastUpdated: '2025-03-20',
    sustainabilityRating: 'A',
  },
  {
    ticker: 'GOOGL',
    companyName: 'Alphabet Inc.',
    sector: 'Technology',
    scope1: 0.4,
    scope2: 0.3,
    scope3: 42.1,
    totalIntensity: 42.8,
    dataYear: 2024,
    dataSource: 'Google Environmental Report 2024',
    lastUpdated: '2025-05-01',
    sustainabilityRating: 'A',
  },
  {
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    sector: 'Technology',
    scope1: 0.5,
    scope2: 2.8,
    scope3: 125.4, // Manufacturing + data center usage
    totalIntensity: 128.7,
    dataYear: 2024,
    dataSource: 'NVIDIA ESG Report 2024',
    lastUpdated: '2025-02-15',
    sustainabilityRating: 'B',
  },
  // Energy
  {
    ticker: 'XOM',
    companyName: 'Exxon Mobil Corporation',
    sector: 'Energy',
    scope1: 245.8,
    scope2: 32.5,
    scope3: 1820.4,
    totalIntensity: 2098.7,
    dataYear: 2024,
    dataSource: 'ExxonMobil Advancing Climate Solutions 2024',
    lastUpdated: '2025-01-30',
    sustainabilityRating: 'D',
  },
  {
    ticker: 'CVX',
    companyName: 'Chevron Corporation',
    sector: 'Energy',
    scope1: 228.3,
    scope2: 28.9,
    scope3: 1685.2,
    totalIntensity: 1942.4,
    dataYear: 2024,
    dataSource: 'Chevron Climate Change Report 2024',
    lastUpdated: '2025-02-10',
    sustainabilityRating: 'D',
  },
  // Healthcare
  {
    ticker: 'JNJ',
    companyName: 'Johnson & Johnson',
    sector: 'Healthcare',
    scope1: 8.2,
    scope2: 12.4,
    scope3: 68.5,
    totalIntensity: 89.1,
    dataYear: 2024,
    dataSource: 'J&J Health for Humanity Report 2024',
    lastUpdated: '2025-04-05',
    sustainabilityRating: 'B',
  },
  {
    ticker: 'UNH',
    companyName: 'UnitedHealth Group',
    sector: 'Healthcare',
    scope1: 1.2,
    scope2: 4.8,
    scope3: 52.3,
    totalIntensity: 58.3,
    dataYear: 2024,
    dataSource: 'UnitedHealth ESG Report 2024',
    lastUpdated: '2025-03-25',
    sustainabilityRating: 'B',
  },
  // Consumer
  {
    ticker: 'AMZN',
    companyName: 'Amazon.com, Inc.',
    sector: 'Consumer Discretionary',
    scope1: 12.5,
    scope2: 8.2,
    scope3: 185.4, // Logistics + supply chain
    totalIntensity: 206.1,
    dataYear: 2024,
    dataSource: 'Amazon Sustainability Report 2024',
    lastUpdated: '2025-07-01',
    sustainabilityRating: 'B',
  },
  {
    ticker: 'TSLA',
    companyName: 'Tesla, Inc.',
    sector: 'Automotive',
    scope1: 5.8,
    scope2: 15.2,
    scope3: 92.5, // Battery supply chain
    totalIntensity: 113.5,
    dataYear: 2024,
    dataSource: 'Tesla Impact Report 2024',
    lastUpdated: '2025-04-18',
    sustainabilityRating: 'B',
  },
  // Industrials
  {
    ticker: 'CAT',
    companyName: 'Caterpillar Inc.',
    sector: 'Industrials',
    scope1: 38.5,
    scope2: 22.1,
    scope3: 485.8,
    totalIntensity: 546.4,
    dataYear: 2024,
    dataSource: 'Caterpillar Sustainability Report 2024',
    lastUpdated: '2025-02-20',
    sustainabilityRating: 'C',
  },
  {
    ticker: 'BA',
    companyName: 'Boeing Company',
    sector: 'Aerospace & Defense',
    scope1: 25.2,
    scope2: 18.5,
    scope3: 892.4, // Aircraft lifecycle emissions
    totalIntensity: 936.1,
    dataYear: 2024,
    dataSource: 'Boeing Environment Report 2024',
    lastUpdated: '2025-03-15',
    sustainabilityRating: 'C',
  },
];

/**
 * Get carbon intensity data for a specific ticker
 */
export function getStockCarbonData(ticker: string): StockCarbonIntensity | null {
  return STOCK_CARBON_DATA.find(s => s.ticker.toUpperCase() === ticker.toUpperCase()) || null;
}

/**
 * Portfolio holding structure
 */
export interface PortfolioHolding {
  ticker: string;
  shares: number;
  currentPrice: number; // USD per share
  companyRevenue?: number; // Annual revenue in millions USD
}

export interface PortfolioCarbonResult {
  holdings: Array<{
    ticker: string;
    companyName: string;
    sector: string;
    shares: number;
    value: number;
    scope1Contribution: number;
    scope2Contribution: number;
    scope3Contribution: number;
    totalContribution: number;
    sustainabilityRating: string;
    dataSource: string;
  }>;
  totals: {
    portfolioValue: number;
    totalScope1: number;
    totalScope2: number;
    totalScope3: number;
    totalCarbonDebt: number;
    weightedIntensity: number;
    averageRating: string;
  };
  equivalencies: {
    carMilesEquivalent: number;
    flightsNYtoLA: number;
    homeYearsEquivalent: number;
    treesToOffset: number;
  };
  backtraceId: string;
  calculatedAt: string;
}

/**
 * Calculate portfolio carbon debt
 * Uses ownership-based attribution methodology
 */
export function calculatePortfolioCarbonDebt(
  holdings: PortfolioHolding[]
): PortfolioCarbonResult {
  const processedHoldings: PortfolioCarbonResult['holdings'] = [];
  let totalValue = 0;
  let totalScope1 = 0;
  let totalScope2 = 0;
  let totalScope3 = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  
  const ratingValues: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 };
  
  for (const holding of holdings) {
    const carbonData = getStockCarbonData(holding.ticker);
    if (!carbonData) continue;
    
    const holdingValue = holding.shares * holding.currentPrice;
    totalValue += holdingValue;
    
    // Attribute emissions based on ownership value
    // Using value-weighted approach (simplified PCAF methodology)
    const ownershipFactor = holdingValue / 1000000; // Convert to $M
    
    const scope1Contribution = carbonData.scope1 * ownershipFactor;
    const scope2Contribution = carbonData.scope2 * ownershipFactor;
    const scope3Contribution = carbonData.scope3 * ownershipFactor;
    const totalContribution = scope1Contribution + scope2Contribution + scope3Contribution;
    
    totalScope1 += scope1Contribution;
    totalScope2 += scope2Contribution;
    totalScope3 += scope3Contribution;
    
    ratingSum += ratingValues[carbonData.sustainabilityRating];
    ratingCount++;
    
    processedHoldings.push({
      ticker: holding.ticker,
      companyName: carbonData.companyName,
      sector: carbonData.sector,
      shares: holding.shares,
      value: Math.round(holdingValue * 100) / 100,
      scope1Contribution: Math.round(scope1Contribution * 1000) / 1000,
      scope2Contribution: Math.round(scope2Contribution * 1000) / 1000,
      scope3Contribution: Math.round(scope3Contribution * 1000) / 1000,
      totalContribution: Math.round(totalContribution * 1000) / 1000,
      sustainabilityRating: carbonData.sustainabilityRating,
      dataSource: carbonData.dataSource,
    });
  }
  
  const totalCarbonDebt = totalScope1 + totalScope2 + totalScope3;
  const weightedIntensity = totalValue > 0 ? (totalCarbonDebt / totalValue) * 1000000 : 0;
  
  // Calculate average rating
  const avgRatingValue = ratingCount > 0 ? ratingSum / ratingCount : 3;
  let averageRating = 'C';
  if (avgRatingValue >= 4.5) averageRating = 'A';
  else if (avgRatingValue >= 3.5) averageRating = 'B';
  else if (avgRatingValue >= 2.5) averageRating = 'C';
  else if (avgRatingValue >= 1.5) averageRating = 'D';
  else averageRating = 'F';
  
  // Calculate equivalencies (tonnes CO2e)
  const carMilesEquivalent = Math.round(totalCarbonDebt * 1000 / 0.404); // ~404g CO2/mile
  const flightsNYtoLA = Math.round(totalCarbonDebt / 0.9); // ~0.9 tonnes per flight
  const homeYearsEquivalent = Math.round(totalCarbonDebt / 7.5 * 10) / 10; // ~7.5 tonnes/home/year
  const treesToOffset = Math.round(totalCarbonDebt * 1000 / 21); // ~21kg CO2/tree/year
  
  // Generate backtrace ID for transparency
  const backtraceId = crypto
    .createHash('sha256')
    .update(`portfolio_${Date.now()}_${JSON.stringify(holdings)}`)
    .digest('hex')
    .substring(0, 16);
  
  return {
    holdings: processedHoldings,
    totals: {
      portfolioValue: Math.round(totalValue * 100) / 100,
      totalScope1: Math.round(totalScope1 * 1000) / 1000,
      totalScope2: Math.round(totalScope2 * 1000) / 1000,
      totalScope3: Math.round(totalScope3 * 1000) / 1000,
      totalCarbonDebt: Math.round(totalCarbonDebt * 1000) / 1000,
      weightedIntensity: Math.round(weightedIntensity * 100) / 100,
      averageRating,
    },
    equivalencies: {
      carMilesEquivalent,
      flightsNYtoLA,
      homeYearsEquivalent,
      treesToOffset,
    },
    backtraceId,
    calculatedAt: new Date().toISOString(),
  };
}

// ==================== ZerO OFFSET PROTOCOL ====================

export interface OffsetRequest {
  portfolioBacktraceId: string;
  carbonDebtTonnes: number;
  retiredCredits: Array<{
    verificationId: string;
    creditAmount: number; // tonnes CO2e
    creditType: 'AVOIDED_LOGISTICS' | 'DESTRUCTION_TOKENIZATION';
    destructionHash?: string;
  }>;
  institutionId: string;
  institutionName: string;
}

export interface OffsetResult {
  offsetId: string;
  status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  originalDebt: number;
  creditsRetired: number;
  remainingDebt: number;
  coveragePercent: number;
  retiredCertificates: Array<{
    verificationId: string;
    creditAmount: number;
    retirementHash: string;
    retiredAt: string;
  }>;
  certificate: {
    type: string;
    issuedTo: string;
    issuedAt: string;
    validUntil: string;
    offsetAmount: number;
    portfolioBacktraceId: string;
    certificationHash: string;
  };
}

/**
 * Process ZerO offset request by retiring Avoided Logistics Credits
 */
export function processZerOOffset(request: OffsetRequest): OffsetResult {
  const timestamp = new Date().toISOString();
  
  let totalRetired = 0;
  const retiredCertificates: OffsetResult['retiredCertificates'] = [];
  
  for (const credit of request.retiredCredits) {
    // Generate retirement hash
    const retirementHash = crypto
      .createHash('sha256')
      .update(`retire_${credit.verificationId}_${timestamp}_${request.institutionId}`)
      .digest('hex');
    
    retiredCertificates.push({
      verificationId: credit.verificationId,
      creditAmount: credit.creditAmount,
      retirementHash,
      retiredAt: timestamp,
    });
    
    totalRetired += credit.creditAmount;
  }
  
  const remainingDebt = Math.max(0, request.carbonDebtTonnes - totalRetired);
  const coveragePercent = (totalRetired / request.carbonDebtTonnes) * 100;
  
  let status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  if (coveragePercent >= 100) status = 'COMPLETE';
  else if (coveragePercent >= 50) status = 'PARTIAL';
  else status = 'INSUFFICIENT';
  
  // Generate certification hash
  const certificationHash = crypto
    .createHash('sha256')
    .update(`cert_${request.portfolioBacktraceId}_${totalRetired}_${timestamp}`)
    .digest('hex');
  
  const offsetId = `ZERO-${Date.now().toString(36).toUpperCase()}-${certificationHash.substring(0, 8).toUpperCase()}`;
  
  // Certificate valid for 1 year
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);
  
  return {
    offsetId,
    status,
    originalDebt: request.carbonDebtTonnes,
    creditsRetired: Math.round(totalRetired * 1000) / 1000,
    remainingDebt: Math.round(remainingDebt * 1000) / 1000,
    coveragePercent: Math.round(coveragePercent * 100) / 100,
    retiredCertificates,
    certificate: {
      type: 'ZerO Protocol Carbon Neutralization Certificate',
      issuedTo: request.institutionName,
      issuedAt: timestamp,
      validUntil: validUntil.toISOString(),
      offsetAmount: Math.round(Math.min(totalRetired, request.carbonDebtTonnes) * 1000) / 1000,
      portfolioBacktraceId: request.portfolioBacktraceId,
      certificationHash,
    },
  };
}

// ==================== DATA TRANSPARENCY / BACKTRACE ====================

export interface BacktraceResult {
  backtraceId: string;
  type: 'TRADE_FOOTPRINT' | 'PORTFOLIO_CARBON' | 'DATA_CENTER';
  requestedAt: string;
  dataLineage: Array<{
    source: string;
    dataType: string;
    fetchedAt: string;
    methodology: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  auditHash: string;
}

/**
 * Generate backtrace record for transparency
 */
export function generateBacktrace(
  type: BacktraceResult['type'],
  sources: Array<{ source: string; dataType: string; methodology: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW' }>
): BacktraceResult {
  const timestamp = new Date().toISOString();
  
  const dataLineage = sources.map(s => ({
    ...s,
    fetchedAt: timestamp,
  }));
  
  const backtraceId = crypto
    .createHash('sha256')
    .update(`backtrace_${type}_${timestamp}_${JSON.stringify(sources)}`)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
  
  const auditHash = crypto
    .createHash('sha256')
    .update(`audit_${backtraceId}_${JSON.stringify(dataLineage)}`)
    .digest('hex');
  
  return {
    backtraceId,
    type,
    requestedAt: timestamp,
    dataLineage,
    auditHash,
  };
}

/**
 * Get all available stock tickers
 */
export function getAvailableTickers(): string[] {
  return STOCK_CARBON_DATA.map(s => s.ticker);
}

/**
 * Get all stock carbon data
 */
export function getAllStockCarbonData(): StockCarbonIntensity[] {
  return STOCK_CARBON_DATA;
}
