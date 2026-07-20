/**
 * Metal Recovery CO2 Avoided Emissions Calculator
 * 
 * Emission factors represent CO2 equivalent emissions avoided by recycling
 * metal instead of using virgin material (kg CO2e per kg of metal).
 * 
 * Sources: World Steel Association, IAI, USGS, EPA
 */

export type MetalType = 'STEEL' | 'ALUMINUM' | 'COPPER' | 'BRASS' | 'STAINLESS' | 'MIXED' | 'OTHER';

// Emission factors in kg CO2e per kg of metal recycled
export const METAL_EMISSION_FACTORS: Record<MetalType, number> = {
  STEEL: 1.89,        // World Steel Association: 1.89 t CO2/t crude steel
  ALUMINUM: 9.7,      // IAI: Primary aluminum ~16.5, recycled ~0.5, avoided ~9.7
  COPPER: 2.8,        // USGS estimates for copper production
  BRASS: 2.5,         // Estimated based on Cu/Zn blend
  STAINLESS: 4.1,     // Higher due to Cr/Ni content
  MIXED: 2.5,         // Weighted average for mixed streams
  OTHER: 2.0,         // Conservative estimate
};

// Metal descriptions for UI
export const METAL_DESCRIPTIONS: Record<MetalType, string> = {
  STEEL: 'Carbon steel, structural steel, rebar',
  ALUMINUM: 'Aluminum alloys, extrusions, cans',
  COPPER: 'Copper wire, pipes, electrical components',
  BRASS: 'Brass fittings, valves, decorative items',
  STAINLESS: 'Stainless steel (304, 316, etc.)',
  MIXED: 'Mixed metal scrap, unsorted',
  OTHER: 'Other non-ferrous metals',
};

export interface MetalCalculationInput {
  metalType: MetalType;
  weightKg: number;
  purityPercent?: number; // Default 90%
}

export interface MetalCalculationResult {
  metalType: MetalType;
  weightKg: number;
  purityPercent: number;
  effectiveWeightKg: number;
  emissionFactor: number;
  avoidedEmissionsKg: number;
  avoidedEmissionsTonnes: number;
  equivalentTreesPlanted: number; // ~21 kg CO2 per tree per year
  equivalentCarMilesAvoided: number; // ~0.411 kg CO2 per mile
  blockchainMetadata: {
    timestamp: string;
    calculationVersion: string;
    metalType: string;
    emissionFactor: number;
    verificationHash: string;
  };
}

/**
 * Calculate avoided CO2 emissions from metal recovery
 */
export function calculateMetalAvoidedEmissions(
  input: MetalCalculationInput
): MetalCalculationResult {
  const purityPercent = input.purityPercent ?? 90;
  const emissionFactor = METAL_EMISSION_FACTORS[input.metalType];
  
  // Effective weight accounts for purity
  const effectiveWeightKg = input.weightKg * (purityPercent / 100);
  
  // Calculate avoided emissions
  const avoidedEmissionsKg = effectiveWeightKg * emissionFactor;
  const avoidedEmissionsTonnes = avoidedEmissionsKg / 1000;
  
  // Equivalencies for context
  const equivalentTreesPlanted = Math.round(avoidedEmissionsKg / 21);
  const equivalentCarMilesAvoided = Math.round(avoidedEmissionsKg / 0.411);
  
  // Generate verification hash for blockchain
  const timestamp = new Date().toISOString();
  const hashInput = `${input.metalType}-${input.weightKg}-${purityPercent}-${timestamp}`;
  const verificationHash = Buffer.from(hashInput).toString('base64').slice(0, 32);
  
  return {
    metalType: input.metalType,
    weightKg: input.weightKg,
    purityPercent,
    effectiveWeightKg,
    emissionFactor,
    avoidedEmissionsKg,
    avoidedEmissionsTonnes,
    equivalentTreesPlanted,
    equivalentCarMilesAvoided,
    blockchainMetadata: {
      timestamp,
      calculationVersion: '1.0.0',
      metalType: input.metalType,
      emissionFactor,
      verificationHash,
    },
  };
}
