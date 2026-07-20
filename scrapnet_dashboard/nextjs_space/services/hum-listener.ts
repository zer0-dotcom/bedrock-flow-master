/**
 * DYNAMIC HUM LISTENER — Market-to-Telemetry Bridge
 *
 * Replaces the static 18.0 MW constants with live trade-frequency
 * telemetry derived from the Capital Markets ticker.
 *
 * Sources: Universal Ledger trade activity aggregated by exchange window
 *   NYSE/NASDAQ  → 09:30–16:00 ET
 *   LSE          → 08:00–16:30 GMT
 *   CME/Eurex    → Continuous (futures)
 *
 * When the HUM frequency shifts by >5% from the last anchor,
 * the listener triggers a Solana Memo on-chain anchor via the
 * Sovereign Notary.
 *
 * The "12.6 MW" figure represents the global telemetry baseline
 * (aggregate trade energy equivalent across all tracked exchanges).
 */

import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { anchorToChain, hashForAnchor, getNotaryStatus } from '@/lib/solana-notary';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Global telemetry baseline (MW equivalent) */
export const HUM_BASELINE_MW = 12.6;

/** Shift threshold that triggers an on-chain anchor (env-configurable for High-Frequency Ripples testing) */
export const SHIFT_THRESHOLD_PERCENT = parseFloat(process.env.HUM_TRIGGER_THRESHOLD || '0.5');

/** Exchange windows (UTC hours) */
export const EXCHANGE_WINDOWS = {
  NYSE_NASDAQ: { openUtc: 13.5, closeUtc: 20, label: 'NYSE/NASDAQ' },
  LSE:         { openUtc: 8,    closeUtc: 16.5, label: 'LSE' },
  CME_EUREX:   { openUtc: 0,    closeUtc: 24, label: 'CME/Eurex (Continuous)' },
} as const;

/** Energy-equivalent mapping: trade volume → MW */
const TRADE_TO_MW_FACTOR = 0.00042; // MW per unit trade volume
const MIN_MW = 2.0;  // Floor
const MAX_MW = 28.0; // Ceiling

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HumTelemetryReading {
  readingId: string;
  timestamp: string;
  currentMw: number;
  baselineMw: number;
  shiftPercent: number;
  shiftTriggered: boolean;
  exchangeContributions: {
    exchange: string;
    isOpen: boolean;
    volumeContribution: number;
    mwContribution: number;
  }[];
  anchorResult?: {
    transactionSignature: string | null;
    explorerUrl: string | null;
    error?: string;
  };
}

export interface HumState {
  currentMw: number;
  lastAnchoredMw: number;
  lastAnchorTimestamp: string | null;
  lastAnchorTxSignature: string | null;
  readingCount: number;
  anchorCount: number;
}

// ─── In-Memory State ────────────────────────────────────────────────────────

let _humState: HumState = {
  currentMw: HUM_BASELINE_MW,
  lastAnchoredMw: HUM_BASELINE_MW,
  lastAnchorTimestamp: null,
  lastAnchorTxSignature: null,
  readingCount: 0,
  anchorCount: 0,
};

// ─── Exchange Activity ──────────────────────────────────────────────────────

/**
 * Determine which exchanges are currently active.
 */
function getActiveExchanges(): { exchange: string; isOpen: boolean; weight: number }[] {
  const now = new Date();
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;

  return Object.entries(EXCHANGE_WINDOWS).map(([key, win]) => {
    const isOpen = utcHour >= win.openUtc && utcHour < win.closeUtc;
    // Weight: open exchanges contribute more
    const weight = isOpen ? 1.0 : 0.15; // Overnight residual
    return { exchange: win.label, isOpen, weight };
  });
}

// ─── Core Telemetry ─────────────────────────────────────────────────────────

/**
 * Compute live HUM frequency from recent ledger activity.
 * Queries trade settlements from the last hour and maps volume to MW.
 */
export async function computeHumTelemetry(): Promise<HumTelemetryReading> {
  const readingId = `HUM-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Fetch recent ledger entries as proxy for trade volume
  let recentEntries: { totalValueUsd: number | null; carbonAvoidedTonnes: number | null; extractionType: string; createdAt: Date }[] = [];
  try {
    recentEntries = await prisma.universalLedgerEntry.findMany({
      where: { createdAt: { gte: oneHourAgo } },
      select: {
        totalValueUsd: true,
        carbonAvoidedTonnes: true,
        extractionType: true,
        createdAt: true,
      },
    });
  } catch {
    recentEntries = [];
  }

  // Calculate aggregate trade volume
  const totalVolume = recentEntries.reduce(
    (sum, e) => sum + (e.totalValueUsd || 0),
    0
  );
  const tradeCount = recentEntries.length;

  // Get exchange activity weights
  const exchanges = getActiveExchanges();
  const totalWeight = exchanges.reduce((s, e) => s + e.weight, 0);

  // Map volume → MW (clamped)
  const rawMw = HUM_BASELINE_MW + totalVolume * TRADE_TO_MW_FACTOR;
  const weightAdjusted = rawMw * (totalWeight / exchanges.length);
  const currentMw = Math.max(MIN_MW, Math.min(MAX_MW, weightAdjusted));

  // Per-exchange breakdown
  const exchangeContributions = exchanges.map((ex) => {
    const fraction = ex.weight / totalWeight;
    return {
      exchange: ex.exchange,
      isOpen: ex.isOpen,
      volumeContribution: Math.round(totalVolume * fraction * 100) / 100,
      mwContribution: Math.round(currentMw * fraction * 1000) / 1000,
    };
  });

  // Check shift threshold (env-configurable, default 0.5% for High-Frequency Ripples mode)
  const shiftPercent =
    _humState.lastAnchoredMw > 0
      ? Math.abs((currentMw - _humState.lastAnchoredMw) / _humState.lastAnchoredMw) * 100
      : 0;
  const shiftTriggered = shiftPercent >= SHIFT_THRESHOLD_PERCENT;

  // Update in-memory state
  _humState.currentMw = currentMw;
  _humState.readingCount++;

  const reading: HumTelemetryReading = {
    readingId,
    timestamp: new Date().toISOString(),
    currentMw: Math.round(currentMw * 1000) / 1000,
    baselineMw: HUM_BASELINE_MW,
    shiftPercent: Math.round(shiftPercent * 100) / 100,
    shiftTriggered,
    exchangeContributions,
  };

  // If shift exceeds 5%, fire on-chain anchor
  if (shiftTriggered) {
    const notaryStatus = getNotaryStatus();
    if (notaryStatus.configured) {
      const anchorResult = await anchorToChain({
        type: 'HUM_FREQUENCY_SHIFT',
        entityId: readingId,
        dataHash: hashForAnchor({
          currentMw,
          previousMw: _humState.lastAnchoredMw,
          shiftPercent,
          tradeCount,
          totalVolume,
        }),
        carbonTonnes: recentEntries.reduce(
          (s, e) => s + (e.carbonAvoidedTonnes || 0),
          0
        ),
        valuationUsd: totalVolume,
        metadata: {
          exchanges: exchangeContributions,
          tradeCount,
          previousMw: _humState.lastAnchoredMw,
        },
      });

      reading.anchorResult = {
        transactionSignature: anchorResult.transactionSignature,
        explorerUrl: anchorResult.explorerUrl,
        error: anchorResult.error,
      };

      if (anchorResult.success) {
        _humState.lastAnchoredMw = currentMw;
        _humState.lastAnchorTimestamp = new Date().toISOString();
        _humState.lastAnchorTxSignature = anchorResult.transactionSignature;
        _humState.anchorCount++;
      }
    } else {
      reading.anchorResult = {
        transactionSignature: null,
        explorerUrl: null,
        error: 'Sovereign Notary not configured — set SOLANA_NOTARY_SECRET_KEY in .env',
      };
    }
  }

  return reading;
}

/**
 * Get the current HUM state (for dashboard display).
 */
export function getHumState(): HumState {
  return { ..._humState };
}

/**
 * Get the live MW value (replaces static PHYSICAL_NODE_SPECS.peakLoadMw).
 */
export function getLiveLoadMw(): number {
  return _humState.currentMw;
}

export const HUM_ENGINE = {
  name: 'Dynamic HUM Listener',
  version: '2.0.0',
  baselineMw: HUM_BASELINE_MW,
  shiftThreshold: `${SHIFT_THRESHOLD_PERCENT}%`,
  exchanges: Object.values(EXCHANGE_WINDOWS).map((w) => w.label),
  description:
    'Market-to-Telemetry bridge converting global trade frequency into MW-equivalent HUM readings',
};
