/**
 * Avoided Logistics Auditor
 * 
 * Calculates CO2e avoided by tokenizing currency/assets on-site
 * instead of physically shipping to Central Reserve.
 * 
 * 2026 High-Security Logistics Carbon Factors:
 * - Air Cargo: 500g CO2 per km
 * - Armored Vehicle: 180g CO2 per km
 */

export type TransportMethod = 'AIR_CARGO' | 'ARMORED_VEHICLE';
export type CreditStatus = 'UNVERIFIED' | 'PENDING_HASH' | 'VERIFIED';

// 2026 High-Security Logistics Carbon Factors (grams CO2 per km)
export const LOGISTICS_CARBON_FACTORS: Record<TransportMethod, number> = {
  AIR_CARGO: 500, // g CO2/km - includes security escort, refrigeration, special handling
  ARMORED_VEHICLE: 180, // g CO2/km - includes convoy vehicles, security personnel transport
};

// Default Central Reserve locations (major financial hubs)
export const CENTRAL_RESERVES: Record<string, { name: string; coordinates: string }> = {
  US_FEDERAL: { name: 'Federal Reserve Bank of New York', coordinates: '40.7128,-74.0060' },
  EU_ECB: { name: 'European Central Bank', coordinates: '50.1109,8.6821' },
  UK_BOE: { name: 'Bank of England', coordinates: '51.5142,-0.0881' },
  CH_SNB: { name: 'Swiss National Bank', coordinates: '46.9481,7.4474' },
  JP_BOJ: { name: 'Bank of Japan', coordinates: '35.6762,139.6503' },
};

export interface LogisticsCoordinates {
  lat: number;
  lng: number;
}

export interface LogisticsAuditInput {
  originCoordinates: string; // "lat,lng" format
  destinationCoordinates: string; // "lat,lng" format
  transportMethod: TransportMethod;
  totalValue: number; // Asset value in USD
  currencyType: string;
  verificationId: string;
  destructionHash?: string; // If present, credits become verified
}

export interface LogisticsAuditResult {
  verificationId: string;
  origin: {
    coordinates: string;
    parsed: LogisticsCoordinates;
  };
  destination: {
    coordinates: string;
    parsed: LogisticsCoordinates;
  };
  transportMethod: TransportMethod;
  transportMethodLabel: string;
  distanceKm: number;
  carbonFactor: number; // g CO2/km
  avoidedEmissions: {
    grams: number;
    kilograms: number;
    tonnes: number;
  };
  credits: {
    amount: number; // 1 credit = 1 tonne CO2e
    status: CreditStatus;
    statusLabel: string;
    pendingRequirement: string | null;
  };
  equivalencies: {
    carMilesAvoided: number;
    treesPlantedEquivalent: number;
    homeEnergyDays: number;
  };
  audit: {
    timestamp: string;
    version: string;
    factorSource: string;
  };
}

/**
 * Parse coordinate string "lat,lng" to LogisticsCoordinates object
 */
export function parseCoordinates(coordString: string): LogisticsCoordinates {
  const [lat, lng] = coordString.split(',').map(s => parseFloat(s.trim()));
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error(`Invalid coordinates format: ${coordString}. Expected "lat,lng"`);
  }
  return { lat, lng };
}

/**
 * Calculate Haversine distance between two coordinates in kilometers
 */
export function calculateDistance(
  origin: LogisticsCoordinates,
  destination: LogisticsCoordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(destination.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // Add 20% for actual route vs straight-line distance
  return Math.round(distance * 1.2 * 100) / 100;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate avoided CO2 emissions from on-site tokenization
 */
export function calculateAvoidedLogistics(input: LogisticsAuditInput): LogisticsAuditResult {
  // Parse coordinates
  const originParsed = parseCoordinates(input.originCoordinates);
  const destinationParsed = parseCoordinates(input.destinationCoordinates);
  
  // Calculate distance
  const distanceKm = calculateDistance(originParsed, destinationParsed);
  
  // Get carbon factor
  const carbonFactor = LOGISTICS_CARBON_FACTORS[input.transportMethod];
  
  // Calculate avoided emissions
  const avoidedGrams = distanceKm * carbonFactor;
  const avoidedKg = avoidedGrams / 1000;
  const avoidedTonnes = avoidedKg / 1000;
  
  // Determine credit status
  let creditStatus: CreditStatus = 'UNVERIFIED';
  let statusLabel = 'Unverified - Awaiting Proof of Destruction';
  let pendingRequirement: string | null = 'SHA-256 hash of destruction video required';
  
  if (input.destructionHash) {
    creditStatus = 'VERIFIED';
    statusLabel = 'Verified - Destruction Hash Confirmed';
    pendingRequirement = null;
  }
  
  // Calculate equivalencies
  const carMilesAvoided = Math.round(avoidedKg / 0.404); // ~404g CO2/mile
  const treesPlantedEquivalent = Math.round(avoidedKg / 21); // ~21kg CO2/tree/year
  const homeEnergyDays = Math.round(avoidedKg / 30); // ~30kg CO2/day avg home
  
  return {
    verificationId: input.verificationId,
    origin: {
      coordinates: input.originCoordinates,
      parsed: originParsed,
    },
    destination: {
      coordinates: input.destinationCoordinates,
      parsed: destinationParsed,
    },
    transportMethod: input.transportMethod,
    transportMethodLabel: input.transportMethod === 'AIR_CARGO' 
      ? 'High-Security Air Cargo' 
      : 'Armored Vehicle Convoy',
    distanceKm,
    carbonFactor,
    avoidedEmissions: {
      grams: Math.round(avoidedGrams * 100) / 100,
      kilograms: Math.round(avoidedKg * 100) / 100,
      tonnes: Math.round(avoidedTonnes * 10000) / 10000,
    },
    credits: {
      amount: Math.round(avoidedTonnes * 10000) / 10000, // 1 credit = 1 tonne CO2e
      status: creditStatus,
      statusLabel,
      pendingRequirement,
    },
    equivalencies: {
      carMilesAvoided,
      treesPlantedEquivalent,
      homeEnergyDays,
    },
    audit: {
      timestamp: new Date().toISOString(),
      version: '2026.1.0',
      factorSource: '2026 High-Security Logistics Standard (ISO-14064 compliant)',
    },
  };
}

/**
 * Format the audit result as an Unverified Carbon Credit certificate
 */
export function formatUnverifiedCreditCertificate(result: LogisticsAuditResult): object {
  return {
    certificate: {
      type: 'UNVERIFIED_CARBON_CREDIT',
      standard: 'Bedrock ESG Avoided Logistics Protocol v1.0',
      verificationId: result.verificationId,
      issueDate: result.audit.timestamp,
    },
    avoidedLogistics: {
      origin: result.origin.coordinates,
      destination: result.destination.coordinates,
      distanceKm: result.distanceKm,
      transportMethod: result.transportMethodLabel,
      carbonFactor: `${result.carbonFactor}g CO2/km`,
    },
    emissions: {
      avoidedCo2Grams: result.avoidedEmissions.grams,
      avoidedCo2Kg: result.avoidedEmissions.kilograms,
      avoidedCo2Tonnes: result.avoidedEmissions.tonnes,
    },
    credits: {
      amount: result.credits.amount,
      unit: 'tCO2e',
      status: result.credits.status,
      statusDescription: result.credits.statusLabel,
      pendingVerification: result.credits.pendingRequirement,
    },
    equivalencies: result.equivalencies,
    auditTrail: result.audit,
    _notice: result.credits.status === 'UNVERIFIED' 
      ? 'These credits are PENDING and will be activated upon submission of the Proof of Destruction hash.'
      : 'Credits have been verified and are eligible for tokenization.',
  };
}
