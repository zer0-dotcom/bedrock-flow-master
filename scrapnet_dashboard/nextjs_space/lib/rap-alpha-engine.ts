/**
 * RAP ECONOMIC & CARBON ALPHA ENGINE
 * 
 * Calculates the financial and environmental "Alpha" (surplus value)
 * of RAP (Reclaimed Asphalt Pavement) mixes vs. 100% Virgin mixes.
 * 
 * Architecture:
 * - Baseline (Virgin Mix): 60 kg CO2/ton, Market Price
 * - Bedrock Reality (40% RAP): <45 kg CO2/ton, -25% Material Cost
 * - Aethex Verification: Guardian Layer confirms mix-design integrity
 */

import crypto from 'crypto';

// =============================================================================
// CONSTANTS & BASELINES
// =============================================================================

/**
 * Virgin Mix Baseline (100% Virgin Materials)
 * GWP A1-A3 Lifecycle Standard
 */
export const VIRGIN_MIX_BASELINE = {
  carbonKgPerTonne: 60.0, // kg CO2e per tonne
  materialCostPerTonne: 85.00, // USD per tonne (market average)
  binderContentPercent: 5.5, // Virgin asphalt binder percentage
  description: '100% Virgin Hot Mix Asphalt (HMA)',
  source: 'Eurobitume LCA Framework 2023 / NAPA Guidelines',
};

/**
 * RAP Mix Specifications at various percentages
 */
export const RAP_MIX_SPECS: Record<number, {
  carbonKgPerTonne: number;
  materialCostReduction: number;
  binderReduction: number;
  description: string;
}> = {
  20: {
    carbonKgPerTonne: 52.0,
    materialCostReduction: 0.12, // 12% savings
    binderReduction: 0.008, // 0.8% virgin binder reduction
    description: '20% RAP High-Performance Mix',
  },
  30: {
    carbonKgPerTonne: 48.0,
    materialCostReduction: 0.18, // 18% savings
    binderReduction: 0.012, // 1.2% virgin binder reduction
    description: '30% RAP Standard Mix',
  },
  40: {
    carbonKgPerTonne: 44.0, // <45 kg CO2/ton requirement met
    materialCostReduction: 0.25, // 25% savings
    binderReduction: 0.015, // 1.5% virgin binder reduction
    description: '40% RAP Optimized Mix (Bedrock Standard)',
  },
  50: {
    carbonKgPerTonne: 40.0,
    materialCostReduction: 0.30, // 30% savings
    binderReduction: 0.018, // 1.8% virgin binder reduction
    description: '50% RAP High-RAP Mix',
  },
};

/**
 * Carbon Market Prices
 */
export const RAP_CARBON_MARKET = {
  BEDROCK_VERIFIED: 52.50, // $/tCO2e for Bedrock-verified credits
  VOLUNTARY: 45.00, // $/tCO2e voluntary market
  EU_ETS: 85.50, // $/tCO2e EU ETS
  TRANSPARENCY_PREMIUM: 0.025, // 2.5% premium for L1 verification
};

/**
 * Mix Type Definitions
 */
export type MixType = 'HMA' | 'WMA' | 'CMA';

export const MIX_TYPE_SPECS: Record<MixType, {
  name: string;
  heatingReduction: number; // vs HMA baseline
  additionalCarbonReduction: number; // kg CO2e/tonne
}> = {
  HMA: {
    name: 'Hot Mix Asphalt',
    heatingReduction: 0,
    additionalCarbonReduction: 0,
  },
  WMA: {
    name: 'Warm Mix Asphalt',
    heatingReduction: 0.25, // 25% less heating
    additionalCarbonReduction: 4.5, // Additional savings
  },
  CMA: {
    name: 'Cold Mix Asphalt',
    heatingReduction: 0.90, // 90% less heating
    additionalCarbonReduction: 12.0, // Significant savings
  },
};

/**
 * Verification Status Types
 */
export type RAPVerificationStatus = 
  | 'PENDING'
  | 'GUARDIAN_SIGNED'
  | 'AETHEX_VERIFIED'
  | 'SPECULATIVE'
  | 'REJECTED';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Mix Design Input
 */
export interface MixDesignInput {
  mixDesignId: string;
  rapPercentage: number; // 0-50%
  mixType: MixType;
  tonnage: number;
  binderGrade?: string;
  plantLocation?: string;
  projectId?: string;
}

/**
 * Carbon Alpha Calculation Result
 */
export interface CarbonAlphaResult {
  mixDesignId: string;
  baseline: {
    carbonKgPerTonne: number;
    totalCarbonKg: number;
    source: string;
  };
  actual: {
    carbonKgPerTonne: number;
    totalCarbonKg: number;
    mixDescription: string;
  };
  delta: {
    carbonSavedKg: number;
    carbonSavedTonnes: number;
    percentReduction: number;
  };
  timestamp: string;
}

/**
 * Economic Alpha Calculation Result
 */
export interface EconomicAlphaResult {
  mixDesignId: string;
  materialCosts: {
    virginCostPerTonne: number;
    rapCostPerTonne: number;
    savingsPerTonne: number;
    totalSavings: number;
  };
  binderSavings: {
    virginBinderPercent: number;
    rapBinderPercent: number;
    binderReductionPercent: number;
    binderSavingsUsd: number;
  };
  carbonCredits: {
    carbonSavedTonnes: number;
    marketPricePerTonne: number;
    grossValue: number;
    transparencyPremium: number;
    totalValue: number;
  };
  greenAlpha: {
    materialSavings: number;
    binderSavings: number;
    carbonCreditValue: number;
    totalGreenAlphaUsd: number;
  };
  timestamp: string;
}

/**
 * Guardian Layer Verification
 */
export interface GuardianVerification {
  verificationId: string;
  guardianNodeId: string;
  signatureHash: string;
  mixDesignHash: string;
  integrityConfirmed: boolean;
  signedAt: string;
}

/**
 * RAP Alpha Settlement
 */
export interface RAPAlphaSettlement {
  settlementId: string;
  mixDesignId: string;
  carbonAlpha: CarbonAlphaResult;
  economicAlpha: EconomicAlphaResult;
  verificationStatus: RAPVerificationStatus;
  guardianVerification: GuardianVerification | null;
  assetTokenMapping: {
    tokenId: string;
    blockchainRef: string;
    mintedAt: string | null;
  } | null;
  layer1Hash: string;
  settledAt: string | null;
}

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

/**
 * Generate Mix Design Hash for verification
 */
export function generateMixDesignHash(input: MixDesignInput): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      mixDesignId: input.mixDesignId,
      rapPercentage: input.rapPercentage,
      mixType: input.mixType,
      tonnage: input.tonnage,
    }))
    .digest('hex');
}

/**
 * Calculate Carbon Alpha (Environmental Surplus)
 */
export function calculateCarbonAlpha(input: MixDesignInput): CarbonAlphaResult {
  const { rapPercentage, mixType, tonnage, mixDesignId } = input;
  
  // Get RAP specs (interpolate if needed)
  const rapSpec = getInterpolatedRAPSpec(rapPercentage);
  const mixTypeSpec = MIX_TYPE_SPECS[mixType];
  
  // Baseline (100% Virgin)
  const baselineCarbonPerTonne = VIRGIN_MIX_BASELINE.carbonKgPerTonne;
  const totalBaselineCarbon = baselineCarbonPerTonne * tonnage;
  
  // Actual (RAP Mix)
  const actualCarbonPerTonne = rapSpec.carbonKgPerTonne - mixTypeSpec.additionalCarbonReduction;
  const totalActualCarbon = actualCarbonPerTonne * tonnage;
  
  // Delta (Savings)
  const carbonSavedKg = totalBaselineCarbon - totalActualCarbon;
  const carbonSavedTonnes = carbonSavedKg / 1000;
  const percentReduction = ((baselineCarbonPerTonne - actualCarbonPerTonne) / baselineCarbonPerTonne) * 100;

  return {
    mixDesignId,
    baseline: {
      carbonKgPerTonne: baselineCarbonPerTonne,
      totalCarbonKg: totalBaselineCarbon,
      source: VIRGIN_MIX_BASELINE.source,
    },
    actual: {
      carbonKgPerTonne: actualCarbonPerTonne,
      totalCarbonKg: totalActualCarbon,
      mixDescription: `${rapPercentage}% RAP ${mixType} - ${rapSpec.description}`,
    },
    delta: {
      carbonSavedKg,
      carbonSavedTonnes,
      percentReduction,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate Economic Alpha (Financial Surplus)
 */
export function calculateEconomicAlpha(
  input: MixDesignInput,
  carbonAlpha: CarbonAlphaResult,
  marketPrice: number = RAP_CARBON_MARKET.BEDROCK_VERIFIED
): EconomicAlphaResult {
  const { rapPercentage, tonnage, mixDesignId } = input;
  const rapSpec = getInterpolatedRAPSpec(rapPercentage);
  
  // Material Cost Calculations
  const virginCostPerTonne = VIRGIN_MIX_BASELINE.materialCostPerTonne;
  const rapCostPerTonne = virginCostPerTonne * (1 - rapSpec.materialCostReduction);
  const savingsPerTonne = virginCostPerTonne - rapCostPerTonne;
  const totalMaterialSavings = savingsPerTonne * tonnage;
  
  // Binder Savings Calculations
  const virginBinderPercent = VIRGIN_MIX_BASELINE.binderContentPercent;
  const rapBinderPercent = virginBinderPercent - (rapSpec.binderReduction * 100);
  const binderReductionPercent = rapSpec.binderReduction * 100;
  // Binder cost ~$450/tonne, so savings per tonne of asphalt:
  const binderCostPerTonne = 450;
  const binderSavingsPerTonne = (rapSpec.binderReduction * binderCostPerTonne);
  const totalBinderSavings = binderSavingsPerTonne * tonnage;
  
  // Carbon Credit Calculations
  const carbonSavedTonnes = carbonAlpha.delta.carbonSavedTonnes;
  const grossCarbonValue = carbonSavedTonnes * marketPrice;
  const transparencyPremium = grossCarbonValue * RAP_CARBON_MARKET.TRANSPARENCY_PREMIUM;
  const totalCarbonValue = grossCarbonValue + transparencyPremium;
  
  // Total Green Alpha
  const totalGreenAlpha = totalMaterialSavings + totalBinderSavings + totalCarbonValue;

  return {
    mixDesignId,
    materialCosts: {
      virginCostPerTonne,
      rapCostPerTonne,
      savingsPerTonne,
      totalSavings: totalMaterialSavings,
    },
    binderSavings: {
      virginBinderPercent,
      rapBinderPercent,
      binderReductionPercent,
      binderSavingsUsd: totalBinderSavings,
    },
    carbonCredits: {
      carbonSavedTonnes,
      marketPricePerTonne: marketPrice,
      grossValue: grossCarbonValue,
      transparencyPremium,
      totalValue: totalCarbonValue,
    },
    greenAlpha: {
      materialSavings: totalMaterialSavings,
      binderSavings: totalBinderSavings,
      carbonCreditValue: totalCarbonValue,
      totalGreenAlphaUsd: totalGreenAlpha,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Interpolate RAP specs for non-standard percentages
 */
function getInterpolatedRAPSpec(rapPercentage: number): {
  carbonKgPerTonne: number;
  materialCostReduction: number;
  binderReduction: number;
  description: string;
} {
  // Clamp to valid range
  const clampedRap = Math.max(0, Math.min(50, rapPercentage));
  
  // If exact match exists
  if (RAP_MIX_SPECS[clampedRap]) {
    return RAP_MIX_SPECS[clampedRap];
  }
  
  // Linear interpolation between known values
  const knownPercentages = Object.keys(RAP_MIX_SPECS).map(Number).sort((a, b) => a - b);
  
  // Find surrounding values
  let lower = 0;
  let upper = knownPercentages[0];
  
  for (let i = 0; i < knownPercentages.length - 1; i++) {
    if (clampedRap >= knownPercentages[i] && clampedRap <= knownPercentages[i + 1]) {
      lower = knownPercentages[i];
      upper = knownPercentages[i + 1];
      break;
    }
  }
  
  // Handle edge cases
  if (clampedRap < knownPercentages[0]) {
    // Below minimum - linear from virgin to first RAP spec
    const ratio = clampedRap / knownPercentages[0];
    const firstSpec = RAP_MIX_SPECS[knownPercentages[0]];
    return {
      carbonKgPerTonne: VIRGIN_MIX_BASELINE.carbonKgPerTonne - 
        (VIRGIN_MIX_BASELINE.carbonKgPerTonne - firstSpec.carbonKgPerTonne) * ratio,
      materialCostReduction: firstSpec.materialCostReduction * ratio,
      binderReduction: firstSpec.binderReduction * ratio,
      description: `${clampedRap}% RAP Custom Mix`,
    };
  }
  
  if (lower === 0) {
    return RAP_MIX_SPECS[knownPercentages[0]];
  }
  
  // Interpolate
  const lowerSpec = RAP_MIX_SPECS[lower];
  const upperSpec = RAP_MIX_SPECS[upper];
  const ratio = (clampedRap - lower) / (upper - lower);
  
  return {
    carbonKgPerTonne: lowerSpec.carbonKgPerTonne + 
      (upperSpec.carbonKgPerTonne - lowerSpec.carbonKgPerTonne) * ratio,
    materialCostReduction: lowerSpec.materialCostReduction + 
      (upperSpec.materialCostReduction - lowerSpec.materialCostReduction) * ratio,
    binderReduction: lowerSpec.binderReduction + 
      (upperSpec.binderReduction - lowerSpec.binderReduction) * ratio,
    description: `${clampedRap}% RAP Interpolated Mix`,
  };
}

/**
 * Generate Guardian Layer Verification
 */
export function generateGuardianVerification(
  mixDesignInput: MixDesignInput,
  guardianNodeId: string = 'GUARDIAN_NODE_RAP'
): GuardianVerification {
  const mixDesignHash = generateMixDesignHash(mixDesignInput);
  
  const signatureHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      mixDesignHash,
      guardianNodeId,
      timestamp: Date.now(),
    }))
    .digest('hex');

  // Integrity check: RAP percentage must be within valid range
  const integrityConfirmed = 
    mixDesignInput.rapPercentage >= 0 &&
    mixDesignInput.rapPercentage <= 50 &&
    mixDesignInput.tonnage > 0;

  return {
    verificationId: `GV-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    guardianNodeId,
    signatureHash,
    mixDesignHash,
    integrityConfirmed,
    signedAt: new Date().toISOString(),
  };
}

/**
 * Execute RAP Alpha Settlement
 */
export async function executeRAPAlphaSettlement(
  input: MixDesignInput
): Promise<RAPAlphaSettlement> {
  const settlementId = `RAP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  
  // Calculate Carbon Alpha
  const carbonAlpha = calculateCarbonAlpha(input);
  
  // Calculate Economic Alpha
  const economicAlpha = calculateEconomicAlpha(input, carbonAlpha);
  
  // Generate Guardian Verification
  const guardianVerification = generateGuardianVerification(input);
  
  // Determine verification status
  let verificationStatus: RAPVerificationStatus;
  if (guardianVerification.integrityConfirmed) {
    verificationStatus = 'AETHEX_VERIFIED';
  } else {
    verificationStatus = 'SPECULATIVE';
  }
  
  // Generate Layer 1 hash
  const layer1Hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      settlementId,
      mixDesignId: input.mixDesignId,
      carbonSaved: carbonAlpha.delta.carbonSavedTonnes,
      greenAlpha: economicAlpha.greenAlpha.totalGreenAlphaUsd,
      verified: verificationStatus === 'AETHEX_VERIFIED',
    }))
    .digest('hex');

  // Asset Token Mapping (if verified)
  let assetTokenMapping = null;
  if (verificationStatus === 'AETHEX_VERIFIED') {
    assetTokenMapping = {
      tokenId: `BDRK-RAP-${input.mixDesignId.slice(0, 8)}`,
      blockchainRef: layer1Hash,
      mintedAt: new Date().toISOString(),
    };
  }

  return {
    settlementId,
    mixDesignId: input.mixDesignId,
    carbonAlpha,
    economicAlpha,
    verificationStatus,
    guardianVerification: verificationStatus === 'AETHEX_VERIFIED' ? guardianVerification : null,
    assetTokenMapping,
    layer1Hash,
    settledAt: verificationStatus === 'AETHEX_VERIFIED' ? new Date().toISOString() : null,
  };
}

/**
 * Get RAP Alpha Engine Status
 */
export function getRAPEngineStatus(): {
  name: string;
  version: string;
  baselines: typeof VIRGIN_MIX_BASELINE;
  rapSpecs: typeof RAP_MIX_SPECS;
  carbonMarket: typeof RAP_CARBON_MARKET;
  mixTypes: typeof MIX_TYPE_SPECS;
} {
  return {
    name: 'RAP Economic & Carbon Alpha Engine',
    version: '1.0.0',
    baselines: VIRGIN_MIX_BASELINE,
    rapSpecs: RAP_MIX_SPECS,
    carbonMarket: RAP_CARBON_MARKET,
    mixTypes: MIX_TYPE_SPECS,
  };
}

// =============================================================================
// ENGINE METADATA
// =============================================================================

export const RAP_ALPHA_ENGINE = {
  name: 'RAP Economic & Carbon Alpha Engine',
  version: '1.0.0',
  owner: 'Bedrock ESG',
  description: 'Calculates Green Alpha surplus value for RAP mixes vs. Virgin Asphalt',
  bedrockStandard: '40% RAP = <45 kg CO2/ton, -25% Material Cost, -1.5% Binder',
  verificationLayer: 'Guardian Layer + Aethex Verification',
};
