/**
 * AETHEXER ENERGY GHOST SCAN TARGETS
 * ----------------------------------
 * FRAMING (NON-NEGOTIABLE): MEDIFLO LLC holds NO title, ownership, or equity
 * in any third-party facility listed here. Every entry is displayed STRICTLY as
 * an Aethexer thermal-scan PROSPECT — a public landmark whose thermal envelope
 * has been flagged as a candidate for Aethexer cooling / energy-recovery
 * products. There are NO dollar valuations, NO equity claims, and NO
 * "Sovereign Share" percentages associated with these targets.
 *
 * The numeric fields (thermalWasteKw, carbonGhostMargin) are Aethexer scan
 * PROJECTIONS used for prospecting and product-fit modeling — not verified
 * measured telemetry and not asset valuations.
 */

export type FacilityType =
  | 'glass'
  | 'tower'
  | 'hospitality'
  | 'public'
  | 'data_center'
  | 'industrial';

export type ScanTargetStatus = 'PROSPECT' | 'ACTIVE' | 'CONTRACTED';

export interface EnergyGhostTarget {
  id: string;
  symbol: string;
  name: string;
  category: 'ENERGY_GHOST';
  /** Projected uncaptured thermal waste, in kilowatts (prospecting estimate). */
  thermalWasteKw: number;
  unit: string;
  /** Projected % of energy lost as uncaptured thermal waste (prospecting estimate). */
  carbonGhostMargin: number;
  facilityType: FacilityType[];
  status: ScanTargetStatus;
  verdict: string;
}

export interface AethexerProduct {
  code: string;
  label: string;
  description: string;
}

/** Aethexer product catalog referenced by scan-target recommendations. */
export const AETHEXER_CATALOG: Record<string, AethexerProduct> = {
  SOVEREIGN_SKIN: {
    code: 'SOVEREIGN_SKIN',
    label: 'Sovereign Skin',
    description: 'Aethexer Cooling Skin — Solar Reflectance ≥95-98%, LWIR 8-13μm',
  },
  THERMAL_WRAP: {
    code: 'THERMAL_WRAP',
    label: 'Thermal Wrap',
    description: 'Aethexer Sovereign Skin building wrap — Industrial thermal barrier',
  },
  ENERGY_MAT: {
    code: 'ENERGY_MAT',
    label: 'Energy Mat',
    description: 'Piezoelectric Energy Mat — Generates power from foot traffic',
  },
  WINDOW_TINT: {
    code: 'WINDOW_TINT',
    label: 'Window Tint',
    description: 'Thermal-emitting window film — Glass facades & skyscraper windows',
  },
};

/**
 * Enterprise landmarks flagged as Aethexer thermal-scan PROSPECTS.
 * All entries are PROSPECT status — no ownership or valuation is implied.
 */
export const ENERGY_GHOST_TARGETS: EnergyGhostTarget[] = [
  { id: 'EG-BURJ-01', symbol: 'BURJ-KHALIFA', name: 'Burj Khalifa — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 14200, unit: 'kW', carbonGhostMargin: 34.7, facilityType: ['glass', 'tower'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-MGM-01', symbol: 'MGM-GRAND', name: 'MGM Grand — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 22800, unit: 'kW', carbonGhostMargin: 41.2, facilityType: ['hospitality', 'public'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-ARIA-01', symbol: 'ARIA-RESORT', name: 'Aria Resort — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 19400, unit: 'kW', carbonGhostMargin: 38.5, facilityType: ['hospitality', 'public'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-VEN-01', symbol: 'VENETIAN', name: 'Venetian Resort — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 21100, unit: 'kW', carbonGhostMargin: 39.8, facilityType: ['hospitality', 'public'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-NYSE-01', symbol: 'NYSE-DC', name: 'NYSE Data Center (NJ) — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 18600, unit: 'kW', carbonGhostMargin: 29.3, facilityType: ['data_center'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-AWS-01', symbol: 'AWS-USEAST', name: 'Amazon AWS US-East — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 45000, unit: 'kW', carbonGhostMargin: 22.1, facilityType: ['data_center'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-DXBM-01', symbol: 'DUBAI-MALL', name: 'Dubai Mall — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 16800, unit: 'kW', carbonGhostMargin: 42.0, facilityType: ['glass', 'public'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-CAES-01', symbol: 'CAESARS-PALACE', name: 'Caesars Palace — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 17900, unit: 'kW', carbonGhostMargin: 40.1, facilityType: ['hospitality', 'public'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-POLB-01', symbol: 'PORT-LONG-BEACH', name: 'Port of Long Beach — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 38200, unit: 'kW', carbonGhostMargin: 31.4, facilityType: ['industrial'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-LAX-01', symbol: 'LAX-TERM-B', name: 'LAX Airport Terminal B — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 24600, unit: 'kW', carbonGhostMargin: 36.8, facilityType: ['public', 'glass'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-EATON-01', symbol: 'EATON-PLANT-TX', name: 'Eaton Corporation Plant (TX) — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 11200, unit: 'kW', carbonGhostMargin: 27.5, facilityType: ['industrial'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-SAHARA-01', symbol: 'SAHARA-CASINO', name: 'Sahara Casino — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 9800, unit: 'kW', carbonGhostMargin: 38.2, facilityType: ['hospitality', 'public'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-FONT-01', symbol: 'FONTAINEBLEAU', name: 'Fontainebleau Las Vegas — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 16200, unit: 'kW', carbonGhostMargin: 44.1, facilityType: ['hospitality', 'glass'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-STRAT-01', symbol: 'STRAT-TOWER', name: 'The STRAT Tower — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 7400, unit: 'kW', carbonGhostMargin: 33.6, facilityType: ['tower', 'glass'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-SPHERE-01', symbol: 'SPHERE', name: 'Sphere Entertainment — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 28900, unit: 'kW', carbonGhostMargin: 52.3, facilityType: ['glass', 'public'], status: 'PROSPECT', verdict: 'PROSPECT' },
  { id: 'EG-MOJAVE-01', symbol: 'MOJAVE-SOLAR', name: 'Mojave Solar Farm Array — Thermal Envelope Scan', category: 'ENERGY_GHOST', thermalWasteKw: 8100, unit: 'kW', carbonGhostMargin: 18.9, facilityType: ['industrial'], status: 'PROSPECT', verdict: 'PROSPECT' },
];

/**
 * Server-side product recommendation logic for Aethexer scan targets.
 * - thermalWasteKw > 5000        → SOVEREIGN_SKIN + THERMAL_WRAP
 * - facilityType public/hospitality → + ENERGY_MAT
 * - facilityType glass/tower     → + WINDOW_TINT
 */
export function recommendAethexerProducts(target: Pick<EnergyGhostTarget, 'thermalWasteKw' | 'facilityType'>): string[] {
  const rec = new Set<string>();
  if (target.thermalWasteKw > 5000) {
    rec.add('SOVEREIGN_SKIN');
    rec.add('THERMAL_WRAP');
  }
  if (target.facilityType.includes('public') || target.facilityType.includes('hospitality')) {
    rec.add('ENERGY_MAT');
  }
  if (target.facilityType.includes('glass') || target.facilityType.includes('tower')) {
    rec.add('WINDOW_TINT');
  }
  return Array.from(rec);
}

/** Full scan target enriched with server-computed product recommendations. */
export interface EnrichedScanTarget extends EnergyGhostTarget {
  recommended: string[];
  recommendedProducts: AethexerProduct[];
  onboardingLink: string;
}

export function getEnrichedScanTargets(): EnrichedScanTarget[] {
  return ENERGY_GHOST_TARGETS.map((t) => {
    const recommended = recommendAethexerProducts(t);
    return {
      ...t,
      recommended,
      recommendedProducts: recommended.map((code) => AETHEXER_CATALOG[code]).filter(Boolean),
      onboardingLink: '/onboarding',
    };
  });
}
