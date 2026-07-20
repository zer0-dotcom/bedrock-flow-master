import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Master Counter API - Total Carbon Impact
 * Aggregates carbon savings/sequestration across all three engines:
 * - Asphalt: CO2 saved (kg) from RAP usage
 * - Biochar: CO2 sequestered (tonnes) from CDR
 * - Metal: CO2 avoided (tonnes) from recycling
 */
export async function GET() {
  try {
    // ===== ASPHALT ENGINE =====
    // Sum of tonsCo2Saved from all projects
    const asphaltAgg = await prisma.project.aggregate({
      _sum: {
        tonsCo2Saved: true,
      },
      _count: true,
    });
    const asphaltSavedTonnes = asphaltAgg._sum.tonsCo2Saved || 0;
    const asphaltSavedKg = asphaltSavedTonnes * 1000;

    // ===== BIOCHAR ENGINE =====
    // Sum of co2EquivalentTonnes from verified batches
    const biocharAgg = await prisma.biocharBatch.aggregate({
      where: { verificationStatus: 'VERIFIED' },
      _sum: {
        co2EquivalentTonnes: true,
        cdrCreditsTonnes: true,
      },
      _count: true,
    });
    const biocharSequesteredTonnes = biocharAgg._sum.co2EquivalentTonnes || 0;

    // All batches (including pending)
    const biocharAllAgg = await prisma.biocharBatch.aggregate({
      _sum: {
        co2EquivalentTonnes: true,
      },
      _count: true,
    });
    const biocharTotalTonnes = biocharAllAgg._sum.co2EquivalentTonnes || 0;

    // ===== METAL ENGINE =====
    // Sum of avoidedEmissionsKg from verified logs
    const metalAgg = await prisma.metalRecoveryLog.aggregate({
      where: { verificationStatus: 'VERIFIED' },
      _sum: {
        avoidedEmissionsKg: true,
      },
      _count: true,
    });
    const metalAvoidedKg = metalAgg._sum.avoidedEmissionsKg || 0;
    const metalAvoidedTonnes = metalAvoidedKg / 1000;

    // All metal logs (including pending)
    const metalAllAgg = await prisma.metalRecoveryLog.aggregate({
      _sum: {
        avoidedEmissionsKg: true,
      },
      _count: true,
    });
    const metalTotalKg = metalAllAgg._sum.avoidedEmissionsKg || 0;
    const metalTotalTonnes = metalTotalKg / 1000;

    // ===== TOTAL CARBON IMPACT =====
    // Unified in tonnes CO2e
    const totalVerifiedImpactTonnes = asphaltSavedTonnes + biocharSequesteredTonnes + metalAvoidedTonnes;
    const totalImpactTonnes = asphaltSavedTonnes + biocharTotalTonnes + metalTotalTonnes;

    // Equivalencies
    const totalImpactKg = totalVerifiedImpactTonnes * 1000;
    const treesEquivalent = Math.round(totalImpactKg / 21); // ~21 kg CO2/tree/year
    const carMilesEquivalent = Math.round(totalImpactKg / 0.411); // ~0.411 kg CO2/mile
    const homesYearEquivalent = Math.round(totalVerifiedImpactTonnes / 7.5); // ~7.5 t CO2/home/year

    return NextResponse.json({
      // Summary
      totalVerifiedImpactTonnes,
      totalImpactTonnes,
      timestamp: new Date().toISOString(),
      
      // Per-engine breakdown (verified only)
      asphalt: {
        name: 'Asphalt (RAP)',
        icon: 'emerald',
        projectCount: asphaltAgg._count,
        savedKg: asphaltSavedKg,
        savedTonnes: asphaltSavedTonnes,
        unit: 'kg CO₂',
        displayValue: asphaltSavedKg,
        contributionPercent: totalVerifiedImpactTonnes > 0 
          ? (asphaltSavedTonnes / totalVerifiedImpactTonnes) * 100 
          : 0,
      },
      biochar: {
        name: 'Biochar (CDR)',
        icon: 'amber',
        batchCount: biocharAgg._count,
        verifiedTonnes: biocharSequesteredTonnes,
        totalTonnes: biocharTotalTonnes,
        unit: 't CO₂',
        displayValue: biocharSequesteredTonnes,
        contributionPercent: totalVerifiedImpactTonnes > 0 
          ? (biocharSequesteredTonnes / totalVerifiedImpactTonnes) * 100 
          : 0,
      },
      metal: {
        name: 'Metal (Recovery)',
        icon: 'cyan',
        logCount: metalAgg._count,
        avoidedKg: metalAvoidedKg,
        avoidedTonnes: metalAvoidedTonnes,
        totalTonnes: metalTotalTonnes,
        unit: 't CO₂',
        displayValue: metalAvoidedTonnes,
        contributionPercent: totalVerifiedImpactTonnes > 0 
          ? (metalAvoidedTonnes / totalVerifiedImpactTonnes) * 100 
          : 0,
      },
      
      // Equivalencies
      equivalencies: {
        treesPlanted: treesEquivalent,
        carMilesAvoided: carMilesEquivalent,
        homesYearOffset: homesYearEquivalent,
      },
    });
  } catch (error) {
    console.error('Error calculating total carbon impact:', error);
    return NextResponse.json(
      { error: 'Failed to calculate carbon impact' },
      { status: 500 }
    );
  }
}
