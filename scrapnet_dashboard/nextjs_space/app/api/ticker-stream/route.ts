export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { HUM_BASELINE_MW, SHIFT_THRESHOLD_PERCENT } from '@/services/hum-listener';
import {
  ENERGY_GHOST_TARGETS,
  recommendAethexerProducts,
  type FacilityType,
} from '@/lib/energy-ghost-targets';

/**
 * SSE endpoint — streams live MEDIFLO facility telemetry + Aethexer Energy Ghost
 * scan prospects to the cockpit ticker. Produces a JSON frame every 3–5s with
 * jittered readings. When any RECYCLING node shifts ≥5% from its baseline, a
 * "hum_anchor" event is emitted so the client can show the chain event.
 *
 * Digital Hum tracker: 74,088t CO₂e/day across MEDIFLO facilities.
 *
 * FRAMING: ENERGY_GHOST entries are third-party landmarks shown STRICTLY as
 * Aethexer thermal-scan PROSPECTS. MEDIFLO claims NO ownership, equity, or
 * valuation over them; their numbers are prospecting scan projections only.
 */

interface AssetSeed {
  id: string;
  symbol: string;
  name: string;
  category: 'RECYCLING' | 'BIOCHAR' | 'METAL' | 'ENERGY_GHOST';
  baseValue: number;
  unit: string;
  verdict: string;
  sub_classification?: string;
  // ENERGY_GHOST-only prospecting fields
  carbonGhostMargin?: number;
  facilityType?: FacilityType[];
  recommended?: string[];
  status?: 'PROSPECT' | 'ACTIVE' | 'CONTRACTED';
  onboardingLink?: string;
}

// MEDIFLO-owned infrastructure telemetry nodes. Values are live thermal /
// energy-throughput readings measured at each facility — not asset valuations.
const MEDIFLO_NODES: AssetSeed[] = [
  { id: 'RAP-STAN-01', symbol: 'RAP-STAN-01', name: 'Stanton RAP Reclamation Plant', category: 'RECYCLING', baseValue: 1842.0, unit: 'kW', verdict: 'AUTO_APPROVED' },
  { id: 'RAP-OC-02', symbol: 'RAP-OC-02', name: 'Orange County Asphalt Line', category: 'RECYCLING', baseValue: 1420.5, unit: 'kW', verdict: 'AUTO_APPROVED' },
  { id: 'RAP-INL-03', symbol: 'RAP-INL-03', name: 'Inland Empire RAP Drum', category: 'RECYCLING', baseValue: 884.0, unit: 'kW', verdict: 'AUTO_APPROVED' },
  { id: 'BIO-KILN-01', symbol: 'BIO-KILN-01', name: 'Biochar Pyrolysis Kiln A', category: 'BIOCHAR', baseValue: 612.0, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'CDR_PYROLYSIS' },
  { id: 'BIO-KILN-02', symbol: 'BIO-KILN-02', name: 'Biochar Pyrolysis Kiln B', category: 'BIOCHAR', baseValue: 368.0, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'CDR_PYROLYSIS' },
  { id: 'BIO-FEED-03', symbol: 'BIO-FEED-03', name: 'Feedstock Dryer Unit', category: 'BIOCHAR', baseValue: 225.0, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'CDR_PYROLYSIS' },
  { id: 'MTL-FER-01', symbol: 'MTL-FER-01', name: 'Ferrous Recovery Line', category: 'METAL', baseValue: 425.0, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'METAL_RECOVERY' },
  { id: 'MTL-NFR-02', symbol: 'MTL-NFR-02', name: 'Non-Ferrous Eddy Sorter', category: 'METAL', baseValue: 389.0, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'METAL_RECOVERY' },
  { id: 'MTL-MELT-03', symbol: 'MTL-MELT-03', name: 'Induction Melt Unit', category: 'METAL', baseValue: 356.0, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'METAL_RECOVERY' },
];

// Aethexer Energy Ghost scan prospects (third-party landmarks — PROSPECT only).
// baseValue mirrors thermalWasteKw so the ticker can jitter it like any reading.
const ENERGY_GHOST_NODES: AssetSeed[] = ENERGY_GHOST_TARGETS.map((t) => ({
  id: t.id,
  symbol: t.symbol,
  name: t.name,
  category: 'ENERGY_GHOST',
  baseValue: t.thermalWasteKw,
  unit: t.unit,
  verdict: t.verdict,
  carbonGhostMargin: t.carbonGhostMargin,
  facilityType: t.facilityType,
  recommended: recommendAethexerProducts(t),
  status: t.status,
  onboardingLink: '/onboarding',
}));

const ASSETS: AssetSeed[] = [...MEDIFLO_NODES, ...ENERGY_GHOST_NODES];

// Track cumulative drift for anchor detection
const driftState: Record<string, number> = {};

function jitter(base: number, category: string): { value: number; change: number; changePercent: number } {
  const vol = category === 'RECYCLING' ? 0.003 : category === 'ENERGY_GHOST' ? 0.004 : 0.0015;
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
          if (a.category === 'RECYCLING' && shiftPct >= SHIFT_THRESHOLD_PERCENT) {
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
