export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { generateConsentMetadata } from '@/lib/consent';

/**
 * CARBON FOOTPRINT CALCULATION (Local Engine)
 * ---------------------------------------------
 * GWP A1-A3 lifecycle model for RAP asphalt mixes.
 * Replaces the legacy external AI workflow call that was returning 404.
 *
 * Baselines (per tonne of mix):
 *  - Virgin HMA: 60 kg CO2e / tonne
 *  - RAP linear reduction: 0.4 kg CO2e / tonne per 1% RAP content
 *  - Mix type modifier: HMA 0, WMA -5 kg, CMA -15 kg (heating avoidance)
 *  - Transport: 0.08 kg CO2e / tonne per km one-way
 *
 * Sources:
 *  - Eurobitume LCA Framework 2023
 *  - NAPA Guidelines (RAP Usage)
 *  - scrapnet_carbon_model/rap_co2_calculator.py (internal model)
 */

type MixType = 'HMA' | 'WMA' | 'CMA';
type LayerType = 'surface' | 'base';

const VIRGIN_BASELINE_KG_PER_TONNE = 60.0;
const RAP_REDUCTION_PER_PERCENT = 0.4; // kg CO2e / tonne per 1% RAP
const TRANSPORT_KG_PER_TONNE_PER_KM = 0.08;
const MIX_TYPE_MODIFIER: Record<MixType, number> = {
  HMA: 0,
  WMA: -5,
  CMA: -15,
};
const MAX_RAP_BY_LAYER: Record<LayerType, number> = {
  surface: 25,
  base: 40,
};
const GREEN_TARGET_KG_PER_TONNE = 45; // <45 kg CO2/ton = "Green"

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Calculate carbon footprint for a RAP mix.
 * Returns a full result object compatible with the UI schema.
 */
function calculateCarbonFootprint(params: {
  plannedTonnage: number;
  targetRapPercentage: number;
  tripDistance: number;
  mixType: MixType;
  layerType: LayerType;
  carbonCap: number;
}) {
  const {
    plannedTonnage,
    targetRapPercentage,
    tripDistance,
    mixType,
    layerType,
    carbonCap,
  } = params;

  const maxRap = MAX_RAP_BY_LAYER[layerType] ?? 40;
  const effectiveRap = clamp(targetRapPercentage, 0, 50);

  // Base carbon score (kg CO2e / tonne)
  const rapReduction = effectiveRap * RAP_REDUCTION_PER_PERCENT;
  const mixMod = MIX_TYPE_MODIFIER[mixType] ?? 0;
  const transportComponent = tripDistance * TRANSPORT_KG_PER_TONNE_PER_KM;

  const carbonScore = Math.max(
    0,
    VIRGIN_BASELINE_KG_PER_TONNE - rapReduction + mixMod + transportComponent
  );

  // Total project emissions (tonnes)
  const predictedCo2Emissions = (carbonScore * plannedTonnage) / 1000;

  // Virgin baseline total for the project
  const baselineEmissions =
    ((VIRGIN_BASELINE_KG_PER_TONNE + transportComponent) * plannedTonnage) /
    1000;

  const tonsCo2Saved = Math.max(0, baselineEmissions - predictedCo2Emissions);

  // Compute optimal RAP within layer max: the rap % that lands
  // the carbonScore closest to (carbonCap - 3) kg/ton (3 kg headroom)
  // but never exceeding maxRap for this layer.
  const targetScore = Math.max(0, carbonCap - 3);
  const requiredReduction =
    VIRGIN_BASELINE_KG_PER_TONNE + mixMod + transportComponent - targetScore;
  const rapNeeded = clamp(
    requiredReduction / RAP_REDUCTION_PER_PERCENT,
    0,
    maxRap
  );
  const optimalRapPercentage = Math.round(rapNeeded * 10) / 10;

  const meetsGreenTarget = carbonScore <= GREEN_TARGET_KG_PER_TONNE;
  const carbonCapCompliance = carbonScore <= carbonCap;

  // Recommendation narrative
  let mixRecommendation: string;
  if (effectiveRap > maxRap) {
    mixRecommendation = `Target RAP ${targetRapPercentage}% exceeds the ${maxRap}% maximum for ${layerType} layer. Reduce to ${maxRap}% or switch layer type. Recommended mix: ${mixType} at ${maxRap}% RAP.`;
  } else if (!carbonCapCompliance) {
    mixRecommendation = `Current configuration (${effectiveRap}% RAP, ${mixType}) yields ${carbonScore.toFixed(
      1
    )} kg CO2/ton which exceeds the ${carbonCap} kg cap. Increase RAP to ~${optimalRapPercentage}% or switch to WMA/CMA to reduce heating emissions.`;
  } else if (!meetsGreenTarget) {
    mixRecommendation = `Configuration is compliant (${carbonScore.toFixed(
      1
    )} kg CO2/ton) but above the <${GREEN_TARGET_KG_PER_TONNE} kg Green Target. Consider increasing RAP to ${optimalRapPercentage}% or upgrading to WMA for additional reductions.`;
  } else {
    mixRecommendation = `Optimal: ${mixType} at ${effectiveRap}% RAP delivers ${carbonScore.toFixed(
      1
    )} kg CO2/ton, meeting the Green Target (<${GREEN_TARGET_KG_PER_TONNE} kg) and saving ${tonsCo2Saved.toFixed(
      2
    )} tCO2e vs. virgin baseline for this ${plannedTonnage}-tonne project.`;
  }

  const timestamp = new Date().toISOString();
  const projectId = crypto.randomUUID();

  return {
    project_id: projectId,
    timestamp,
    inputs: {
      planned_tonnage: plannedTonnage,
      target_rap_percentage: targetRapPercentage,
      trip_distance_km: tripDistance,
      mix_type: mixType,
      layer_type: layerType,
      carbon_cap_kg_per_ton: carbonCap,
      max_rap_for_layer: maxRap,
    },
    carbon_score: Math.round(carbonScore * 100) / 100,
    predicted_co2_emissions: Math.round(predictedCo2Emissions * 100) / 100,
    baseline_co2_emissions: Math.round(baselineEmissions * 100) / 100,
    tons_co2_saved: Math.round(tonsCo2Saved * 100) / 100,
    optimal_rap_percentage: optimalRapPercentage,
    meets_green_target: meetsGreenTarget,
    carbon_cap_compliance: carbonCapCompliance,
    mix_recommendation: mixRecommendation,
    gps_coordinates: null,
    methodology: 'Eurobitume LCA A1-A3 / NAPA RAP Guidelines (Bedrock ESG local engine)',
    engine_version: 'bedrock-esg-local-1.0',
  };
}

/**
 * Consent gate: optional. When userId is provided, enforce full consent;
 * otherwise operate in public mode.
 */
async function verifyUserConsent(userId: string | undefined) {
  if (!userId) {
    return {
      authorized: true,
      message: 'Public calculator access (no user context)',
      consentHash: null,
      consentMetadata: null,
      publicMode: true as const,
    };
  }

  const consent = await prisma.userConsent.findUnique({
    where: { userId },
  });

  if (!consent) {
    return {
      authorized: false,
      message: 'No consent record found. User must accept Terms of Service, Carbon Rights Transfer, and AI Monitoring agreements.',
      consentHash: null,
      consentMetadata: null,
      publicMode: false as const,
    };
  }

  if (!consent.termsAccepted || !consent.carbonRightsTransfer || !consent.aiMonitoring) {
    const missing = [];
    if (!consent.termsAccepted) missing.push('Terms of Service');
    if (!consent.carbonRightsTransfer) missing.push('Carbon Rights Transfer');
    if (!consent.aiMonitoring) missing.push('AI Monitoring');

    return {
      authorized: false,
      message: `Missing required consents: ${missing.join(', ')}.`,
      consentHash: consent.consentHash,
      consentMetadata: null,
      publicMode: false as const,
    };
  }

  return {
    authorized: true,
    message: 'User is authorized',
    consentHash: consent.consentHash,
    consentMetadata: generateConsentMetadata(
      consent.consentHash,
      consent.carbonRightsTransfer,
      consent.aiMonitoring,
      consent.termsVersion,
      consent.termsAcceptedAt || new Date()
    ),
    publicMode: false as const,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      plannedTonnage,
      targetRapPercentage,
      tripDistance,
      mixType = 'HMA',
      layerType = 'surface',
      carbonCap = 60,
      userId,
    } = body;

    // Input validation
    const pt = Number(plannedTonnage);
    const rap = Number(targetRapPercentage);
    const dist = Number(tripDistance);
    const cap = Number(carbonCap);

    if (!Number.isFinite(pt) || pt <= 0) {
      return Response.json(
        { error: 'plannedTonnage must be a positive number' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(rap) || rap < 0 || rap > 50) {
      return Response.json(
        { error: 'targetRapPercentage must be between 0 and 50' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(dist) || dist < 0) {
      return Response.json(
        { error: 'tripDistance must be a non-negative number' },
        { status: 400 }
      );
    }

    // Consent gate (optional)
    const consentCheck = await verifyUserConsent(userId);
    if (!consentCheck.authorized) {
      return Response.json(
        {
          error: 'Consent required',
          authorized: false,
          message: consentCheck.message,
          consentHash: consentCheck.consentHash,
        },
        { status: 403 }
      );
    }

    // Run local calculation
    const result = calculateCarbonFootprint({
      plannedTonnage: pt,
      targetRapPercentage: rap,
      tripDistance: dist,
      mixType: (['HMA', 'WMA', 'CMA'].includes(mixType) ? mixType : 'HMA') as MixType,
      layerType: (['surface', 'base'].includes(layerType) ? layerType : 'surface') as LayerType,
      carbonCap: Number.isFinite(cap) ? cap : 60,
    });

    const consentData = {
      consent_verified: !consentCheck.publicMode,
      consent_hash: consentCheck.consentHash,
      consent_metadata: consentCheck.consentMetadata,
      public_mode: consentCheck.publicMode,
    };

    // Return a Server-Sent Events stream so the existing client parser works.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Emit a couple of progress events
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              status: 'processing',
              message: 'Analyzing mix composition...',
            })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              status: 'processing',
              message: 'Computing GWP A1-A3 lifecycle...',
            })}\n\n`
          )
        );

        // Final completion event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              status: 'completed',
              result: {
                ...result,
                ...consentData,
              },
            })}\n\n`
          )
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Calculate API error:', error);
    return Response.json(
      {
        error: 'Failed to calculate carbon footprint',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
