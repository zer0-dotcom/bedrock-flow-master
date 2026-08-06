/**
 * BEDROCK ESG — INGRESS VALIDATION ENGINE (BT-C9C4C5 v2.3)
 *
 * Zod schemas for the extended Aethexer ingest pipeline.
 * Enforces canonical asset class variants (A–E) with sub-classification
 * metadata routing for Variant B macro-assets (skyscrapers, casinos,
 * logistics centres).
 *
 * Sentinel verdict alignment: uses the live 7-tier verdict labels
 * from lib/sentinel-engine.ts — no parallel enums.
 *
 * Operational identity: Zer0 (local cockpit only).
 * On-chain identity: Aethexer Notary Node (immutable).
 *
 * v2.4 — Added optional macro-asset metadata fields:
 *   chiller_exhaust_temp, square_footage_volume,
 *   damper_mechanical_load_kw, spatial_data_envelope.
 *   All new Variant B assets enter at PENDING_SOVEREIGN_REVIEW by default.
 */

import { z } from 'zod';

// ─── Canonical Asset Class Variants (A–E) ───────────────────────────────────

export const AssetClassVariantSchema = z.enum([
  'SOVEREIGN_SKIN',            // Variant A
  'PROPERTY_INDUSTRIAL',       // Variant B (skyscrapers, casinos, logistics)
  'PROPERTY_RESIDENTIAL',      // Variant C
  'PHYSICAL_COMMODITIES',      // Variant D
  'PRECIOUS_METALS_CUSTODIAL', // Variant E
]);

export type AssetClassVariant = z.infer<typeof AssetClassVariantSchema>;

// ─── Variant B Sub-Classification (v2.3 macro-asset extension) ──────────────

export const VariantBSubClassificationSchema = z.enum([
  'VERTICAL_REAL_ESTATE',   // Skyscrapers / high-rise commercial towers
  'CASINO_COMPLEX',         // Entertainment / casino mega-structures
  'INDUSTRIAL_LOGISTICS',   // Warehouses, distribution centres, factories
]);

export type VariantBSubClassification = z.infer<typeof VariantBSubClassificationSchema>;

// ─── Sentinel Verdict Labels (aligned to lib/sentinel-engine.ts) ────────────

export const SentinelVerdictSchema = z.enum([
  'AUTO_APPROVED',
  'PENDING_SOVEREIGN_REVIEW',
  'PENDING_AUTHORIZATION',
  'SOVEREIGN_HOLD',
  'ESCROW_REVIEW',
  'PENDING_PLATFORM_REVIEW',
  'REJECTED',
]);

export type SentinelVerdict = z.infer<typeof SentinelVerdictSchema>;

// ─── Spatial Data Envelope (PLY / Gaussian Splat / BIM metadata) ────────────

export const SpatialDataEnvelopeSchema = z.object({
  has_geometry_coords: z.boolean(),
  scan_format: z.string().min(1),           // e.g. 'PLY_ASCII', 'SPLAT', 'BIM_IFC'
  mesh_density_points: z.number().int().nonnegative(),
  location_anchor: z.string().min(1),       // e.g. GPS coords or address hash
}).strict();

export type SpatialDataEnvelope = z.infer<typeof SpatialDataEnvelopeSchema>;

// ─── Macro-Asset Ingest Metadata ────────────────────────────────────────────

export const MacroAssetMetadataSchema = z.object({
  // Variant B sub-routing
  sub_classification: VariantBSubClassificationSchema,

  // v2.4 — Optional macro-asset metadata fields
  chiller_exhaust_temp: z.number().optional(),
  square_footage_volume: z.number().nonnegative().optional(),
  damper_mechanical_load_kw: z.number().nonnegative().optional(),
  spatial_data_envelope: SpatialDataEnvelopeSchema.optional(),
}).partial({ sub_classification: true }).refine(
  (data) => data.sub_classification !== undefined || true,
  { message: 'sub_classification is recommended for Variant B assets' }
);

export type MacroAssetMetadata = z.infer<typeof MacroAssetMetadataSchema>;

// ─── Full Telemetry Ingest Payload (extended) ───────────────────────────────

export const TelemetryIngestPayloadSchema = z.object({
  node_id: z.string().trim().min(1, 'node_id is required'),
  power_usage_kw: z.number().nonnegative(),
  pue_ratio: z.number().min(1.0, 'pue_ratio must be >= 1.0'),
  carbon_per_trade_g: z.number().nonnegative(),
  grid_intensity_score: z.number().min(0).max(1),
  asset_class: AssetClassVariantSchema.default('PROPERTY_INDUSTRIAL'),
  asset_class_metadata: z.record(z.string(), z.unknown()).optional(),
  macro_asset_metadata: MacroAssetMetadataSchema.optional(),
});

export type TelemetryIngestPayload = z.infer<typeof TelemetryIngestPayloadSchema>;

// ─── Discovery Asset Schema (for test payload simulation) ───────────────────

export const DiscoveryAssetSchema = z.object({
  asset_id: z.string().trim().min(1),
  asset_class: AssetClassVariantSchema,
  sub_classification: VariantBSubClassificationSchema.optional(),
  display_name: z.string().min(1),
  location_label: z.string().min(1),
  initial_verdict: SentinelVerdictSchema.default('PENDING_SOVEREIGN_REVIEW'),
  metadata: MacroAssetMetadataSchema.optional(),
  // v2.4 — discovery tier
  discovery_tier: z.enum(['PENDING_SOVEREIGN_REVIEW', 'AUTO_APPROVED']).default('PENDING_SOVEREIGN_REVIEW'),
});

export type DiscoveryAsset = z.infer<typeof DiscoveryAssetSchema>;

// ─── Sovereign Profile Onboarding Schema (v2.4) ────────────────────────────

export const SovereignProfileOnboardingSchema = z.object({
  streetAddress: z.string().trim().min(1, 'Street address is required'),
  annualUtilityBaseline: z.union([
    z.string().transform((v) => parseFloat(v) || 0),
    z.number(),
  ]).pipe(z.number().nonnegative('Annual utility baseline must be >= 0')),
  // Deferred: monetary appraisal / sovereign-share derivation is NOT collected or
  // exposed in the public deployment. These optional fields remain reserved for a
  // future, partnership-gated tokenization phase and are not populated by onboarding.
  estimatedAppraisalValue: z.union([
    z.string().transform((v) => parseFloat(v) || 0),
    z.number(),
  ]).pipe(z.number().nonnegative('Appraisal value must be >= 0')).optional(),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL']).default('RESIDENTIAL'),
  solanaWallet: z.string().optional(),
  sovereignShareCapacity: z.number().nonnegative().optional(),
  // Telemetry bridge fields
  telemetryBridge: z.string().optional(),
  bmsProtocol: z.enum(['BACNET_IP', 'MODBUS', 'NIAGARA']).optional(),
  targetEndpointUri: z.string().url().optional().or(z.literal('')),
});

export type SovereignProfileOnboarding = z.infer<typeof SovereignProfileOnboardingSchema>;

/**
 * Validate sovereign profile onboarding payload.
 */
export function validateSovereignOnboarding(raw: unknown): {
  success: boolean;
  data?: SovereignProfileOnboarding;
  error?: string;
} {
  const result = SovereignProfileOnboardingSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const messages = result.error.issues.map(
    (i) => `${i.path.join('.')}: ${i.message}`
  );
  return { success: false, error: messages.join('; ') };
}

// ─── Validation Helpers ─────────────────────────────────────────────────────

/**
 * Validate a raw telemetry payload through the Zod pipeline.
 * Returns either the parsed data or a structured error.
 */
export function validateTelemetryPayload(raw: unknown): {
  success: boolean;
  data?: TelemetryIngestPayload;
  error?: string;
} {
  const result = TelemetryIngestPayloadSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const messages = result.error.issues.map(
    (i) => `${i.path.join('.')}: ${i.message}`
  );
  return { success: false, error: messages.join('; ') };
}

/**
 * Validate a discovery asset payload for routing simulation.
 */
export function validateDiscoveryAsset(raw: unknown): {
  success: boolean;
  data?: DiscoveryAsset;
  error?: string;
} {
  const result = DiscoveryAssetSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const messages = result.error.issues.map(
    (i) => `${i.path.join('.')}: ${i.message}`
  );
  return { success: false, error: messages.join('; ') };
}

/**
 * Validate macro-asset metadata in isolation (useful for partial updates).
 */
export function validateMacroAssetMetadata(raw: unknown): {
  success: boolean;
  data?: MacroAssetMetadata;
  error?: string;
} {
  const result = MacroAssetMetadataSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const messages = result.error.issues.map(
    (i) => `${i.path.join('.')}: ${i.message}`
  );
  return { success: false, error: messages.join('; ') };
}
