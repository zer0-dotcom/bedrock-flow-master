/**
 * GREEN ALPHA CALCULATION ENGINE
 * Trade Settlement & Alpha Calculation for Bedrock ESG
 *
 * Calculates the "surplus value" created by sustainable asset performance
 * relative to industry baselines, enabling carbon credit valuation.
 */

import crypto from 'crypto';

// Asset class types supported by the engine
export type AssetClass = 'REAL_ESTATE' | 'ASPHALT' | 'AGRICULTURE' | 'BIOCHAR' | 'METAL_RECOVERY' | 'DIGITAL_SECURITY';

// Trade status based on Layer 1 verification
export type TradeStatus = 'PENDING' | 'VERIFIED' | 'SPECULATIVE' | 'SETTLED' | 'FLAGGED';

// Industry baseline emission factors (kg CO2e per unit)
export const INDUSTRY_BASELINES: Record<AssetClass, {
  unit: string;
  baselineEmission: number;
  description: string;
  source: string;
}> = {
  REAL_ESTATE: {
    unit: 'sq_meter/year',
    baselineEmission: 45.0, // kg CO2e per sq meter per year
    description: 'Commercial building energy consumption',
    source: 'EPA Commercial Buildings Standard 2024',
  },
  ASPHALT: {
    unit: 'tonne',
    baselineEmission: 60.0, // kg CO2e per tonne
    description: 'Hot Mix Asphalt production (A1-A3)',
    source: 'Eurobitume LCA Framework 2023',
  },
  AGRICULTURE: {
    unit: 'hectare/year',
    baselineEmission: 2500.0, // kg CO2e per hectare per year
    description: 'Conventional farming emissions',
    source: 'IPCC Agriculture Guidelines 2024',
  },
  BIOCHAR: {
    unit: 'tonne_feedstock',
    baselineEmission: 0, // Biochar is carbon-negative
    description: 'Carbon sequestration baseline',
    source: 'Puro.earth CDR Methodology',
  },
  METAL_RECOVERY: {
    unit: 'tonne',
    baselineEmission: 1800.0, // kg CO2e per tonne virgin metal
    description: 'Virgin metal extraction & processing',
    source: 'World Steel Association 2024',
  },
  DIGITAL_SECURITY: {
    unit: 'packet_transfer',
    baselineEmission: 337.5, // kg CO2e per armored transport route (125 miles × 2.7 kg/mile)
    description: 'Deprecated armored transport GHG baseline (Due4 Economic)',
    source: 'Aethex Ledger Transport Analysis 2024',
  },
};

// Current carbon credit market prices ($/tCO2e)
export const CARBON_MARKET_PRICES = {
  EU_ETS: 85.50,
  VOLUNTARY_MARKET: 45.00,
  CALIFORNIA_CAP: 35.00,
  BEDROCK_VERIFIED: 52.50, // Premium verified price
};

// Transparency premium rates
export const TRANSPARENCY_PREMIUMS = {
  LAYER_1_VERIFIED: 0.025, // 2.5% for L1 verification
  DUAL_ATTESTATION: 0.035, // 3.5% for dual-chain attestation
  FULL_AUDIT_TRAIL: 0.045, // 4.5% for complete audit trail
};

// Input data for operational metrics (Metric B)
export interface OperationalData {
  assetClass: AssetClass;
  assetId: string;
  quantity: number; // Units depend on asset class
  energyDraw?: number; // kWh
  rapContent?: number; // Percentage for asphalt
  biocharSequestration?: number; // tonnes CO2
  recycledContent?: number; // Percentage for metals
  renewableEnergy?: number; // Percentage
  digitalPackets?: number; // Number of digital packets (for DIGITAL_SECURITY)
  displacedMiles?: number; // Miles of armored transport displaced
  timestamp: string;
  sourceNodeId: string;
}

// Green Alpha calculation result
export interface GreenAlphaResult {
  tradeId: string;
  assetClass: AssetClass;
  assetId: string;
  metricA: {
    baseline: number;
    unit: string;
    source: string;
  };
  metricB: {
    actual: number;
    unit: string;
    dataSource: string;
  };
  delta: {
    value: number;
    unit: string;
    direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  };
  valuation: {
    carbonPrice: number;
    baseValue: number;
    transparencyPremium: number;
    premiumRate: number;
    totalValue: number;
    currency: string;
  };
  timestamp: string;
}

// Trade settlement record
export interface TradeSettlement {
  settlementId: string;
  tradeId: string;
  status: TradeStatus;
  layer1Verified: boolean;
  layer1PingTimestamp: string | null;
  layer1ResponseHash: string | null;
  alphaResult: GreenAlphaResult;
  tokenUpdate: {
    previousValue: number;
    newValue: number;
    changePercent: number;
  } | null;
  remediationRequired: boolean;
  remediationReason: string | null;
  settledAt: string | null;
}

// Capital markets ticker entry
export interface TickerEntry {
  symbol: string;
  assetClass: AssetClass;
  lastTrade: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  greenAlpha: number;
  verified: boolean;
  timestamp: string;
}

/**
 * Calculate Metric A (Industry Baseline)
 */
export function calculateMetricA(
  assetClass: AssetClass,
  quantity: number
): { baseline: number; unit: string; source: string } {
  const baselineData = INDUSTRY_BASELINES[assetClass];
  return {
    baseline: baselineData.baselineEmission * quantity,
    unit: `kg CO2e (${baselineData.unit})`,
    source: baselineData.source,
  };
}

/**
 * Calculate Metric B (Bedrock Reality - Actual Performance)
 */
export function calculateMetricB(data: OperationalData): {
  actual: number;
  unit: string;
  dataSource: string;
} {
  let actualEmission = 0;
  const baselineData = INDUSTRY_BASELINES[data.assetClass];

  switch (data.assetClass) {
    case 'REAL_ESTATE':
      // Calculate based on actual energy draw vs baseline
      const energyEmissionFactor = 0.4; // kg CO2e per kWh (grid average)
      const renewableReduction = (data.renewableEnergy || 0) / 100;
      actualEmission = (data.energyDraw || 0) * energyEmissionFactor * (1 - renewableReduction);
      break;

    case 'ASPHALT':
      // RAP content reduces virgin material emissions
      const rapPercent = (data.rapContent || 0) / 100;
      const virginEmission = baselineData.baselineEmission * (1 - rapPercent);
      const rapProcessingCost = 8.5 * rapPercent; // RAP processing overhead
      actualEmission = (virginEmission + rapProcessingCost) * data.quantity;
      break;

    case 'AGRICULTURE':
      // Biochar application reduces soil emissions
      const sequestration = data.biocharSequestration || 0;
      actualEmission = (baselineData.baselineEmission * data.quantity) - (sequestration * 1000);
      break;

    case 'BIOCHAR':
      // Biochar is carbon-negative; return negative value (sequestration)
      const cdrPerTonne = 2.8; // tonnes CO2 sequestered per tonne biochar
      actualEmission = -(data.quantity * cdrPerTonne * 1000); // Convert to kg
      break;

    case 'METAL_RECOVERY':
      // Recycled content reduces virgin extraction emissions
      const recycledPercent = (data.recycledContent || 0) / 100;
      const recyclingEmissionFactor = 0.15; // 15% of virgin emissions
      actualEmission = baselineData.baselineEmission * data.quantity *
        ((1 - recycledPercent) + (recycledPercent * recyclingEmissionFactor));
      break;

    case 'DIGITAL_SECURITY':
      // Digital transfer eliminates armored transport emissions entirely
      // Due4 Economic: -2.7 kg CO2e/mile displacement
      const DUE4_FACTOR = 2.7; // kg CO2e per mile
      const IDLE_EMISSIONS_PER_PACKET = 1.05; // kg CO2e (15 min idle × 4.2 kg/hr)
      const SECURITY_OVERHEAD = 1.35; // 35% security protocol overhead
      const DIGITAL_TRANSFER_EMISSIONS = 0.000014; // Negligible (0.0001 kWh × 0.4 kg/kWh × 0.35 non-renewable)
      
      const packets = data.digitalPackets || data.quantity;
      const milesPerPacket = data.displacedMiles || 125; // Default armored route
      
      // Digital transfers have near-zero emissions (100% reduction)
      actualEmission = packets * DIGITAL_TRANSFER_EMISSIONS;
      break;
  }

  return {
    actual: actualEmission,
    unit: 'kg CO2e',
    dataSource: `Bedrock Node: ${data.sourceNodeId}`,
  };
}

/**
 * Calculate Green Alpha (Delta between baseline and actual)
 */
export function calculateGreenAlpha(
  data: OperationalData,
  carbonPrice: number = CARBON_MARKET_PRICES.BEDROCK_VERIFIED,
  premiumTier: keyof typeof TRANSPARENCY_PREMIUMS = 'LAYER_1_VERIFIED'
): GreenAlphaResult {
  const tradeId = `TRD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  
  const metricA = calculateMetricA(data.assetClass, data.quantity);
  const metricB = calculateMetricB(data);
  
  // Delta = Baseline - Actual (positive = savings)
  const deltaValue = metricA.baseline - metricB.actual;
  const deltaDirection = deltaValue > 0 ? 'POSITIVE' : deltaValue < 0 ? 'NEGATIVE' : 'NEUTRAL';
  
  // Convert kg to tonnes for valuation
  const deltaTonnes = deltaValue / 1000;
  
  // Calculate trade value
  const baseValue = deltaTonnes * carbonPrice;
  const premiumRate = TRANSPARENCY_PREMIUMS[premiumTier];
  const transparencyPremium = baseValue * premiumRate;
  const totalValue = baseValue + transparencyPremium;

  return {
    tradeId,
    assetClass: data.assetClass,
    assetId: data.assetId,
    metricA: {
      baseline: metricA.baseline,
      unit: metricA.unit,
      source: metricA.source,
    },
    metricB: {
      actual: metricB.actual,
      unit: metricB.unit,
      dataSource: metricB.dataSource,
    },
    delta: {
      value: deltaValue,
      unit: 'kg CO2e saved',
      direction: deltaDirection,
    },
    valuation: {
      carbonPrice,
      baseValue: Math.max(0, baseValue),
      transparencyPremium: Math.max(0, transparencyPremium),
      premiumRate,
      totalValue: Math.max(0, totalValue),
      currency: 'USD',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Ping Layer 1 (Bedrock Ledger) for verification
 */
export async function pingLayer1(
  tradeId: string,
  assetId: string,
  deltaValue: number
): Promise<{
  verified: boolean;
  responseHash: string;
  timestamp: string;
  reason?: string;
}> {
  // Simulate Layer 1 verification ping
  const responseHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ tradeId, assetId, deltaValue, timestamp: Date.now() }))
    .digest('hex');

  // Verification logic: require positive delta and valid asset
  const verified = deltaValue > 0 && assetId.length > 0;

  return {
    verified,
    responseHash,
    timestamp: new Date().toISOString(),
    reason: verified ? undefined : 'Negative or zero delta value',
  };
}

/**
 * Execute Smart Settlement
 */
export async function executeSmartSettlement(
  alphaResult: GreenAlphaResult,
  previousTokenValue: number = 0
): Promise<TradeSettlement> {
  const settlementId = `STL-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  
  // Ping Layer 1 for verification
  const layer1Response = await pingLayer1(
    alphaResult.tradeId,
    alphaResult.assetId,
    alphaResult.delta.value
  );

  const isVerified = layer1Response.verified;
  const status: TradeStatus = isVerified ? 'VERIFIED' : 'SPECULATIVE';
  const remediationRequired = !isVerified;

  // Calculate token value update
  let tokenUpdate = null;
  if (isVerified && alphaResult.valuation.totalValue > 0) {
    const newValue = previousTokenValue + alphaResult.valuation.totalValue;
    const changePercent = previousTokenValue > 0
      ? ((newValue - previousTokenValue) / previousTokenValue) * 100
      : 100;
    
    tokenUpdate = {
      previousValue: previousTokenValue,
      newValue,
      changePercent,
    };
  }

  return {
    settlementId,
    tradeId: alphaResult.tradeId,
    status,
    layer1Verified: isVerified,
    layer1PingTimestamp: layer1Response.timestamp,
    layer1ResponseHash: layer1Response.responseHash,
    alphaResult,
    tokenUpdate,
    remediationRequired,
    remediationReason: remediationRequired ? layer1Response.reason || 'Layer 1 verification failed' : null,
    settledAt: isVerified ? new Date().toISOString() : null,
  };
}

/**
 * Generate Capital Markets Ticker Feed
 */
export function generateTickerFeed(
  settlements: TradeSettlement[],
  previousPrices: Map<string, number> = new Map()
): TickerEntry[] {
  const symbolMap: Record<AssetClass, string> = {
    REAL_ESTATE: 'BDRK.RE',
    ASPHALT: 'BDRK.ASP',
    AGRICULTURE: 'BDRK.AGR',
    BIOCHAR: 'BDRK.BIO',
    METAL_RECOVERY: 'BDRK.MTL',
    DIGITAL_SECURITY: 'BDRK.AETHEX',
  };

  // Group settlements by asset class
  const grouped = new Map<AssetClass, TradeSettlement[]>();
  for (const settlement of settlements) {
    const assetClass = settlement.alphaResult.assetClass;
    if (!grouped.has(assetClass)) {
      grouped.set(assetClass, []);
    }
    grouped.get(assetClass)!.push(settlement);
  }

  const ticker: TickerEntry[] = [];

  for (const [assetClass, classSettlements] of grouped) {
    const symbol = symbolMap[assetClass];
    const verifiedSettlements = classSettlements.filter(s => s.layer1Verified);
    
    const totalValue = classSettlements.reduce(
      (sum, s) => sum + s.alphaResult.valuation.totalValue, 0
    );
    const totalAlpha = classSettlements.reduce(
      (sum, s) => sum + s.alphaResult.delta.value, 0
    );
    const volume = classSettlements.length;

    const previousPrice = previousPrices.get(symbol) || 0;
    const change24h = totalValue - previousPrice;
    const changePercent24h = previousPrice > 0 ? (change24h / previousPrice) * 100 : 0;

    ticker.push({
      symbol,
      assetClass,
      lastTrade: totalValue,
      change24h,
      changePercent24h,
      volume24h: volume,
      greenAlpha: totalAlpha / 1000, // Convert to tonnes
      verified: verifiedSettlements.length === classSettlements.length,
      timestamp: new Date().toISOString(),
    });
  }

  return ticker.sort((a, b) => b.lastTrade - a.lastTrade);
}

// Engine metadata
export const GREEN_ALPHA_ENGINE = {
  name: 'Green Alpha Calculation Engine',
  version: '1.0.0',
  owner: 'Bedrock ESG',
  description: 'Trade Settlement & Alpha Calculation for Carbon Markets',
  supportedAssets: Object.keys(INDUSTRY_BASELINES),
  marketIntegrations: Object.keys(CARBON_MARKET_PRICES),
};
