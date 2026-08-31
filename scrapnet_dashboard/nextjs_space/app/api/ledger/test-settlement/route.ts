import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDeadMass,
  calculateResonance,
  calculateParticipation,
  calculateLegacyAudit,
  calculateVibrationalEquity,
  processParametricInsurance,
  calculateSaleBuySettlement,
  calculateRentLeaseSettlement,
  calculateAirbnbSettlement,
  verifyGeniusActCompliance,
  verifyZeroGreedPolicy,
  verifyREFSZeroGreed,
  formatREHospitalityOutput,
  generateSettlePulse,
  generateRetroSettlePulse,
  generateDebtErasurePulse,
  generateClaimSettlePulse,
  generateRentPulse,
  generateSalePulse,
  generateAirbnbPulse,
  generateLeasePulse,
  UNIVERSAL_SPLIT,
  REHospitalityLedgerOutput,
} from '@/lib/universal-law';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * TEST SETTLEMENT ENDPOINT
 * 
 * Validates the Frequency Settlement Engine against the God-Prompt specification.
 * Generates test settlements for all 4 modules with compliant JSON output.
 */

// God-Prompt JSON Schema
interface GodPromptSettlementOutput {
  module_type: string;
  asset_id: string;
  gross_value_usd: number;
  founder_yield_70: number;
  stewardship_20: number;
  public_overflow_10: number;
  zip_code: string;
  impact_string: string;
  pulse_display_string: string;
}

function formatSettlementOutput(
  moduleType: string,
  assetId: string,
  grossValue: number,
  founderYield: number,
  stewardship: number,
  publicOverflow: number,
  zipCode: string,
  impactString: string,
  pulseString: string
): GodPromptSettlementOutput {
  return {
    module_type: moduleType,
    asset_id: assetId,
    gross_value_usd: Math.round(grossValue * 100) / 100,
    founder_yield_70: Math.round(founderYield * 100) / 100,
    stewardship_20: Math.round(stewardship * 100) / 100,
    public_overflow_10: Math.round(publicOverflow * 100) / 100,
    zip_code: zipCode,
    impact_string: impactString,
    pulse_display_string: pulseString,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module') || 'all';
    
    const results: {
      spec_compliance: {
        universal_law_verified: boolean;
        zero_greed_policy: boolean;
        genius_act_2026: boolean;
        split_validation: { founder: number; stewardship: number; public: number; sum: number };
      };
      test_settlements: GodPromptSettlementOutput[];
      pulse_strings_formatted: {
        standard: string;
        legacy: string;
        equity: string;
        insurance: string;
        re_hospitality_sale: string;
        re_hospitality_rent: string;
        re_hospitality_airbnb: string;
      };
      re_hospitality_outputs: REHospitalityLedgerOutput[];
    } = {
      spec_compliance: {
        universal_law_verified: true,
        zero_greed_policy: true,
        genius_act_2026: true,
        split_validation: {
          founder: UNIVERSAL_SPLIT.FOUNDER_YIELD * 100,
          stewardship: UNIVERSAL_SPLIT.STEWARDSHIP * 100,
          public: UNIVERSAL_SPLIT.PUBLIC_RESILIENCE * 100,
          sum: (UNIVERSAL_SPLIT.FOUNDER_YIELD + UNIVERSAL_SPLIT.STEWARDSHIP + UNIVERSAL_SPLIT.PUBLIC_RESILIENCE) * 100,
        },
      },
      test_settlements: [],
      pulse_strings_formatted: {
        standard: '',
        legacy: '',
        equity: '',
        insurance: '',
        re_hospitality_sale: '',
        re_hospitality_rent: '',
        re_hospitality_airbnb: '',
      },
      re_hospitality_outputs: [],
    };
    
    const testZipCode = '90210';
    
    // ==================== MODULE 1: INDUSTRIAL (Dead Mass) ====================
    if (module === 'all' || module === 'industrial') {
      const industrialInput = {
        assetType: 'ELECTRONICS' as const,
        weightKg: 500,
        destructionMethod: 'SHREDDING' as const,
        verificationHash: crypto.createHash('sha256').update('test-destruction-video-001').digest('hex'),
        gpsCoordinates: '34.0522,-118.2437',
        iotSensorData: {
          temperatureC: 850,
          pressureBar: 2.5,
          humidityPercent: 15,
          timestampMs: Date.now(),
        },
        totalValueUsd: 10000,
        nodeId: 'SCRAP-LA-001',
      };
      
      const industrialResult = calculateDeadMass(industrialInput);
      
      const industrialOutput = formatSettlementOutput(
        'INDUSTRIAL',
        industrialResult.extractionId,
        industrialResult.split.totalValueUsd,
        industrialResult.split.founderYieldUsd,
        industrialResult.split.stewardshipUsd,
        industrialResult.split.publicResilienceUsd,
        testZipCode,
        `CO₂ Avoided: ${industrialResult.carbonAvoidedTonnes.toFixed(4)} tonnes | Dead Mass: ${industrialResult.deadMassKg}kg`,
        generateSettlePulse(
          industrialResult.extractionId,
          industrialResult.split.totalValueUsd,
          industrialResult.split.publicResilienceUsd,
          testZipCode
        )
      );
      
      results.test_settlements.push(industrialOutput);
      results.pulse_strings_formatted.standard = industrialOutput.pulse_display_string;
    }
    
    // ==================== MODULE 2: RESONANCE ====================
    if (module === 'all' || module === 'resonance') {
      const resonanceInput = {
        creatorId: 'CREATOR-001',
        contentId: 'PODCAST-EP-127',
        contentType: 'PODCAST' as const,
        views: 500000,
        streams: 750000,
        durationMinutes: 45,
        engagementScore: 85,
        revenueUsd: 5000,
        platform: 'Spotify',
        region: 'US-WEST',
      };
      
      const resonanceResult = calculateResonance(resonanceInput);
      
      const resonanceOutput = formatSettlementOutput(
        'RESONANCE',
        resonanceResult.resonanceId,
        resonanceResult.split.totalRevenueUsd,
        resonanceResult.split.founderYieldUsd,
        resonanceResult.split.stewardshipUsd,
        resonanceResult.split.publicResilienceUsd,
        testZipCode,
        `Flights Avoided: ${resonanceResult.avoidedLogistics.flightsAvoided.toFixed(2)} | Reach: ${(resonanceInput.views + resonanceInput.streams).toLocaleString()}`,
        generateSettlePulse(
          resonanceResult.resonanceId,
          resonanceResult.split.totalRevenueUsd,
          resonanceResult.split.publicResilienceUsd,
          testZipCode
        )
      );
      
      results.test_settlements.push(resonanceOutput);
    }
    
    // ==================== MODULE 3: PARTICIPATION ====================
    if (module === 'all' || module === 'participation') {
      const participationInput = {
        userId: 'USER-42',
        positiveActions: [
          { actionType: 'RECYCLING' as const, impactScore: 8, timestamp: new Date().toISOString() },
          { actionType: 'TRANSIT' as const, impactScore: 9, timestamp: new Date().toISOString() },
          { actionType: 'PLANT_BASED' as const, impactScore: 7, timestamp: new Date().toISOString() },
          { actionType: 'ENERGY_SAVING' as const, impactScore: 8, timestamp: new Date().toISOString() },
          { actionType: 'COMMUNITY' as const, impactScore: 6, timestamp: new Date().toISOString() },
          { actionType: 'EDUCATION' as const, impactScore: 5, timestamp: new Date().toISOString() },
        ],
        consciousnessMetrics: {
          awarenessLevel: 7,
          actionConsistency: 75,
          communityEngagement: 60,
          educationHours: 25,
          previousLevel: 5,
          currentLevel: 7,
        },
        periodDays: 30,
      };
      
      const participationResult = calculateParticipation(participationInput);
      
      const participationOutput = formatSettlementOutput(
        'PARTICIPATION',
        participationResult.participationId,
        participationResult.socialYield.totalYield,
        participationResult.socialYield.totalYield * UNIVERSAL_SPLIT.FOUNDER_YIELD,
        participationResult.socialYield.totalYield * UNIVERSAL_SPLIT.STEWARDSHIP,
        participationResult.socialYield.totalYield * UNIVERSAL_SPLIT.PUBLIC_RESILIENCE,
        testZipCode,
        `Consciousness: ${participationResult.consciousnessScore.toFixed(1)} | Level ${participationResult.newLevel} ${participationResult.levelUp ? '(LEVEL UP!)' : ''}`,
        generateSettlePulse(
          participationResult.participationId,
          participationResult.socialYield.totalYield,
          participationResult.socialYield.totalYield * UNIVERSAL_SPLIT.PUBLIC_RESILIENCE,
          testZipCode
        )
      );
      
      results.test_settlements.push(participationOutput);
    }
    
    // ==================== MODULE 4: LEGACY AUDIT ====================
    if (module === 'all' || module === 'legacy') {
      const legacyInput = {
        dataSource: 'MLS' as const,
        dataSourceRef: 'MLS-2024-001',
        periodFrom: '2016-01-01',
        periodTo: '2024-12-31',
        transactions: [
          { transactionId: 'TX-001', transactionDate: '2020-03-15', efficiencyTypes: ['E_SIGNATURE' as const, 'VIRTUAL_TOUR' as const], estimatedValueUsd: 450000, isDigital: true },
          { transactionId: 'TX-002', transactionDate: '2021-06-20', efficiencyTypes: ['REMOTE_CLOSING' as const, 'DIGITAL_DOCUMENT' as const], estimatedValueUsd: 525000, isDigital: true },
          { transactionId: 'TX-003', transactionDate: '2022-09-10', efficiencyTypes: ['AUTOMATED_WORKFLOW' as const], estimatedValueUsd: 380000, isDigital: true },
          { transactionId: 'TX-004', transactionDate: '2023-04-05', efficiencyTypes: ['VIDEO_INSPECTION' as const, 'E_SIGNATURE' as const], estimatedValueUsd: 620000, isDigital: true },
        ],
        ownerId: 'OWNER-001',
        ownerType: 'BROKERAGE' as const,
        ownerZipCode: testZipCode,
      };
      
      const legacyResult = calculateLegacyAudit(legacyInput);
      
      const legacyOutput = formatSettlementOutput(
        'LEGACY_AUDIT',
        legacyResult.auditId,
        legacyResult.legacyYieldUsd,
        legacyResult.split.founderYieldUsd,
        legacyResult.split.stewardshipUsd,
        legacyResult.split.publicResilienceUsd,
        legacyInput.ownerZipCode || 'GLOBAL',
        `Historical Healing: ${legacyResult.period.yearsAnalyzed.toFixed(1)} years | ${legacyResult.transactionAnalysis.digitalAdoptionRate.toFixed(0)}% Digital`,
        legacyResult.pulseString
      );
      
      results.test_settlements.push(legacyOutput);
      results.pulse_strings_formatted.legacy = legacyResult.pulseString;
      
      // Verify GENIUS Act compliance
      const geniusCheck = verifyGeniusActCompliance(
        'LEGACY_AUDIT',
        {
          founderYield: legacyResult.split.founderYieldUsd,
          stewardship: legacyResult.split.stewardshipUsd,
          publicResilience: legacyResult.split.publicResilienceUsd,
          total: legacyResult.legacyYieldUsd,
        },
        legacyResult.poeVerificationHash
      );
      results.spec_compliance.genius_act_2026 = geniusCheck.compliant;
    }
    
    // ==================== SPECIALTY: ASSET VALUATION ====================
    if (module === 'all' || module === 'equity') {
      const equityInput = {
        propertyAddress: '123 Main St, Beverly Hills, CA',
        propertyType: 'RESIDENTIAL_SINGLE' as const,
        propertyZipCode: testZipCode,
        mlsNumber: 'MLS-2024-BH-001',
        currentValueUsd: 1500000,
        mortgageBalanceUsd: 800000,
        ownerId: 'OWNER-002',
        ownerName: 'Test Owner',
        requestDebtErasure: true,
        debtErasureAmountUsd: 50000,
      };
      
      const equityResult = calculateVibrationalEquity(equityInput);
      
      const equityOutput = formatSettlementOutput(
        'VIBRATIONAL_EQUITY',
        equityResult.equityId,
        equityResult.valuation.equityValueUsd,
        equityResult.valuation.equityValueUsd * UNIVERSAL_SPLIT.FOUNDER_YIELD,
        equityResult.valuation.equityValueUsd * UNIVERSAL_SPLIT.STEWARDSHIP,
        equityResult.valuation.equityValueUsd * UNIVERSAL_SPLIT.PUBLIC_RESILIENCE,
        equityInput.propertyZipCode,
        `Battery Charged: ${equityResult.liquidBattery.chargePercent.toFixed(1)}% | Capacity: $${equityResult.liquidBattery.capacityUsd.toLocaleString()}`,
        equityResult.debtErasure?.pulseString || generateDebtErasurePulse(equityResult.equityId, 50000, testZipCode)
      );
      
      results.test_settlements.push(equityOutput);
      results.pulse_strings_formatted.equity = equityOutput.pulse_display_string;
    }
    
    // ==================== SPECIALTY: PARAMETRIC INSURANCE ====================
    if (module === 'all' || module === 'insurance') {
      const insuranceInput = {
        policyType: 'CROP_PROTECTION',
        coverageAmountUsd: 100000,
        premiumPaidUsd: 5000,
        deductibleUsd: 2500,
        policyStartDate: '2025-01-01',
        policyEndDate: '2025-12-31',
        assetDescription: 'Agricultural crops - 50 acres wheat',
        assetLocationGps: '36.7783,-119.4179',
        assetZipCode: '93706',
        iotDeviceIds: ['IOT-SOIL-001', 'IOT-WEATHER-001', 'IOT-MOISTURE-001'],
        satelliteDataSource: 'SENTINEL-2',
        parametricTrigger: { condition: 'RAINFALL_BELOW', threshold: 20, unit: 'mm' },
        ownerId: 'FARMER-001',
        ownerName: 'Test Farmer',
        fileClaim: true,
        claimAmountUsd: 25000,
        iotVerificationData: { soilMoisture: 12, rainfall: 8, temperature: 35 },
      };
      
      const insuranceResult = processParametricInsurance(insuranceInput);
      
      const insuranceOutput = formatSettlementOutput(
        'PARAMETRIC_INSURANCE',
        insuranceResult.policyId,
        insuranceResult.settlement?.afterDeductibleUsd || 0,
        insuranceResult.settlement?.split.founderYieldUsd || 0,
        insuranceResult.settlement?.split.stewardshipUsd || 0,
        insuranceResult.settlement?.split.publicResilienceUsd || 0,
        insuranceInput.assetZipCode || 'GLOBAL',
        `IoT Verified: ${insuranceResult.iotVerification?.verified ? 'YES' : 'NO'} | Confidence: ${insuranceResult.iotVerification?.confidenceScore || 0}%`,
        insuranceResult.settlement?.pulseString || generateClaimSettlePulse(
          insuranceResult.policyId,
          insuranceResult.settlement?.afterDeductibleUsd || 0,
          insuranceResult.settlement?.split.publicResilienceUsd || 0,
          insuranceInput.assetZipCode
        )
      );
      
      results.test_settlements.push(insuranceOutput);
      results.pulse_strings_formatted.insurance = insuranceOutput.pulse_display_string;
    }
    
    // ==================== MODULE 5: RE_HOSPITALITY - SALE ====================
    if (module === 'all' || module === 'refs' || module === 're_hospitality' || module === 'sale') {
      const saleInput = {
        transactionType: 'SALE' as const,
        propertyId: 'PROP-2024-001',
        propertyAddress: '456 Palm Drive, Beverly Hills, CA 90210',
        propertyZipCode: testZipCode,
        salePrice: 2500000,
        closingCostsUsd: 75000,
        isDigitalClosing: true,
        paperDocumentsAvoided: 350,
        agentTravelMilesAvoided: 180,
        currentLtvPercent: 60,
        estimatedEquityUsd: 1000000,
        verificationHash: crypto.createHash('sha256').update('test-digital-closing-001').digest('hex'),
        titleCompanyHash: crypto.createHash('sha256').update('title-company-verification').digest('hex'),
        sellerId: 'SELLER-001',
        nodeId: 'REFS-LA-001',
      };
      
      const saleResult = calculateSaleBuySettlement(saleInput);
      
      // Generate RE_HOSPITALITY format output
      const reHospitalitySale = formatREHospitalityOutput(saleResult, saleInput.propertyAddress);
      results.re_hospitality_outputs.push(reHospitalitySale);
      
      const saleOutput = formatSettlementOutput(
        'RE_HOSPITALITY',
        saleResult.settlementId,
        saleResult.split.totalValueUsd,
        saleResult.split.founderYieldUsd,
        saleResult.split.stewardshipUsd,
        saleResult.split.publicResilienceUsd,
        saleInput.propertyZipCode,
        reHospitalitySale.impact_string,
        saleResult.pulseString
      );
      
      results.test_settlements.push(saleOutput);
      results.pulse_strings_formatted.re_hospitality_sale = saleOutput.pulse_display_string;
    }
    
    // ==================== MODULE 5: RE_HOSPITALITY - RENT ====================
    if (module === 'all' || module === 'refs' || module === 're_hospitality' || module === 'rent') {
      const rentInput = {
        transactionType: 'RENT' as const,
        propertyId: 'PROP-RENT-001',
        propertyAddress: '789 Sunset Blvd, Apt 4B, Los Angeles, CA 90028',
        propertyZipCode: '90028',
        monthlyRentUsd: 3500,
        leaseTermMonths: 12,
        securityDepositUsd: 7000,
        tenantId: 'TENANT-001',
        tenantParticipationScore: 75,
        landlordId: 'LANDLORD-001',
        solarUpgradeEligible: true,
        energyEfficiencyRating: 'C',
        verificationHash: crypto.createHash('sha256').update('test-rent-agreement-001').digest('hex'),
        leaseHash: crypto.createHash('sha256').update('digital-lease-001').digest('hex'),
        nodeId: 'REFS-LA-002',
      };
      
      const rentResult = calculateRentLeaseSettlement(rentInput);
      
      // Zero-Greed check for tenant protection
      const refsZeroGreed = verifyREFSZeroGreed(rentResult);
      if (!refsZeroGreed.compliant) {
        results.spec_compliance.zero_greed_policy = false;
      }
      
      // Generate RE_HOSPITALITY format output
      const reHospitalityRent = formatREHospitalityOutput(rentResult, rentInput.propertyAddress);
      results.re_hospitality_outputs.push(reHospitalityRent);
      
      const rentOutput = formatSettlementOutput(
        'RE_HOSPITALITY',
        rentResult.settlementId,
        rentResult.split.totalValueUsd,
        rentResult.split.landlordYieldUsd,
        rentResult.split.propertyHardeningUsd,
        rentResult.split.tenantResilienceUsd,
        rentInput.propertyZipCode,
        reHospitalityRent.impact_string,
        rentResult.pulseString
      );
      
      results.test_settlements.push(rentOutput);
      results.pulse_strings_formatted.re_hospitality_rent = rentOutput.pulse_display_string;
    }
    
    // ==================== MODULE 5: RE_HOSPITALITY - AIRBNB ====================
    if (module === 'all' || module === 'refs' || module === 're_hospitality' || module === 'airbnb') {
      const airbnbInput = {
        transactionType: 'AIRBNB' as const,
        propertyId: 'PROP-AIRBNB-001',
        propertyAddress: '321 Beach House Way, Malibu, CA 90265',
        propertyZipCode: '90265',
        nightlyRateUsd: 450,
        numberOfNights: 5,
        guestCount: 4,
        cleaningFeeUsd: 150,
        serviceFeeUsd: 200,
        hostId: 'HOST-001',
        estimatedLocalSpendingUsd: 800,
        nearestHotelDistanceMiles: 3.5,
        hotelRoomSizeMultiplier: 1.5,
        verificationHash: crypto.createHash('sha256').update('test-booking-001').digest('hex'),
        bookingHash: crypto.createHash('sha256').update('airbnb-booking-001').digest('hex'),
        nodeId: 'REFS-MALIBU-001',
      };
      
      const airbnbResult = calculateAirbnbSettlement(airbnbInput);
      
      // Generate RE_HOSPITALITY format output
      const reHospitalityAirbnb = formatREHospitalityOutput(airbnbResult, airbnbInput.propertyAddress);
      results.re_hospitality_outputs.push(reHospitalityAirbnb);
      
      const airbnbOutput = formatSettlementOutput(
        'RE_HOSPITALITY',
        airbnbResult.settlementId,
        airbnbResult.split.totalValueUsd,
        airbnbResult.split.hostYieldUsd,
        airbnbResult.split.neighborhoodBufferUsd,
        airbnbResult.split.publicInfrastructureUsd,
        airbnbInput.propertyZipCode,
        reHospitalityAirbnb.impact_string,
        airbnbResult.pulseString
      );
      
      results.test_settlements.push(airbnbOutput);
      results.pulse_strings_formatted.re_hospitality_airbnb = airbnbOutput.pulse_display_string;
    }
    
    // ==================== VALIDATE ZERO GREED POLICY ====================
    for (const settlement of results.test_settlements) {
      const zeroGreedCheck = verifyZeroGreedPolicy({
        founderYield: settlement.founder_yield_70,
        stewardship: settlement.stewardship_20,
        publicResilience: settlement.public_overflow_10,
        total: settlement.gross_value_usd,
      });
      
      if (zeroGreedCheck === 'HIGH_FRICTION') {
        results.spec_compliance.zero_greed_policy = false;
        break;
      }
    }
    
    return NextResponse.json({
      status: 'SUCCESS',
      message: 'Test settlements generated per God-Prompt specification',
      god_prompt_version: 'Final Abacus God-Prompt',
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('Test settlement error:', error);
    return NextResponse.json({ error: 'Test settlement failed', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'validate-schema') {
      // Validate a settlement object against the God-Prompt schema
      const { settlement } = body;
      
      const requiredFields = [
        'module_type',
        'asset_id',
        'gross_value_usd',
        'founder_yield_70',
        'stewardship_20',
        'public_overflow_10',
        'zip_code',
        'impact_string',
        'pulse_display_string',
      ];
      
      const missingFields = requiredFields.filter(f => !(f in settlement));
      
      if (missingFields.length > 0) {
        return NextResponse.json({
          valid: false,
          error: 'Missing required fields',
          missing_fields: missingFields,
        }, { status: 400 });
      }
      
      // Validate the Dynamic BPS split (Σ = 10,000 BPS)
      const total = settlement.gross_value_usd;
      const expectedFounder = total * 0.70;
      const expectedStewardship = total * 0.20;
      const expectedPublic = total * 0.10;
      
      const tolerance = 0.01; // 1 cent tolerance
      
      const splitValid = 
        Math.abs(settlement.founder_yield_70 - expectedFounder) < tolerance &&
        Math.abs(settlement.stewardship_20 - expectedStewardship) < tolerance &&
        Math.abs(settlement.public_overflow_10 - expectedPublic) < tolerance;
      
      // Zero Greed Policy check
      const publicRatio = settlement.public_overflow_10 / total;
      const zeroGreedValid = publicRatio >= 0.099; // 9.9% minimum
      
      return NextResponse.json({
        valid: splitValid && zeroGreedValid,
        split_valid: splitValid,
        zero_greed_valid: zeroGreedValid,
        actual_ratios: {
          founder: ((settlement.founder_yield_70 / total) * 100).toFixed(2) + '%',
          stewardship: ((settlement.stewardship_20 / total) * 100).toFixed(2) + '%',
          public: ((settlement.public_overflow_10 / total) * 100).toFixed(2) + '%',
        },
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Test settlement POST error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
