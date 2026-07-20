/**
 * Impact Calculation Engine
 * 
 * Automates carbon impact calculations based on material type and weight.
 * Uses predefined emission factors from EPA and lifecycle assessment data.
 */

import { prisma } from '@/lib/db';

// ============================================
// Construction Materials - Avoided Emissions Model
// kgCO2e per kg - Industry-standard cradle-to-gate impact
// ============================================
export const CONSTRUCTION_EMISSION_FACTORS: Record<string, number> = {
  'SOLID_HARDWOOD': 9.2,      // kgCO2e/kg impact
  'ENGINEERED_WOOD': 11.4,
  'LVP_VINYL': 64.3,          // High carbon due to fossil fuel processing
  'COMPOSITE_CABINET': 20.0,
  'PARTICLE_BOARD': 15.0,
  'BAMBOO_FLOORING': 7.8,
  'CORK_FLOORING': 5.2,
  'CERAMIC_TILE': 12.6,
  'PORCELAIN_TILE': 14.2,
  'NATURAL_STONE': 8.4,
  'LAMINATE_FLOORING': 18.5,
  'CARPET_SYNTHETIC': 22.0,
  'CARPET_WOOL': 15.5,
};

// Processing cost constant (kgCO2e per kg to recycle/transport)
const RECYCLING_PROCESSING_COST = 2.0;

// Default carbon price per ton (USD)
const DEFAULT_CARBON_PRICE_PER_TON = 25.0;

/**
 * ImpactEngine - Static Methods for Construction Materials
 * Uses the "Avoided Emissions" model for carbon credit calculation
 */
export class ImpactEngine {
  /**
   * Calculates carbon savings based on avoided material impact.
   * Formula: Weight * (Avoided_Material_Factor - Recycled_Processing_Factor)
   */
  static calculateCarbonSaved(material: string, weightKg: number): number {
    const factor = CONSTRUCTION_EMISSION_FACTORS[material] || 10.0; // Default factor if unknown
    const processingCost = RECYCLING_PROCESSING_COST;
    
    // The credit is the "Avoided" cost minus the cost to recycle
    const savings = Math.max(0, weightKg * (factor - processingCost));
    return parseFloat(savings.toFixed(3));
  }

  static calculateUsdValue(carbonKg: number, carbonPricePerTon: number = DEFAULT_CARBON_PRICE_PER_TON): number {
    // Convert kg to tons (1000kg = 1 ton)
    return (carbonKg / 1000) * carbonPricePerTon;
  }

  /**
   * Get available construction materials
   */
  static getConstructionMaterials(): string[] {
    return Object.keys(CONSTRUCTION_EMISSION_FACTORS);
  }

  /**
   * Get emission factor for a construction material
   */
  static getConstructionFactor(material: string): number {
    return CONSTRUCTION_EMISSION_FACTORS[material] || 10.0;
  }

  /**
   * Full calculation with Universal Law split
   */
  static calculateWithSplit(material: string, weightKg: number, carbonPricePerTon: number = DEFAULT_CARBON_PRICE_PER_TON) {
    const carbonSavedKg = ImpactEngine.calculateCarbonSaved(material, weightKg);
    const valueUsd = ImpactEngine.calculateUsdValue(carbonSavedKg, carbonPricePerTon);
    
    return {
      material,
      weightKg,
      carbonSavedKg,
      carbonSavedTonnes: carbonSavedKg / 1000,
      valueUsd,
      founderYield70: valueUsd * 0.70,
      platformFee20: valueUsd * 0.20,
      publicOverflow10: valueUsd * 0.10,
      emissionFactor: CONSTRUCTION_EMISSION_FACTORS[material] || 10.0,
      processingCost: RECYCLING_PROCESSING_COST,
      carbonPricePerTon,
    };
  }
}

// ============================================
// Extended Material Emission Factors
// EPA WARM model and lifecycle assessment data
// ============================================

// Emission factors in kg CO2e per kg of material recycled
// Based on EPA WARM model and lifecycle assessment data
export const EMISSION_FACTORS: Record<string, {
  factor: number;       // kg CO2e saved per kg recycled
  description: string;
  category: string;
  source: string;
}> = {
  // Metals
  aluminum: {
    factor: 9.13,
    description: 'Aluminum cans and scrap',
    category: 'METAL',
    source: 'EPA WARM v15',
  },
  steel: {
    factor: 1.86,
    description: 'Steel and iron scrap',
    category: 'METAL',
    source: 'EPA WARM v15',
  },
  copper: {
    factor: 4.53,
    description: 'Copper wire and scrap',
    category: 'METAL',
    source: 'EPA WARM v15',
  },
  brass: {
    factor: 3.21,
    description: 'Brass fixtures and scrap',
    category: 'METAL',
    source: 'EPA WARM v15',
  },
  lead: {
    factor: 1.24,
    description: 'Lead batteries and scrap',
    category: 'METAL',
    source: 'EPA WARM v15',
  },
  zinc: {
    factor: 2.89,
    description: 'Zinc scrap',
    category: 'METAL',
    source: 'EPA WARM v15',
  },
  mixed_metals: {
    factor: 2.45,
    description: 'Mixed metal scrap',
    category: 'METAL',
    source: 'EPA WARM v15',
  },

  // Plastics
  pet: {
    factor: 1.53,
    description: 'PET bottles (#1)',
    category: 'PLASTIC',
    source: 'EPA WARM v15',
  },
  hdpe: {
    factor: 1.42,
    description: 'HDPE containers (#2)',
    category: 'PLASTIC',
    source: 'EPA WARM v15',
  },
  ldpe: {
    factor: 1.18,
    description: 'LDPE film (#4)',
    category: 'PLASTIC',
    source: 'EPA WARM v15',
  },
  pp: {
    factor: 1.25,
    description: 'Polypropylene (#5)',
    category: 'PLASTIC',
    source: 'EPA WARM v15',
  },
  mixed_plastics: {
    factor: 1.02,
    description: 'Mixed plastics',
    category: 'PLASTIC',
    source: 'EPA WARM v15',
  },

  // Paper & Cardboard
  cardboard: {
    factor: 3.12,
    description: 'Corrugated cardboard',
    category: 'PAPER',
    source: 'EPA WARM v15',
  },
  newspaper: {
    factor: 2.78,
    description: 'Newspaper and magazines',
    category: 'PAPER',
    source: 'EPA WARM v15',
  },
  office_paper: {
    factor: 2.87,
    description: 'Office paper',
    category: 'PAPER',
    source: 'EPA WARM v15',
  },
  mixed_paper: {
    factor: 2.45,
    description: 'Mixed paper',
    category: 'PAPER',
    source: 'EPA WARM v15',
  },

  // Glass
  glass: {
    factor: 0.31,
    description: 'Container glass',
    category: 'GLASS',
    source: 'EPA WARM v15',
  },

  // Electronics
  ewaste: {
    factor: 2.21,
    description: 'Electronic waste',
    category: 'ELECTRONICS',
    source: 'EPA WARM v15',
  },
  batteries: {
    factor: 1.87,
    description: 'Mixed batteries',
    category: 'ELECTRONICS',
    source: 'EPA WARM v15',
  },

  // Organics & Biochar
  biochar: {
    factor: 2.93,
    description: 'Biochar from organic waste',
    category: 'ORGANIC',
    source: 'IPCC 2019',
  },
  compost: {
    factor: 0.42,
    description: 'Composted organics',
    category: 'ORGANIC',
    source: 'EPA WARM v15',
  },
  food_waste: {
    factor: 0.58,
    description: 'Food waste diverted',
    category: 'ORGANIC',
    source: 'EPA WARM v15',
  },
  yard_waste: {
    factor: 0.39,
    description: 'Yard trimmings',
    category: 'ORGANIC',
    source: 'EPA WARM v15',
  },

  // Construction & Demolition
  concrete: {
    factor: 0.024,
    description: 'Recycled concrete',
    category: 'CONSTRUCTION',
    source: 'EPA WARM v15',
  },
  asphalt: {
    factor: 0.058,
    description: 'Reclaimed asphalt pavement',
    category: 'CONSTRUCTION',
    source: 'EPA WARM v15',
  },
  wood: {
    factor: 1.96,
    description: 'Dimensional lumber',
    category: 'CONSTRUCTION',
    source: 'EPA WARM v15',
  },
  drywall: {
    factor: 0.18,
    description: 'Gypsum drywall',
    category: 'CONSTRUCTION',
    source: 'EPA WARM v15',
  },

  // Textiles
  textiles: {
    factor: 3.45,
    description: 'Mixed textiles',
    category: 'TEXTILE',
    source: 'EPA WARM v15',
  },
  cotton: {
    factor: 4.12,
    description: 'Cotton textiles',
    category: 'TEXTILE',
    source: 'EPA WARM v15',
  },

  // Tires
  tires: {
    factor: 1.24,
    description: 'Scrap tires',
    category: 'RUBBER',
    source: 'EPA WARM v15',
  },
};

// Carbon credit market rate (USD per tonne CO2e)
export const CARBON_CREDIT_RATE = 85.0;

// Universal Law split ratios
export const UNIVERSAL_LAW = {
  founderYield: 0.70,    // 70% to founder/recycler
  platformFee: 0.20,     // 20% to platform
  publicOverflow: 0.10,  // 10% to public good
};

export interface ImpactResult {
  materialType: string;
  weightKg: number;
  carbonSavedKg: number;
  carbonSavedTonnes: number;
  valueUsd: number;
  founderYieldUsd: number;
  platformFeeUsd: number;
  publicOverflowUsd: number;
  emissionFactor: number;
  category: string;
  source: string;
  description: string;
  geniusActCompliant: boolean;
  calculatedAt: string;
}

export interface AggregateImpact {
  totalWeightKg: number;
  totalCarbonSavedKg: number;
  totalCarbonSavedTonnes: number;
  totalValueUsd: number;
  totalFounderYieldUsd: number;
  totalPlatformFeeUsd: number;
  totalPublicOverflowUsd: number;
  itemCount: number;
  breakdown: ImpactResult[];
  calculatedAt: string;
}

/**
 * ExtendedImpactEngine Class
 * 
 * Extended calculation engine for recycling materials with EPA WARM factors.
 * Implements the Universal Law (70/20/10) distribution model.
 */
export class ExtendedImpactEngine {
  private emissionFactors: typeof EMISSION_FACTORS;
  private carbonRate: number;

  constructor(customFactors?: typeof EMISSION_FACTORS, customRate?: number) {
    this.emissionFactors = customFactors ? { ...EMISSION_FACTORS, ...customFactors } : EMISSION_FACTORS;
    this.carbonRate = customRate ?? CARBON_CREDIT_RATE;
  }

  /**
   * Calculate carbon impact for a single material
   */
  calculate(materialType: string, weightKg: number): ImpactResult {
    const normalizedType = materialType.toLowerCase().replace(/[\s-]/g, '_');
    const factor = this.emissionFactors[normalizedType];

    if (!factor) {
      throw new Error(`Unknown material type: ${materialType}. Available types: ${Object.keys(this.emissionFactors).join(', ')}`);
    }

    if (weightKg <= 0) {
      throw new Error('Weight must be a positive number');
    }

    const carbonSavedKg = weightKg * factor.factor;
    const carbonSavedTonnes = carbonSavedKg / 1000;
    const valueUsd = carbonSavedTonnes * this.carbonRate;

    return {
      materialType: normalizedType,
      weightKg,
      carbonSavedKg,
      carbonSavedTonnes,
      valueUsd,
      founderYieldUsd: valueUsd * UNIVERSAL_LAW.founderYield,
      platformFeeUsd: valueUsd * UNIVERSAL_LAW.platformFee,
      publicOverflowUsd: valueUsd * UNIVERSAL_LAW.publicOverflow,
      emissionFactor: factor.factor,
      category: factor.category,
      source: factor.source,
      description: factor.description,
      geniusActCompliant: true,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate aggregate impact for multiple materials
   */
  calculateBatch(items: Array<{ materialType: string; weightKg: number }>): AggregateImpact {
    const breakdown = items.map(item => this.calculate(item.materialType, item.weightKg));

    return {
      totalWeightKg: breakdown.reduce((sum, r) => sum + r.weightKg, 0),
      totalCarbonSavedKg: breakdown.reduce((sum, r) => sum + r.carbonSavedKg, 0),
      totalCarbonSavedTonnes: breakdown.reduce((sum, r) => sum + r.carbonSavedTonnes, 0),
      totalValueUsd: breakdown.reduce((sum, r) => sum + r.valueUsd, 0),
      totalFounderYieldUsd: breakdown.reduce((sum, r) => sum + r.founderYieldUsd, 0),
      totalPlatformFeeUsd: breakdown.reduce((sum, r) => sum + r.platformFeeUsd, 0),
      totalPublicOverflowUsd: breakdown.reduce((sum, r) => sum + r.publicOverflowUsd, 0),
      itemCount: breakdown.length,
      breakdown,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get available material types
   */
  getMaterialTypes(): string[] {
    return Object.keys(this.emissionFactors);
  }

  /**
   * Get materials by category
   */
  getMaterialsByCategory(category: string): string[] {
    return Object.entries(this.emissionFactors)
      .filter(([, data]) => data.category === category.toUpperCase())
      .map(([key]) => key);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return [...new Set(Object.values(this.emissionFactors).map(f => f.category))];
  }

  /**
   * Get emission factor details for a material
   */
  getFactorDetails(materialType: string) {
    const normalizedType = materialType.toLowerCase().replace(/[\s-]/g, '_');
    return this.emissionFactors[normalizedType] ?? null;
  }

  /**
   * Convert to MintProofButton format
   */
  toMintProofData(result: ImpactResult, userId: string) {
    return {
      userId,
      auditType: 'CARBON_CREDIT' as const,
      carbonAmount: result.carbonSavedTonnes,
      valueUsd: result.valueUsd,
      metadata: {
        materialType: result.materialType,
        weightKg: result.weightKg,
        emissionFactor: result.emissionFactor,
        category: result.category,
        source: result.source,
        universalLaw: UNIVERSAL_LAW,
        geniusActCompliant: result.geniusActCompliant,
      },
    };
  }
}

// Export singleton instance for extended materials (EPA WARM)
export const extendedImpactEngine = new ExtendedImpactEngine();

// Helper function for quick calculations using extended engine
export function calculateImpact(materialType: string, weightKg: number): ImpactResult {
  return extendedImpactEngine.calculate(materialType, weightKg);
}

// ============================================
// Legacy Carbon Score Functions (for API compatibility)
// ============================================

interface CarbonScoreInput {
  userId: string;
  role: string;
  inputData: Record<string, any>;
}

interface CarbonScoreResult {
  success: boolean;
  carbonScore?: number;
  carbonValueUsd?: number;
  founderYield70?: number;
  stewardship20?: number;
  publicOverflow10?: number;
  calculationDetails?: Record<string, any>;
  error?: string;
}

/**
 * Calculate carbon score based on user role and input data
 */
export async function calculateCarbonScore(input: CarbonScoreInput): Promise<CarbonScoreResult> {
  const { userId, role, inputData } = input;

  try {
    let carbonScore = 0;
    let calculationDetails: Record<string, any> = {};

    switch (role) {
      case 'FARMER':
        const landAcres = inputData.landAcres || 0;
        const cropType = inputData.cropType || 'mixed';
        const soilCarbonRate = 0.5; // tonnes CO2e per acre per year
        carbonScore = landAcres * soilCarbonRate;
        calculationDetails = {
          method: 'SOIL_CARBON_SEQUESTRATION',
          landAcres,
          cropType,
          rate: soilCarbonRate,
        };
        break;

      case 'REALTOR':
        const propertyCount = inputData.propertyCount || 0;
        const avgEfficiency = inputData.avgEfficiencyRating || 5;
        const efficiencyBonus = (avgEfficiency / 10) * 0.5;
        carbonScore = propertyCount * efficiencyBonus;
        calculationDetails = {
          method: 'PROPERTY_EFFICIENCY',
          propertyCount,
          avgEfficiency,
          efficiencyBonus,
        };
        break;

      case 'BUSINESS_OWNER':
        const scope1 = inputData.scope1Emissions || 0;
        const scope2 = inputData.scope2Emissions || 0;
        const scope3 = inputData.scope3Emissions || 0;
        const reductionPercent = inputData.reductionPercent || 0;
        const totalEmissions = scope1 + scope2 + scope3;
        carbonScore = totalEmissions * (reductionPercent / 100);
        calculationDetails = {
          method: 'EMISSION_REDUCTION',
          scope1,
          scope2,
          scope3,
          totalEmissions,
          reductionPercent,
        };
        break;

      case 'SOVEREIGN_INDIVIDUAL':
      default:
        const actionsCount = inputData.actionsCount || 0;
        const avgImpact = 0.1; // tonnes CO2e per action
        carbonScore = actionsCount * avgImpact;
        calculationDetails = {
          method: 'INDIVIDUAL_ACTIONS',
          actionsCount,
          avgImpact,
        };
        break;
    }

    const carbonValueUsd = carbonScore * CARBON_CREDIT_RATE;
    const founderYield70 = carbonValueUsd * UNIVERSAL_LAW.founderYield;
    const stewardship20 = carbonValueUsd * UNIVERSAL_LAW.platformFee;
    const publicOverflow10 = carbonValueUsd * UNIVERSAL_LAW.publicOverflow;

    // Update user's carbon balance in database
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        carbonBalance: { increment: carbonScore },
      },
      create: {
        userId,
        role: role as any,
        carbonBalance: carbonScore,
      },
    });

    return {
      success: true,
      carbonScore,
      carbonValueUsd,
      founderYield70,
      stewardship20,
      publicOverflow10,
      calculationDetails,
    };
  } catch (error: any) {
    console.error('Carbon score calculation error:', error);
    return {
      success: false,
      error: error.message || 'Calculation failed',
    };
  }
}

/**
 * Get user's current carbon balance from database
 */
export async function getCarbonBalance(userId: string): Promise<number> {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { carbonBalance: true },
    });
    return profile?.carbonBalance || 0;
  } catch (error) {
    console.error('Error fetching carbon balance:', error);
    return 0;
  }
}
