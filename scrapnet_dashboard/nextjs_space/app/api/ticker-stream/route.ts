export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { HUM_BASELINE_MW, SHIFT_THRESHOLD_PERCENT } from '@/services/hum-listener';

/**
 * SSE endpoint — streams live macro-asset telemetry to the cockpit ticker.
 * Produces a JSON frame every 3–5s with jittered readings for all 12
 * seeded assets.  When any exchange value shifts ≥5% from its baseline,
 * a "hum_anchor" event is emitted so the client can show the chain event.
 *
 * Digital Hum tracker: 74,088t CO₂e/day across tracked exchanges.
 */

interface AssetSeed {
  id: string;
  symbol: string;
  name: string;
  category: 'EXCHANGE' | 'SKYSCRAPER' | 'CASINO';
  baseValue: number;
  unit: string;
  verdict: string;
  sub_classification?: string;
}

const ASSETS: AssetSeed[] = [
  { id: 'NYSE-01', symbol: 'NYSE-01', name: 'New York Stock Exchange', category: 'EXCHANGE', baseValue: 18420.5, unit: 'MW', verdict: 'AUTO_APPROVED' },
  { id: 'NASDAQ-01', symbol: 'NASDAQ-01', name: 'Nasdaq Composite', category: 'EXCHANGE', baseValue: 14205.8, unit: 'MW', verdict: 'AUTO_APPROVED' },
  { id: 'LSE-01', symbol: 'LSE-01', name: 'London Stock Exchange', category: 'EXCHANGE', baseValue: 8840.2, unit: 'MW', verdict: 'AUTO_APPROVED' },
  { id: 'CME-01', symbol: 'CME-01', name: 'Chicago Mercantile Exchange', category: 'EXCHANGE', baseValue: 6120.0, unit: 'MW', verdict: 'AUTO_APPROVED' },
  { id: 'EUREX-01', symbol: 'EUREX-01', name: 'Eurex Exchange', category: 'EXCHANGE', baseValue: 4250.6, unit: 'MW', verdict: 'AUTO_APPROVED' },
  { id: 'BURJ-DXB-001', symbol: 'BURJ-DXB-001', name: 'Burj Khalifa — Dubai', category: 'SKYSCRAPER', baseValue: 36800, unit: 'kW', verdict: 'PENDING_SOVEREIGN_REVIEW', sub_classification: 'VERTICAL_REAL_ESTATE' },
  { id: 'TAI-101-TPE', symbol: 'TAI-101-TPE', name: 'Taipei 101 — Taiwan', category: 'SKYSCRAPER', baseValue: 22500, unit: 'kW', verdict: 'PENDING_SOVEREIGN_REVIEW', sub_classification: 'VERTICAL_REAL_ESTATE' },
  { id: 'OWT-NYC-001', symbol: 'OWT-NYC-001', name: 'One World Trade — NYC', category: 'SKYSCRAPER', baseValue: 28400, unit: 'kW', verdict: 'PENDING_SOVEREIGN_REVIEW', sub_classification: 'VERTICAL_REAL_ESTATE' },
  { id: 'SHA-TWR-001', symbol: 'SHA-TWR-001', name: 'Shanghai Tower — PRC', category: 'SKYSCRAPER', baseValue: 34200, unit: 'kW', verdict: 'PENDING_SOVEREIGN_REVIEW', sub_classification: 'VERTICAL_REAL_ESTATE' },
  { id: 'MGM-LV-01', symbol: 'MGM-LV-01', name: 'MGM Grand — Las Vegas', category: 'CASINO', baseValue: 42500, unit: 'kW', verdict: 'PENDING_SOVEREIGN_REVIEW', sub_classification: 'CASINO_COMPLEX' },
  { id: 'VEN-MAC-01', symbol: 'VEN-MAC-01', name: 'The Venetian — Macau', category: 'CASINO', baseValue: 38900, unit: 'kW', verdict: 'PENDING_SOVEREIGN_REVIEW', sub_classification: 'CASINO_COMPLEX' },
  { id: 'MBS-SGP-01', symbol: 'MBS-SGP-01', name: 'Marina Bay Sands — Singapore', category: 'CASINO', baseValue: 35600, unit: 'kW', verdict: 'PENDING_SOVEREIGN_REVIEW', sub_classification: 'CASINO_COMPLEX' },
];

// Track cumulative drift for anchor detection
const driftState: Record<string, number> = {};

function jitter(base: number, category: string): { value: number; change: number; changePercent: number } {
  const vol = category === 'EXCHANGE' ? 0.003 : 0.0015;
  const delta = base * (Math.random() * vol * 2 - vol);
  const value = Math.max(0, base + delta);
  return {
    value: Math.round(value * 100) / 100,
    change: Math.round(delta * 100) / 100,
    changePercent: Math.round((delta / base) * 10000) / 100,
  };
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { cancelled = true; }
      };

      // Send initial state
      const initial = ASSETS.map((a) => {
        const j = jitter(a.baseValue, a.category);
        driftState[a.id] = j.value;
        return { ...a, ...j, lastUpdated: Date.now() };
      });
      send('ticker', { assets: initial, humBaselineMw: HUM_BASELINE_MW, co2eDaily: 74088 });

      // Stream loop: 3–5s intervals
      const tick = () => {
        if (cancelled) return;
        const assets = ASSETS.map((a) => {
          const j = jitter(a.baseValue, a.category);
          const prev = driftState[a.id] || a.baseValue;
          const shiftPct = Math.abs((j.value - prev) / prev) * 100;
          driftState[a.id] = j.value;

          // Check for HUM anchor trigger (5% shift from last anchor)
          if (a.category === 'EXCHANGE' && shiftPct >= SHIFT_THRESHOLD_PERCENT) {
            send('hum_anchor', {
              assetId: a.id,
              shiftPercent: Math.round(shiftPct * 100) / 100,
              baselineMw: HUM_BASELINE_MW,
              currentMw: j.value,
              timestamp: new Date().toISOString(),
            });
          }

          return { ...a, ...j, lastUpdated: Date.now() };
        });
        send('ticker', { assets, humBaselineMw: HUM_BASELINE_MW, co2eDaily: 74088 });

        // Random 3–5s delay
        const delay = 3000 + Math.random() * 2000;
        setTimeout(tick, delay);
      };

      // Start after initial 3s
      setTimeout(tick, 3000);

      // Handle abort
      req.signal.addEventListener('abort', () => {
        cancelled = true;
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
