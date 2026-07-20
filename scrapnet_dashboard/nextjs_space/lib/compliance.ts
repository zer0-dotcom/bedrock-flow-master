/**
 * Global Compliance & Jurisdiction Engine
 * 
 * Handles regulatory framework detection, Travel Rule compliance,
 * VAT/Tax calculations, and jurisdiction-aware credit splits.
 */

export type Jurisdiction = 'US' | 'EU' | 'UK' | 'SG' | 'JP' | 'CH' | 'APAC' | 'LATAM' | 'MENA' | 'UNKNOWN';
export type ComplianceStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'PENDING_REVIEW' | 'EXEMPT';

// Regulatory frameworks
export interface RegulatoryFramework {
  id: string;
  name: string;
  jurisdiction: Jurisdiction;
  status: ComplianceStatus;
  statusReason?: string;
  lastAuditDate?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  regulatoryBody: string;
  travelRuleThreshold?: number;
  travelRuleCurrency?: string;
  requiresTreasuryBackup: boolean;
  requiresWhitepaperHash: boolean;
}

// 2026 Regulatory Frameworks
export const REGULATORY_FRAMEWORKS: Record<string, RegulatoryFramework> = {
  GENIUS_ACT: {
    id: 'GENIUS_ACT_2026',
    name: 'GENIUS Act',
    jurisdiction: 'US',
    status: 'COMPLIANT',
    statusReason: 'Full compliance verified Q1 2026',
    lastAuditDate: '2026-01-15',
    licenseNumber: 'FinCEN-DFA-2026-SC001',
    licenseExpiry: '2027-01-15',
    regulatoryBody: 'FinCEN / SEC',
    travelRuleThreshold: 3000, // $3,000 USD
    travelRuleCurrency: 'USD',
    requiresTreasuryBackup: true,
    requiresWhitepaperHash: false,
  },
  MICA: {
    id: 'MICA_EU_2026',
    name: 'MiCA',
    jurisdiction: 'EU',
    status: 'COMPLIANT',
    statusReason: 'CASP License Active',
    lastAuditDate: '2026-02-01',
    licenseNumber: 'EU-CASP-2026-0042',
    licenseExpiry: '2028-02-01',
    regulatoryBody: 'European Securities and Markets Authority (ESMA)',
    travelRuleThreshold: 1000, // €1,000 EUR
    travelRuleCurrency: 'EUR',
    requiresTreasuryBackup: false,
    requiresWhitepaperHash: true,
  },
  PROJECT_GUARDIAN: {
    id: 'PROJECT_GUARDIAN_SG_2026',
    name: 'Project Guardian',
    jurisdiction: 'SG',
    status: 'COMPLIANT',
    statusReason: 'MAS Sandbox Participant',
    lastAuditDate: '2026-01-20',
    licenseNumber: 'MAS-DPT-2026-SN018',
    licenseExpiry: '2027-06-30',
    regulatoryBody: 'Monetary Authority of Singapore (MAS)',
    travelRuleThreshold: 1500, // $1,500 SGD
    travelRuleCurrency: 'SGD',
    requiresTreasuryBackup: false,
    requiresWhitepaperHash: false,
  },
};

// FATF Travel Rule thresholds by jurisdiction
export const TRAVEL_RULE_THRESHOLDS: Record<Jurisdiction, { amount: number; currency: string }> = {
  US: { amount: 3000, currency: 'USD' },
  EU: { amount: 1000, currency: 'EUR' },
  UK: { amount: 1000, currency: 'GBP' },
  SG: { amount: 1500, currency: 'SGD' },
  JP: { amount: 100000, currency: 'JPY' },
  CH: { amount: 1000, currency: 'CHF' },
  APAC: { amount: 1000, currency: 'USD' },
  LATAM: { amount: 1000, currency: 'USD' },
  MENA: { amount: 1000, currency: 'USD' },
  UNKNOWN: { amount: 1000, currency: 'USD' },
};

// VAT rates by jurisdiction (2026)
export const VAT_RATES: Record<Jurisdiction, { standard: number; carbonCredit: number }> = {
  US: { standard: 0, carbonCredit: 0 }, // No federal VAT
  EU: { standard: 21, carbonCredit: 0 }, // Carbon credits exempt
  UK: { standard: 20, carbonCredit: 0 },
  SG: { standard: 9, carbonCredit: 0 },
  JP: { standard: 10, carbonCredit: 0 },
  CH: { standard: 8.1, carbonCredit: 0 },
  APAC: { standard: 10, carbonCredit: 0 },
  LATAM: { standard: 16, carbonCredit: 0 },
  MENA: { standard: 5, carbonCredit: 0 },
  UNKNOWN: { standard: 0, carbonCredit: 0 },
};

// Exchange rates to USD (simulated 2026 rates)
export const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  SGD: 0.75,
  JPY: 0.0067,
  CHF: 1.12,
};

/**
 * Detect jurisdiction from GPS coordinates
 */
export function detectJurisdictionFromGPS(lat: number, lng: number): Jurisdiction {
  // Simplified bounding box detection
  // US: lat 24-49, lng -125 to -66
  if (lat >= 24 && lat <= 49 && lng >= -125 && lng <= -66) return 'US';
  
  // EU approximate: lat 36-71, lng -10 to 40
  if (lat >= 36 && lat <= 71 && lng >= -10 && lng <= 40) {
    // UK: lat 50-60, lng -8 to 2
    if (lat >= 50 && lat <= 60 && lng >= -8 && lng <= 2) return 'UK';
    // Switzerland: lat 45.8-47.8, lng 5.9-10.5
    if (lat >= 45.8 && lat <= 47.8 && lng >= 5.9 && lng <= 10.5) return 'CH';
    return 'EU';
  }
  
  // Singapore: lat 1.15-1.47, lng 103.6-104.1
  if (lat >= 1.15 && lat <= 1.47 && lng >= 103.6 && lng <= 104.1) return 'SG';
  
  // Japan: lat 24-46, lng 122-154
  if (lat >= 24 && lat <= 46 && lng >= 122 && lng <= 154) return 'JP';
  
  // APAC: lat -50 to 60, lng 60 to 180
  if (lat >= -50 && lat <= 60 && lng >= 60 && lng <= 180) return 'APAC';
  
  // LATAM: lat -56 to 32, lng -118 to -34
  if (lat >= -56 && lat <= 32 && lng >= -118 && lng <= -34) return 'LATAM';
  
  // MENA: lat 12-42, lng -17 to 63
  if (lat >= 12 && lat <= 42 && lng >= -17 && lng <= 63) return 'MENA';
  
  return 'UNKNOWN';
}

/**
 * Check if Travel Rule is triggered for a transaction
 */
export function checkTravelRule(
  jurisdiction: Jurisdiction,
  amount: number,
  currency: string
): { triggered: boolean; threshold: number; thresholdCurrency: string } {
  const threshold = TRAVEL_RULE_THRESHOLDS[jurisdiction];
  
  // Convert amount to threshold currency if needed
  let convertedAmount = amount;
  if (currency !== threshold.currency) {
    const fromRate = EXCHANGE_RATES_TO_USD[currency] || 1;
    const toRate = EXCHANGE_RATES_TO_USD[threshold.currency] || 1;
    convertedAmount = (amount * fromRate) / toRate;
  }
  
  return {
    triggered: convertedAmount >= threshold.amount,
    threshold: threshold.amount,
    thresholdCurrency: threshold.currency,
  };
}

/**
 * Calculate VAT/Tax for a transaction
 */
export function calculateVAT(
  jurisdiction: Jurisdiction,
  amount: number,
  isCarbonCredit: boolean = true
): { applicable: boolean; rate: number; amount: number } {
  const rates = VAT_RATES[jurisdiction];
  const rate = isCarbonCredit ? rates.carbonCredit : rates.standard;
  
  return {
    applicable: rate > 0,
    rate,
    amount: (amount * rate) / 100,
  };
}

/**
 * Get jurisdiction-specific credit split requirements
 */
export interface JurisdictionSplitRules {
  bankShare: number;
  platformShare: number;
  sustainabilityShare: number;
  requiresTreasuryBackup: boolean;
  requiresWhitepaperHash: boolean;
  additionalRequirements: string[];
}

export function getJurisdictionSplitRules(jurisdiction: Jurisdiction): JurisdictionSplitRules {
  // Base 70/20/10 split
  const baseSplit: JurisdictionSplitRules = {
    bankShare: 70,
    platformShare: 20,
    sustainabilityShare: 10,
    requiresTreasuryBackup: false,
    requiresWhitepaperHash: false,
    additionalRequirements: [],
  };
  
  switch (jurisdiction) {
    case 'US':
      return {
        ...baseSplit,
        requiresTreasuryBackup: true,
        additionalRequirements: [
          '1:1 Treasury-backed reserve requirement',
          'FinCEN registration verification',
          'SAR/CTR filing if applicable',
        ],
      };
    
    case 'EU':
      return {
        ...baseSplit,
        requiresWhitepaperHash: true,
        additionalRequirements: [
          'MiCA white-paper attestation hash required',
          'CASP license verification',
          'GDPR-compliant data handling',
        ],
      };
    
    case 'SG':
      return {
        ...baseSplit,
        additionalRequirements: [
          'MAS DPT license verification',
          'Project Guardian compliance check',
        ],
      };
    
    case 'UK':
      return {
        ...baseSplit,
        requiresWhitepaperHash: true,
        additionalRequirements: [
          'FCA registration required',
          'UK-specific AML checks',
        ],
      };
    
    default:
      return baseSplit;
  }
}

/**
 * Generate compliance audit trail
 */
export function generateComplianceAuditTrail(
  transactionId: string,
  jurisdiction: Jurisdiction,
  travelRuleTriggered: boolean,
  vatApplied: boolean
): object {
  return {
    transactionId,
    timestamp: new Date().toISOString(),
    jurisdiction,
    frameworkChecks: [
      jurisdiction === 'US' ? 'GENIUS_ACT' : null,
      jurisdiction === 'EU' ? 'MICA' : null,
      jurisdiction === 'SG' ? 'PROJECT_GUARDIAN' : null,
    ].filter(Boolean),
    travelRule: {
      checked: true,
      triggered: travelRuleTriggered,
      threshold: TRAVEL_RULE_THRESHOLDS[jurisdiction],
    },
    taxCompliance: {
      vatApplied,
      rates: VAT_RATES[jurisdiction],
    },
    splitRules: getJurisdictionSplitRules(jurisdiction),
    auditVersion: '2026.1.0',
  };
}
