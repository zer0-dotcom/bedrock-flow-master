/**
 * BEDROCK ESG — DYNAMIC BPS CONFIGURATION (single source of truth)
 *
 * The historic settlement split was a hardcoded Dynamic BPS (EARNER 7000 /
 * NODE 2000 / DEPIN 1000 basis points). That is now DEPRECATED: every split
 * value is operator-configured at runtime via environment variables, and the
 * ONLY immutable floor is that all legs must sum to exactly 10,000 BPS.
 *
 * NOTHING in the UI or API may hardcode the percentages — they must all read
 * the live table through `getBpsConfig()` / `getBpsTable()`.
 *
 * Operator-set environment variables (all optional; safe defaults applied):
 *   BPS_EARNER      integer basis points for the EARNER (asset sovereign) leg
 *   BPS_NODE        integer basis points for the NODE (platform processor) leg
 *   BPS_DEPIN       integer basis points for the DEPIN (public resilience) leg
 *   BPS_CUSTOM_LEGS JSON array of extra named legs, e.g.
 *                   '[{"name":"GRID_REBATE","bps":250}]'
 *
 * If the operator-supplied values do not sum to 10,000 BPS (or are malformed),
 * this module logs a warning and falls back to the safe canonical default so
 * the platform never boots with an invalid split table. The hard-throwing
 * enforcement of the 10,000 floor at settlement time lives in
 * `assertBpsIntegrity()` in `lib/universal-law.ts`.
 */

export interface BpsCustomLeg {
  name: string;
  bps: number;
}

export interface BpsDistributionConfig {
  earnerBps: number;
  nodeBps: number;
  depinBps: number;
  /** Optional additional named legs. Their bps count toward the 10,000 total. */
  customLegs?: BpsCustomLeg[];
}

/** Canonical, always-valid fallback (sums to exactly 10,000). */
export const DEFAULT_BPS_CONFIG: BpsDistributionConfig = {
  earnerBps: 7000,
  nodeBps: 2000,
  depinBps: 1000,
};

export const BPS_TOTAL_FLOOR = 10000;

function sumConfig(config: BpsDistributionConfig): number {
  const custom = (config.customLegs ?? []).reduce((s, leg) => s + (Number(leg.bps) || 0), 0);
  return config.earnerBps + config.nodeBps + config.depinBps + custom;
}

function parseIntEnv(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === null || raw.trim() === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

function parseCustomLegs(raw: string | undefined): BpsCustomLeg[] | undefined {
  if (!raw || raw.trim() === '') return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    const legs = parsed
      .filter((l) => l && typeof l.name === 'string' && Number.isInteger(Number(l.bps)))
      .map((l) => ({ name: String(l.name), bps: Number(l.bps) }));
    return legs.length > 0 ? legs : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Single source of runtime BPS config. Reads operator-set env values and
 * guarantees a valid 10,000-sum table (falls back to the canonical default if
 * the operator values are invalid or do not sum to the floor).
 */
export function getBpsConfig(): BpsDistributionConfig {
  const candidate: BpsDistributionConfig = {
    earnerBps: parseIntEnv(process.env.BPS_EARNER, DEFAULT_BPS_CONFIG.earnerBps),
    nodeBps: parseIntEnv(process.env.BPS_NODE, DEFAULT_BPS_CONFIG.nodeBps),
    depinBps: parseIntEnv(process.env.BPS_DEPIN, DEFAULT_BPS_CONFIG.depinBps),
    customLegs: parseCustomLegs(process.env.BPS_CUSTOM_LEGS),
  };

  const total = sumConfig(candidate);
  if (total !== BPS_TOTAL_FLOOR) {
    // Never boot with an invalid split table — fall back to the safe canon.
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        `[bps-config] Operator BPS table sums to ${total}, expected ${BPS_TOTAL_FLOOR}. ` +
          'Falling back to the canonical default (7000/2000/1000).'
      );
    }
    return { ...DEFAULT_BPS_CONFIG };
  }

  return candidate;
}

export interface BpsTableLeg {
  name: string;
  bps: number;
  /** Human-readable percentage derived from bps (bps / 100). */
  percent: number;
}

export interface BpsTable {
  earnerBps: number;
  nodeBps: number;
  depinBps: number;
  customLegs: BpsCustomLeg[];
  totalBps: number;
  /** Derived percentages for display — never hardcode these in UI/API. */
  earnerPct: number;
  nodePct: number;
  depinPct: number;
  legs: BpsTableLeg[];
  /** Convenience label, e.g. "Dynamic BPS" derived dynamically. */
  label: string;
}

/**
 * Derived, display-friendly view of the live config. Safe to serialize to the
 * client — this is the OPERATOR-CONFIGURED PERCENTAGE TABLE only, never the
 * per-settlement leg amounts or vault addresses (those stay backend-silent).
 */
export function getBpsTable(config: BpsDistributionConfig = getBpsConfig()): BpsTable {
  const customLegs = config.customLegs ?? [];
  const legs: BpsTableLeg[] = [
    { name: 'EARNER', bps: config.earnerBps, percent: config.earnerBps / 100 },
    { name: 'NODE', bps: config.nodeBps, percent: config.nodeBps / 100 },
    { name: 'DEPIN', bps: config.depinBps, percent: config.depinBps / 100 },
    ...customLegs.map((l) => ({ name: l.name, bps: l.bps, percent: l.bps / 100 })),
  ];
  return {
    earnerBps: config.earnerBps,
    nodeBps: config.nodeBps,
    depinBps: config.depinBps,
    customLegs,
    totalBps: sumConfig(config),
    earnerPct: config.earnerBps / 100,
    nodePct: config.nodeBps / 100,
    depinPct: config.depinBps / 100,
    legs,
    label: `${config.earnerBps / 100}/${config.nodeBps / 100}/${config.depinBps / 100}`,
  };
}
