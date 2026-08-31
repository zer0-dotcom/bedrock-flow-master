export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  executeDynamicBpsSplit,
  assertBpsIntegrity,
} from '@/lib/universal-law';
import { getBpsConfig } from '@/lib/bps-config';

/**
 * DYNAMIC BPS SETTLEMENT EXECUTOR API — BACKEND-SILENT
 *
 * Executes a dust-free settlement split using the live operator-configured BPS
 * table (see lib/bps-config.ts). The historic hardcoded 70/20/10 split is
 * DEPRECATED — nothing here hardcodes percentages, and `netYieldUi` is COMPUTED
 * from the live EARNER leg against the gross settlement (never a fixed 0.7).
 *
 * SANITIZED ENVELOPE CONTRACT (non-negotiable):
 *   The client-facing response returns ONLY high-level fields:
 *     - status
 *     - netYieldUi        (computed EARNER leg / gross, sanitized number)
 *     - verificationStatus
 *     - settlementTimestamp
 *   The BPS table, individual leg splits (lamport amounts), and vault addresses
 *   are computed server-side and are NEVER serialized to the client.
 *
 * CIRCUIT BREAKERS (must both hold before any split is returned):
 *   1. EXITZ / settlement window guard — a hard kill-switch. When tripped, no
 *      settlement executes (HTTP 503).
 *   2. assertBpsIntegrity() — the immutable 10,000 BPS floor. Hard-throws
 *      inside executeDynamicBpsSplit() (and pre-checked here) on any deviation.
 */

/**
 * EXITZ / settlement window guard. Trips (returns false) when the operator has
 * engaged the kill-switch via env, halting all settlement execution. Defaults
 * to OPEN (settlement allowed) so normal operation is unaffected.
 */
function isSettlementWindowOpen(): { open: boolean; reason?: string } {
  const breaker = (process.env.EXITZ_CIRCUIT_BREAKER || '').toLowerCase();
  if (breaker === 'true' || breaker === '1' || breaker === 'tripped' || breaker === 'open') {
    return { open: false, reason: 'EXITZ circuit breaker engaged — settlement halted.' };
  }
  const windowGuard = (process.env.SETTLEMENT_WINDOW || 'open').toLowerCase();
  if (windowGuard === 'closed' || windowGuard === 'locked') {
    return { open: false, reason: 'Settlement window is closed.' };
  }
  return { open: true };
}

/** Sanitize a number for client exposure (finite, non-negative, 6-dp). */
function sanitizeNumber(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 1e6) / 1e6;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Accept gross in lamports (preferred) or a generic gross amount.
    const rawGross = body.grossLamports ?? body.gross ?? body.grossAmount;
    const grossLamports = Math.floor(Number(rawGross));

    if (!Number.isFinite(grossLamports) || grossLamports <= 0) {
      return NextResponse.json(
        { status: 'REJECTED', error: 'grossLamports must be a positive number' },
        { status: 400 }
      );
    }

    // ── CIRCUIT BREAKER 1: EXITZ / settlement window guard ──────────────
    const windowState = isSettlementWindowOpen();
    if (!windowState.open) {
      return NextResponse.json(
        { status: 'HALTED', reason: windowState.reason },
        { status: 503 }
      );
    }

    // ── Load the live operator-configured BPS table (server-side only) ──
    const bpsConfig = getBpsConfig();

    // ── CIRCUIT BREAKER 2: immutable 10,000 BPS floor ──────────────────
    // Pre-check so a violation returns a clean 422 rather than a 500. The
    // executor also re-asserts internally (canon runs first there too).
    try {
      assertBpsIntegrity(bpsConfig);
    } catch (integrityErr) {
      return NextResponse.json(
        {
          status: 'REJECTED',
          error:
            integrityErr instanceof Error ? integrityErr.message : 'BPS integrity violation',
        },
        { status: 422 }
      );
    }

    // ── Execute the dust-free dynamic split (BACKEND-SILENT) ───────────
    // `split` holds the BPS table + per-leg lamport amounts. It is used ONLY
    // to derive the sanitized envelope below and is NEVER returned to the
    // client.
    const split = executeDynamicBpsSplit(grossLamports, bpsConfig);

    // netYieldUi = live EARNER leg / gross (computed, not a fixed 0.7).
    const netYieldUi = sanitizeNumber(split.earnerLamports / split.grossLamports);

    // ── SANITIZED ENVELOPE — the only thing that leaves the API ────────
    return NextResponse.json({
      status: 'SETTLED',
      netYieldUi,
      verificationStatus: 'VERIFIED',
      settlementTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Settlement/Execute] Error:', error);
    return NextResponse.json(
      {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Settlement execution failed',
      },
      { status: 500 }
    );
  }
}
