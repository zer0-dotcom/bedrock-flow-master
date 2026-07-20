// ==================== CONSENT & COMPLIANCE TYPES ====================

export interface UserConsentData {
  id: string;
  userId: string;
  createdAt: string;
  email: string | null;
  walletAddress: string | null;
  termsAccepted: boolean;
  carbonRightsTransfer: boolean;
  aiMonitoring: boolean;
  termsAcceptedAt: string | null;
  carbonRightsAt: string | null;
  aiMonitoringAt: string | null;
  consentHash: string;
  termsVersion: string;
}

export interface ConsentLogData {
  id: string;
  createdAt: string;
  userId: string;
  action: 'accept' | 'revoke' | 'update';
  consentType: 'terms' | 'carbon_rights' | 'ai_monitoring';
  previousValue: boolean;
  newValue: boolean;
  logHash: string;
  ipAddress: string | null;
}

export interface ConsentCheckResult {
  hasConsent: boolean;
  termsAccepted: boolean;
  carbonRightsTransfer: boolean;
  aiMonitoring: boolean;
  consentHash: string | null;
  message: string;
}

export interface ConsentMetadataForToken {
  consent_hash: string;
  carbon_rights_transfer: boolean;
  ai_monitoring: boolean;
  terms_version: string;
  consent_timestamp: string;
}

// ==================== ASPHALT ENGINE TYPES ====================

export interface CalculatorInput {
  plannedTonnage: number;
  targetRapPercentage: number;
  tripDistance: number;
  mixType: 'HMA' | 'WMA';
  layerType: 'surface' | 'base';
  carbonCap?: number;
}

export interface CalculatorResult {
  project_id: string;
  tons_co2_saved: number;
  predicted_co2_emissions: number;
  optimal_rap_percentage: number;
  carbon_score: number;
  mix_recommendation: string;
  gps_coordinates: string;
  timestamp: string;
  meets_green_target: boolean;
  carbon_cap_compliance: boolean;
}

export interface ProjectData {
  id: string;
  projectId: string;
  createdAt: string;
  plannedTonnage: number;
  targetRapPercentage: number;
  tripDistance: number;
  mixType: string;
  layerType: string;
  carbonCap: number;
  predictedCo2Emissions: number;
  optimalRapPercentage: number;
  carbonScore: number;
  tonsCo2Saved: number;
  mixRecommendation: string;
  meetsGreenTarget: boolean;
  carbonCapCompliance: boolean;
  gpsCoordinates: string | null;
  blockchainTimestamp: string;
  blockchainJson: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalCarbonSaved: number;
  averageCarbonScore: number;
  projectsMeetingGreenTarget: number;
  greenTargetPercentage: number;
}

export interface MonthlyData {
  month: string;
  carbonSaved: number;
  avgCarbonScore: number;
  projectCount: number;
  avgRapUsage: number;
}

// ==================== BIOCHAR ENGINE TYPES ====================

export type FeedstockType = 'agricultural_waste' | 'wood_chips' | 'used_soil' | 'crop_residues';
export type StabilityClass = 'high' | 'medium' | 'low';
export type CreditStatus = 'pending' | 'issued' | 'redeemed';

export interface BiocharCalculatorInput {
  feedstockType: FeedstockType;
  dryWeightKg: number;
  moistureContentPercent?: number;
  pyrolysisTempCelsius: number;
  hCorgRatio: number;
  farmerId?: string;
  agentId?: string;  // Referrer/agent ID for commission split
  gpsCoordinates?: string;
}

export interface HederaGuardianMetadata {
  permanence: {
    stabilityClass: StabilityClass;
    permanenceYears: number;
    permanenceFactor: number;
    hCorgRatio: number;
  };
  traceability: {
    feedstockType: FeedstockType;
    feedstockSourceGps: string;
    farmerId: string | null;
    agentId: string | null;
    processingFacilityId: string | null;
    pyrolysisTemperature: number;
  };
  certification: {
    processCompliant: boolean;
    warnings: string[];
    timestamp: string;
  };
  // Consent section - added when batch is saved with verified user consent
  consent?: {
    consentHash: string;
    carbonRightsTransfer: boolean;
    aiMonitoring: boolean;
    termsVersion: string;
    consentTimestamp: string;
  };
}

// Certificate metadata for blockchain attestation
export interface CertificateMetadata {
  batch_id: string;
  stability_class: string;
  permanence_years: string;
  verification_hash: string;
  farmer_id: string | null;
}

// Commission breakdown when agent/referrer exists
export interface CommissionBreakdown {
  has_agent: boolean;
  total_credits: number;
  farmer_share: number;       // 60% of total
  farmer_credits: number;
  agent_id: string | null;
  agent_share: number;        // 10% of total (0 if no agent)
  agent_credits: number;
  platform_share: number;     // 30% of total
  platform_credits: number;
}

export interface BiocharCalculatorResult {
  batch_id: string;
  feedstock_type: FeedstockType;
  feedstock_source_gps: string;
  dry_weight_kg: number;
  effective_dry_weight_kg: number;
  pyrolysis_temperature_celsius: number;
  h_corg_ratio: number;
  stability_class: StabilityClass;
  permanence_years: number;
  permanence_factor: number;
  biochar_yield_kg: number;
  cdr_credits_tonnes: number;
  co2_equivalent_tonnes: number;
  farmer_id: string | null;
  farmer_credit_amount: number;
  agent_id: string | null;
  agent_commission_amount: number;
  platformAmount: number;
  commission_breakdown: CommissionBreakdown;
  timestamp: string;
  hedera_guardian_metadata: HederaGuardianMetadata;
  process_compliant: boolean;
  warnings: string[];
  certificate_metadata: CertificateMetadata;
}

export interface BiocharBatchData {
  id: string;
  batchId: string;
  createdAt: string;
  feedstockType: string;
  dryWeightKg: number;
  moistureContentPercent: number;
  pyrolysisTempCelsius: number;
  hCorgRatio: number;
  effectiveDryWeightKg: number;
  biocharYieldKg: number;
  cdrCreditsTonnes: number;
  co2EquivalentTonnes: number;
  stabilityClass: string;
  permanenceYears: number;
  permanenceFactor: number;
  processCompliant: boolean;
  warnings: string | null;
  feedstockSourceGps: string | null;
  farmerId: string | null;
  farmerCreditAmount: number | null;
  agentId: string | null;
  agentCommissionAmount: number | null;
  scrapnetAmount: number | null;
  hederaGuardianJson: string;
  certificateJson: string | null;
  certificateMetadata: CertificateMetadata | null;
}

export interface FarmerData {
  id: string;
  farmerId: string;
  createdAt: string;
  name: string;
  email: string | null;
  phone: string | null;
  farmName: string | null;
  farmLocation: string | null;
  gpsCoordinates: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  referrerId: string | null;
  totalFeedstockKg: number;
  totalCreditsEarned: number;
  totalAgentCommission: number;
}

export interface FarmerCreditData {
  id: string;
  creditId: string;
  createdAt: string;
  creditAmount: number;
  creditType: string;
  status: CreditStatus;
  batchId: string | null;
  farmerId: string;
  issuedAt: string | null;
  redeemedAt: string | null;
  tokenId: string | null;
  transactionHash: string | null;
  farmer?: FarmerData;
}

export interface BiocharDashboardStats {
  totalBatches: number;
  totalCdrCredits: number;
  totalBiocharYield: number;
  totalFeedstockProcessed: number;
  averageStabilityScore: number;
  highStabilityPercentage: number;
  totalFarmers: number;
  totalFarmerCredits: number;
}

// Carbon content by feedstock type
export const FEEDSTOCK_CARBON_CONTENT: Record<FeedstockType, number> = {
  agricultural_waste: 0.42,
  wood_chips: 0.48,
  used_soil: 0.35,
  crop_residues: 0.45,
};

// Biochar yield factor by temperature range (Source of Truth)
// Higher temps = lower yield but higher carbon stability
export function getBiocharYieldFactor(temp: number): number {
  if (temp < 400) return 0.50;      // Below optimal - higher yield but lower quality
  if (temp <= 450) return 0.45;     // 400-450°C
  if (temp <= 500) return 0.40;     // 451-500°C
  if (temp <= 550) return 0.35;     // 501-550°C
  if (temp <= 600) return 0.32;     // 551-600°C
  if (temp <= 650) return 0.30;     // 601-650°C
  if (temp <= 700) return 0.28;     // 651-700°C
  return 0.25;                       // Above optimal - very low yield
}

// Check if temperature is within compliant range
export function isTemperatureCompliant(temp: number): boolean {
  return temp >= 400 && temp <= 700;
}

// Permanence factor by H:Corg ratio
export function getPermanenceFactor(hCorgRatio: number): { factor: number; years: number; class: StabilityClass } {
  if (hCorgRatio <= 0.4) return { factor: 1.0, years: 100, class: 'high' };
  if (hCorgRatio <= 0.5) return { factor: 0.9, years: 90, class: 'high' };
  if (hCorgRatio <= 0.6) return { factor: 0.8, years: 70, class: 'medium' };
  if (hCorgRatio <= 0.7) return { factor: 0.6, years: 50, class: 'medium' };
  return { factor: 0.4, years: 30, class: 'low' };
}

/**
 * Calculate CDR Credits - SOURCE OF TRUTH
 * 
 * Formulas:
 * 1. Effective Dry Weight = dry_weight_kg × (1 - moisture_content_percent/100)
 * 2. Carbon Fraction: 0.42 (ag waste), 0.48 (wood), 0.35 (soil), 0.45 (crop residues)
 * 3. Biochar Yield = effective_dry_weight × yield_factor (temp-based)
 * 4. Biochar Carbon = effective_dry_weight × carbon_fraction × yield_factor
 * 5. Permanence: H:Corg ≤ 0.4 → factor = 1.0, years = 100+
 * 6. CDR Credits = (biochar_carbon_kg × permanence_factor × 3.67) / 1000
 */
export function calculateCdrCredits(input: BiocharCalculatorInput): BiocharCalculatorResult {
  // Step 1: Calculate Effective Dry Weight
  const moistureContent = input.moistureContentPercent ?? 15;
  const effectiveDryWeight = input.dryWeightKg * (1 - moistureContent / 100);
  
  // Step 2: Get Carbon Fraction from feedstock type
  const carbonFraction = FEEDSTOCK_CARBON_CONTENT[input.feedstockType];
  
  // Step 3: Get temperature-based yield factor
  const yieldFactor = getBiocharYieldFactor(input.pyrolysisTempCelsius);
  
  // Step 4: Calculate biochar mass yield
  const biocharYieldKg = effectiveDryWeight * yieldFactor;
  
  // Step 5: Calculate carbon content in biochar
  // Note: Carbon fraction applied to yield represents carbon retention during pyrolysis
  const biocharCarbonKg = effectiveDryWeight * carbonFraction * yieldFactor;
  
  // Step 6: Get permanence factor based on H:Corg ratio
  const permanence = getPermanenceFactor(input.hCorgRatio);
  
  // Step 7: Calculate CDR credits (tonnes CO2 equivalent)
  // Formula: (biochar_carbon_kg × permanence_factor × 3.67) / 1000
  // 3.67 is the CO2/C molecular weight ratio (44/12)
  const cdrCreditsTonnes = (biocharCarbonKg * permanence.factor * 3.67) / 1000;
  
  // CO2 equivalent without permanence discount
  const co2EquivalentTonnes = (biocharCarbonKg * 3.67) / 1000;
  
  // ==================== COMMISSION BREAKDOWN ====================
  // If farmer has an agent (referrer), split credits:
  //   - 60% to Farmer
  //   - 10% to Agent
  //   - 30% to Bedrock ESG
  // If no agent:
  //   - 60% to Farmer
  //   - 40% to Bedrock ESG (0% to agent)
  
  const hasAgent = !!input.agentId;
  const farmerShare = 0.60;
  const agentShare = hasAgent ? 0.10 : 0;
  const platformShare = hasAgent ? 0.30 : 0.40;
  
  const farmerCreditAmount = cdrCreditsTonnes * farmerShare;
  const agentCommissionAmount = cdrCreditsTonnes * agentShare;
  const platformAmount = cdrCreditsTonnes * platformShare;
  
  const commissionBreakdown: CommissionBreakdown = {
    has_agent: hasAgent,
    total_credits: cdrCreditsTonnes,
    farmer_share: farmerShare,
    farmer_credits: farmerCreditAmount,
    agent_id: input.agentId || null,
    agent_share: agentShare,
    agent_credits: agentCommissionAmount,
    platform_share: platformShare,
    platform_credits: platformAmount,
  };
  // ==============================================================
  
  // Process compliance and warnings
  const warnings: string[] = [];
  const tempCompliant = isTemperatureCompliant(input.pyrolysisTempCelsius);
  let processCompliant = tempCompliant;
  
  if (!tempCompliant) {
    warnings.push(`Pyrolysis temperature ${input.pyrolysisTempCelsius}°C is outside compliant range (400-700°C). Credits cannot be issued.`);
  }
  
  if (input.hCorgRatio > 0.7) {
    warnings.push('H:Corg ratio > 0.7 indicates low stability biochar (< 40 years permanence)');
  }
  
  const now = new Date();
  const timestamp = now.toISOString();
  const year = now.getFullYear();
  
  // Generate batch ID in format SN-YYYY-XXXX
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const batchId = `SN-${year}-${randomSuffix}`;
  
  // Format permanence years as descriptive string
  const formatPermanenceYears = (years: number): string => {
    if (years >= 100) return '100+';
    if (years >= 90) return '90-100';
    if (years >= 70) return '70-90';
    if (years >= 50) return '50-70';
    if (years >= 30) return '30-50';
    return '<30';
  };
  
  // Generate verification hash (SHA-256 placeholder for blockchain attestation)
  // In production, this would be computed from the actual data
  const verificationData = `${batchId}|${input.feedstockType}|${effectiveDryWeight}|${cdrCreditsTonnes}|${permanence.class}|${timestamp}`;
  const verificationHash = Array.from(
    new Uint8Array(32)
  ).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  
  // Certificate metadata for blockchain attestation
  const certificateMetadata: CertificateMetadata = {
    batch_id: batchId,
    stability_class: permanence.class.charAt(0).toUpperCase() + permanence.class.slice(1), // Capitalize
    permanence_years: formatPermanenceYears(permanence.years),
    verification_hash: `0x${verificationHash}`,
    farmer_id: input.farmerId || null,
  };
  
  return {
    batch_id: batchId,
    feedstock_type: input.feedstockType,
    feedstock_source_gps: input.gpsCoordinates || 'unverified',
    dry_weight_kg: input.dryWeightKg,
    effective_dry_weight_kg: effectiveDryWeight,
    pyrolysis_temperature_celsius: input.pyrolysisTempCelsius,
    h_corg_ratio: input.hCorgRatio,
    stability_class: permanence.class,
    permanence_years: permanence.years,
    permanence_factor: permanence.factor,
    biochar_yield_kg: biocharYieldKg,
    cdr_credits_tonnes: cdrCreditsTonnes,
    co2_equivalent_tonnes: co2EquivalentTonnes,
    farmer_id: input.farmerId || null,
    farmer_credit_amount: farmerCreditAmount,
    agent_id: input.agentId || null,
    agent_commission_amount: agentCommissionAmount,
    platformAmount: platformAmount,
    commission_breakdown: commissionBreakdown,
    timestamp,
    hedera_guardian_metadata: {
      permanence: {
        stabilityClass: permanence.class,
        permanenceYears: permanence.years,
        permanenceFactor: permanence.factor,
        hCorgRatio: input.hCorgRatio,
      },
      traceability: {
        feedstockType: input.feedstockType,
        feedstockSourceGps: input.gpsCoordinates || 'unverified',
        farmerId: input.farmerId || null,
        agentId: input.agentId || null,
        processingFacilityId: null,
        pyrolysisTemperature: input.pyrolysisTempCelsius,
      },
      certification: {
        processCompliant,
        warnings,
        timestamp,
      },
    },
    process_compliant: processCompliant,
    warnings,
    certificate_metadata: certificateMetadata,
  };
}

// ==================== BLOCKCHAIN ATTESTATION TYPES ====================

export interface BlockchainAttestationData {
  // Hedera HCS
  hederaTopicId: string | null;
  hederaTransactionId: string | null;
  hederaConsensusTimestamp: string | null;
  hederaMessageHash: string | null;
  
  // Polygon ERC-1155
  polygonTokenId: string | null;
  polygonTransactionHash: string | null;
  polygonContractAddress: string | null;
  polygonMintTimestamp: string | null;
  polygonTokenUri: string | null;
  
  // Cross-chain metadata
  crossChainMetadataJson: string | null;
}

export interface DualBlockchainAttestationStatus {
  hasHederaAttestation: boolean;
  hasPolygonAttestation: boolean;
  isFullyAttested: boolean;
  hederaExplorerUrl: string | null;
  polygonExplorerUrl: string | null;
}

export interface VerificationResult {
  success: boolean;
  itemId: string;
  itemType: 'biochar' | 'recycling';
  verificationStatus: 'VERIFIED' | 'REJECTED';
  agentId: string;
  attestation?: {
    hedera: {
      topicId: string;
      transactionId: string;
      consensusTimestamp: string;
      messageHash: string;
    };
    polygon: {
      tokenId: string;
      transactionHash: string;
      contractAddress: string;
      tokenUri: string;
      fractionalUnits: string;
    };
    crossChain: {
      attestationId: string;
      totalCdrTonnes: number;
      fractionalPrecision: number;
    };
  };
  error?: string;
}

// ==================== UNIFIED LOCATION TYPES ====================

export type LocationType = 'RECYCLING_CENTER' | 'BIOCHAR_FACILITY' | 'HYBRID';

export interface LocationData {
  id: string;
  locationId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  type: LocationType;
  address: string | null;
  gpsCoordinates: string | null;
  isActive: boolean;
  capacity: number | null;
  certifications: string[];
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  usersCount: number;
  recyclingLogsCount: number;
  biocharBatchesCount: number;
}

export interface LocationCreateInput {
  name: string;
  type?: LocationType;
  address?: string;
  gpsCoordinates?: string;
  capacity?: number;
  certifications?: string[];
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface LocationUpdateInput {
  name?: string;
  type?: LocationType;
  address?: string;
  gpsCoordinates?: string;
  isActive?: boolean;
  capacity?: number;
  certifications?: string[];
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface LocationStats {
  total: number;
  byType: {
    RECYCLING_CENTER: number;
    BIOCHAR_FACILITY: number;
    HYBRID: number;
  };
  active: number;
  inactive: number;
}
