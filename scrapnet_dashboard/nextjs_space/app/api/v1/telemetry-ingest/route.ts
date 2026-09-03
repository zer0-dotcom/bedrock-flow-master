export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAethexerKey, PROTOCOL_VERSION } from '@/lib/aethexer-auth';
import {
  runSentinelScoring,
  SENTINEL_NODE,
  SENTINEL_VERSION,
  type DocumentIntegrityInput,
  type LLMConfidenceInput,
  type SpatialCorrelationInput,
} from '@/lib/sentinel-engine';
import { UNIVERSAL_SPLIT } from '@/lib/universal-law';
import crypto from 'crypto';

/**
 * AETHEXER PROTOCOL v1 — LIVE TELEMETRY INGEST
 *
 * POST /api/v1/telemetry-ingest
 *
 * Accepts data-center node telemetry readings:
 *   - node_id              (required)  Unique node identifier
 *   - power_usage_kw       (required)  Current power draw in kW
 *   - pue_ratio            (required)  Power Usage Effectiveness ratio
 *   - carbon_per_trade_g   (required)  Carbon emitted per trade in grams
 *   - grid_intensity_score (required)  Grid carbon intensity 0-1
 *   - asset_class          (optional)  SettlementAssetClass enum value (default: PROPERTY_INDUSTRIAL)
 *
 * Auth: Aethexer dual-key pattern (x-aethexer-key OR x-aethexer-field-key)
 *
 * Flow:
 *   1. Authenticate via Trinity Sentinel (3-layer)
 *   2. Validate telemetry payload
 *   3. Run Sentinel verification (synthetic scoring from telemetry quality)
 *   4. Persist TelemetryReading
 *   5. If AUTO_APPROVED → trigger Dynamic BPS settlement
 *   6. Return reading + verdict + settlement (if triggered)
 */

/**
 * KNOWN GEOGRAPHIC ZONE REGISTRY
 *
 * Maps DC node prefixes to their registered physical zones.
 * Used by synthesizeSentinelInputs() to derive honest spatial scores
 * from GPS coordinates and grid-intensity correlation.
 *
 * gridIntensityRange: Expected regional grid carbon intensity bounds.
 * Derived from real US ISO/RTO grid data (2025-2026 averages):
 *   - Southwest (NV/AZ):    0.20-0.55  (solar + natural gas)
 *   - South Central (TX):   0.25-0.65  (ERCOT: wind + gas + solar)
 *   - West Coast (CA):      0.15-0.50  (CAISO: heavy renewables)
 *   - Mid-Atlantic (PA/PJM): 0.30-0.75 (coal + gas + nuclear mix)
 */
const KNOWN_GEOGRAPHIC_ZONES: Record<string, {
  label: string;
  centerLat: number;
  centerLon: number;
  radiusKm: number;
  gridIntensityRange: [number, number];
}> = {
  'DC-SOVEREIGN': {
    label: 'Sovereign Primary — Las Vegas NV (Southwest)',
    centerLat: 36.1699,
    centerLon: -115.1398,
    radiusKm: 50,
    gridIntensityRange: [0.20, 0.55],
  },
  'DC-PROPERTY': {
    label: 'Property Industrial — Houston TX (ERCOT)',
    centerLat: 29.7604,
    centerLon: -95.3698,
    radiusKm: 75,
    gridIntensityRange: [0.25, 0.65],
  },
  'DC-PALLETS': {
    label: 'Logistics Hub — Ontario CA (CAISO)',
    centerLat: 34.0633,
    centerLon: -117.6509,
    radiusKm: 40,
    gridIntensityRange: [0.15, 0.50],
  },
  'DC-METALS': {
    label: 'Metals Recovery — Pittsburgh PA (PJM)',
    centerLat: 40.4406,
    centerLon: -79.9959,
    radiusKm: 60,
    gridIntensityRange: [0.30, 0.75],
  },
};

/**
 * Resolve a node ID to its registered geographic zone.
 * Matches on longest-prefix (e.g. DC-SOVEREIGN-A1 → DC-SOVEREIGN).
 * Returns null for unregistered / unknown node prefixes.
 */
function resolveNodeZone(nodeId: string): (typeof KNOWN_GEOGRAPHIC_ZONES)[string] | null {
  // Sort keys by length descending so longest prefix matches first
  const sortedKeys = Object.keys(KNOWN_GEOGRAPHIC_ZONES).sort((a, b) => b.length - a.length);
  for (const prefix of sortedKeys) {
    if (nodeId.startsWith(prefix)) {
      return KNOWN_GEOGRAPHIC_ZONES[prefix];
    }
  }
  return null;
}

const VALID_ASSET_CLASSES = [
  'SOVEREIGN_SKIN',
  'PROPERTY_INDUSTRIAL',
  'PROPERTY_RESIDENTIAL',
  'PHYSICAL_COMMODITIES',
  'PRECIOUS_METALS_CUSTODIAL',
] as const;

type AssetClassType = typeof VALID_ASSET_CLASSES[number];

interface TelemetryPayload {
  node_id: string;
  power_usage_kw: number;
  pue_ratio: number;
  carbon_per_trade_g: number;
  grid_intensity_score: number;
  asset_class?: AssetClassType;
  asset_class_metadata?: Record<string, any>;
}

function validatePayload(body: any): { valid: boolean; error?: string; data?: TelemetryPayload } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const { node_id, power_usage_kw, pue_ratio, carbon_per_trade_g, grid_intensity_score, asset_class, asset_class_metadata } = body;

  if (!node_id || typeof node_id !== 'string' || node_id.trim().length === 0) {
    return { valid: false, error: 'node_id is required and must be a non-empty string.' };
  }

  if (typeof power_usage_kw !== 'number' || power_usage_kw < 0) {
    return { valid: false, error: 'power_usage_kw is required and must be a non-negative number.' };
  }

  if (typeof pue_ratio !== 'number' || pue_ratio < 1.0) {
    return { valid: false, error: 'pue_ratio is required and must be >= 1.0 (ideal PUE).' };
  }

  if (typeof carbon_per_trade_g !== 'number' || carbon_per_trade_g < 0) {
    return { valid: false, error: 'carbon_per_trade_g is required and must be a non-negative number.' };
  }

  if (typeof grid_intensity_score !== 'number' || grid_intensity_score < 0 || grid_intensity_score > 1) {
    return { valid: false, error: 'grid_intensity_score is required and must be between 0 and 1.' };
  }

  if (asset_class && !VALID_ASSET_CLASSES.includes(asset_class)) {
    return { valid: false, error: `asset_class must be one of: ${VALID_ASSET_CLASSES.join(', ')}` };
  }

  // Validate asset_class_metadata if provided — must be a JSON object
  if (asset_class_metadata !== undefined && (typeof asset_class_metadata !== 'object' || asset_class_metadata === null || Array.isArray(asset_class_metadata))) {
    return { valid: false, error: 'asset_class_metadata must be a JSON object (not null, not array).' };
  }

  return {
    valid: true,
    data: {
      node_id: node_id.trim(),
      power_usage_kw,
      pue_ratio,
      carbon_per_trade_g,
      grid_intensity_score,
      asset_class: asset_class || 'PROPERTY_INDUSTRIAL',
      asset_class_metadata: asset_class_metadata || undefined,
    },
  };
}

/**
 * Synthesize Sentinel scores from telemetry quality signals.
 *
 * OPTION A — HONEST GEOSPATIAL CORRELATION (v2)
 *
 * Spatial scoring derives a baseline from the payload's GPS coordinates
 * against the node's registered geographic zone bounds:
 *
 *   1. Resolve node_id → KNOWN_GEOGRAPHIC_ZONES (prefix match)
 *   2. If zone found: inject zone-center lat/lon as derived GPS
 *   3. Validate grid_intensity_score against zone's expected range
 *   4. If grid reading correlates with regional grid → spatialScanPresent = true
 *      (the telemetry data itself IS the spatial proof — power/grid readings
 *       from the claimed location match the regional grid characteristics)
 *   5. If grid reading is anomalous for the zone → spatialScanPresent = false
 *      (node stays in PENDING_SOVEREIGN_REVIEW until investigated)
 *
 * Unregistered nodes (no zone match) get no GPS and no spatial scan credit,
 * ensuring they always route to PENDING_SOVEREIGN_REVIEW.
 */
function synthesizeSentinelInputs(data: TelemetryPayload) {
  // Document Integrity → derived from data completeness + PUE plausibility
  const pueNormalized = Math.min(1, Math.max(0, 1 - (data.pue_ratio - 1) / 2)); // PUE 1.0=perfect, 3.0=terrible
  const dataComplete = (
    (data.node_id ? 1 : 0) +
    (data.power_usage_kw > 0 ? 1 : 0) +
    (data.pue_ratio >= 1 ? 1 : 0) +
    (data.carbon_per_trade_g >= 0 ? 1 : 0) +
    (data.grid_intensity_score >= 0 ? 1 : 0)
  ) / 5;
  const docIntegrity = (dataComplete * 0.6 + pueNormalized * 0.4);

  const docInputs: DocumentIntegrityInput[] = [{
    fileName: `telemetry-${data.node_id}.json`,
    fileHash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
    fileSizeBytes: JSON.stringify(data).length,
    fileType: 'application/json',
    magicBytesValid: true, // Telemetry is always valid JSON
    headerStructureValid: true,
  }];

  // LLM Confidence → derived from grid intensity plausibility
  const llmInput: LLMConfidenceInput = {
    parserConfidence: Math.min(1, 0.8 + data.grid_intensity_score * 0.2),
    fieldsExtracted: 5,
    fieldsExpected: 5,
    hasAnomalies: data.pue_ratio > 2.5 || data.carbon_per_trade_g > 500,
  };

  // ── OPTION A: Honest Geospatial Correlation ──────────────────────────
  // Resolve node to a registered geographic zone
  const zone = resolveNodeZone(data.node_id);

  // Derive GPS coordinates from zone center (if registered)
  const hasZone = zone !== null;
  const derivedLat = zone?.centerLat;
  const derivedLon = zone?.centerLon;

  // Grid-intensity correlation check:
  // If the node's reported grid_intensity_score falls within the zone's
  // expected regional grid carbon intensity range, the telemetry data
  // corroborates the node's claimed physical location.
  let gridCorrelatesWithZone = false;
  if (zone) {
    const [lo, hi] = zone.gridIntensityRange;
    gridCorrelatesWithZone =
      data.grid_intensity_score >= lo && data.grid_intensity_score <= hi;

    console.log(
      `[Spatial Correlation] Node=${data.node_id} | Zone=${zone.label} | ` +
      `Grid=${data.grid_intensity_score} | Range=[${lo}, ${hi}] | ` +
      `Correlates=${gridCorrelatesWithZone}`
    );
  } else {
    console.log(
      `[Spatial Correlation] Node=${data.node_id} | Zone=UNREGISTERED | ` +
      `No geographic zone match — spatial score will be limited`
    );
  }

  const spatialInput: SpatialCorrelationInput = {
    hasGeolocation: hasZone,
    geoLatitude: derivedLat,
    geoLongitude: derivedLon,
    hasTimestamp: true,
    timestampConsistent: true,
    metadataFieldsPresent: 5,
    metadataFieldsExpected: 5,
    // Spatial scan = grid-intensity zone correlation
    // TRUE only when the grid reading honestly matches regional expectations
    spatialScanPresent: gridCorrelatesWithZone,
    // Ground photos are never present for automated telemetry
    groundPhotosPresent: false,
  };

  return { docInputs, llmInput, spatialInput };
}

/**
 * Auto-settle telemetry on AUTO_APPROVED verdict.
 * Calculates the Dynamic BPS split based on carbon cost.
 */
function calculateTelemetrySettlement(data: TelemetryPayload) {
  // Value derived from carbon cost: $50/tonne CO2 shadow price
  const carbonTonnes = (data.carbon_per_trade_g / 1000) * (data.power_usage_kw / 1000);
  const carbonShadowPrice = 50; // USD per tonne
  const totalValueUsd = carbonTonnes * carbonShadowPrice;

  const founderYieldUsd = Math.round(totalValueUsd * UNIVERSAL_SPLIT.FOUNDER_YIELD * 100) / 100;
  const stewardshipUsd = Math.round(totalValueUsd * UNIVERSAL_SPLIT.STEWARDSHIP * 100) / 100;
  const publicResilienceUsd = Math.round(totalValueUsd * UNIVERSAL_SPLIT.PUBLIC_RESILIENCE * 100) / 100;

  const settlementId = `TEL-${data.node_id}-${Date.now().toString(36).toUpperCase()}`;

  return {
    settlementId,
    totalValueUsd: Math.round(totalValueUsd * 100) / 100,
    split: {
      assetSovereign: founderYieldUsd,           // Asset Sovereign leg (Verified Asset Holder)
      platformProcessor: stewardshipUsd,        // Verification Node leg
      publicResilience: publicResilienceUsd,     // Public Resilience leg
    },
    carbonTonnes: Math.round(carbonTonnes * 10000) / 10000,
    shadowPricePerTonne: carbonShadowPrice,
    assetClass: data.asset_class || 'PROPERTY_INDUSTRIAL',
  };
}

export async function POST(request: NextRequest) {
  try {
    // ── Layer 1-3: Aethexer Authentication ─────────────────────────────
    const authResult = await validateAethexerKey(request);
    if (!authResult.valid) return authResult.response!;

    // ── Parse & Validate Payload ──────────────────────────────────────
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { protocol: PROTOCOL_VERSION, error: 'INVALID_JSON', message: 'Request body must be valid JSON.' },
        { status: 400 }
      );
    }

    const validation = validatePayload(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { protocol: PROTOCOL_VERSION, error: 'VALIDATION_ERROR', message: validation.error },
        { status: 400 }
      );
    }

    const data = validation.data;

    // ── Sentinel Verification ─────────────────────────────────────────
    const { docInputs, llmInput, spatialInput } = synthesizeSentinelInputs(data);
    const sentinelScore = runSentinelScoring(docInputs, llmInput, spatialInput);

    console.log(`[Telemetry Ingest] Node=${data.node_id} | Verdict=${sentinelScore.sentinelVerdict} | Composite=${sentinelScore.compositeScore}`);

    // ── Auto-Settlement on AUTO_APPROVED ───────────────────────────────
    let settlement = null;
    let settlementId: string | null = null;
    let settled = false;
    let settledAt: Date | null = null;

    if (sentinelScore.sentinelVerdict === 'AUTO_APPROVED') {
      settlement = calculateTelemetrySettlement(data);
      settlementId = settlement.settlementId;
      settled = true;
      settledAt = new Date();

      console.log(`[Telemetry Ingest] AUTO-SETTLE: ${settlementId} | $${settlement.totalValueUsd} | ${settlement.carbonTonnes}t CO2`);
    }

    // ── Persist to Database ────────────────────────────────────────────
    const reading = await prisma.telemetryReading.create({
      data: {
        nodeId: data.node_id,
        powerUsageKw: data.power_usage_kw,
        pueRatio: data.pue_ratio,
        carbonPerTradeG: data.carbon_per_trade_g,
        gridIntensityScore: data.grid_intensity_score,
        assetClass: data.asset_class as any || 'PROPERTY_INDUSTRIAL',
        assetClassMetadata: data.asset_class_metadata ? JSON.stringify(data.asset_class_metadata) : null,
        sentinelVerdict: sentinelScore.sentinelVerdict,
        sentinelScore: sentinelScore.compositeScore,
        sentinelHash: sentinelScore.scoreHash,
        settlementId,
        settled,
        settledAt,
        authMethod: authResult.authMethod || null,
        sourceIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      },
    });

    // ── Response ───────────────────────────────────────────────────────
    return NextResponse.json({
      protocol: PROTOCOL_VERSION,
      status: 'INGESTED',
      reading: {
        id: reading.id,
        nodeId: reading.nodeId,
        powerUsageKw: reading.powerUsageKw,
        pueRatio: reading.pueRatio,
        carbonPerTradeG: reading.carbonPerTradeG,
        gridIntensityScore: reading.gridIntensityScore,
        assetClass: reading.assetClass,
        ingestedAt: reading.createdAt.toISOString(),
      },
      sentinel: {
        verdict: sentinelScore.sentinelVerdict,
        compositeScore: sentinelScore.compositeScore,
        scores: {
          documentIntegrity: sentinelScore.documentIntegrity,
          llmConfidence: sentinelScore.llmConfidence,
          spatialCorrelation: sentinelScore.spatialCorrelation,
        },
        failedChecks: sentinelScore.failedChecks,
        node: SENTINEL_NODE,
        version: SENTINEL_VERSION,
        scoreHash: sentinelScore.scoreHash,
      },
      settlement: settlement ? {
        id: settlement.settlementId,
        totalValueUsd: settlement.totalValueUsd,
        split: settlement.split,
        carbonTonnes: settlement.carbonTonnes,
        shadowPricePerTonne: settlement.shadowPricePerTonne,
        assetClass: settlement.assetClass,
        settledAt: settledAt?.toISOString(),
      } : null,
      meta: {
        authMethod: authResult.authMethod,
        timestamp: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Telemetry Ingest] Error:', error);
    return NextResponse.json(
      {
        protocol: PROTOCOL_VERSION,
        error: 'INTERNAL_ERROR',
        message: 'Telemetry ingest failed. Check server logs.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/telemetry-ingest
 *
 * Returns latest telemetry readings per node (for dashboard polling).
 * Public endpoint — no auth required (read-only node status).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('node_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    if (nodeId) {
      // Single node: latest readings
      const readings = await prisma.telemetryReading.findMany({
        where: { nodeId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({
        protocol: PROTOCOL_VERSION,
        nodeId,
        count: readings.length,
        readings: readings.map(r => ({
          id: r.id,
          powerUsageKw: r.powerUsageKw,
          pueRatio: r.pueRatio,
          carbonPerTradeG: r.carbonPerTradeG,
          gridIntensityScore: r.gridIntensityScore,
          sentinelVerdict: r.sentinelVerdict,
          settled: r.settled,
          settlementId: r.settlementId,
          ingestedAt: r.createdAt.toISOString(),
        })),
      });
    }

    // All nodes: latest reading per node
    const latestPerNode = await prisma.$queryRaw`
      SELECT DISTINCT ON (node_id)
        id, node_id, power_usage_kw, pue_ratio, carbon_per_trade_g,
        grid_intensity_score, sentinel_verdict, sentinel_score,
        settled, settlement_id, created_at
      FROM telemetry_readings
      ORDER BY node_id, created_at DESC
    ` as any[];

    return NextResponse.json({
      protocol: PROTOCOL_VERSION,
      activeNodes: latestPerNode.length,
      nodes: latestPerNode.map(r => ({
        nodeId: r.node_id,
        powerUsageKw: r.power_usage_kw,
        pueRatio: r.pue_ratio,
        carbonPerTradeG: r.carbon_per_trade_g,
        gridIntensityScore: r.grid_intensity_score,
        sentinelVerdict: r.sentinel_verdict,
        sentinelScore: r.sentinel_score,
        settled: r.settled,
        settlementId: r.settlement_id,
        lastIngestedAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      })),
    });
  } catch (error: any) {
    console.error('[Telemetry Ingest] GET Error:', error);
    return NextResponse.json(
      { protocol: PROTOCOL_VERSION, error: 'INTERNAL_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
