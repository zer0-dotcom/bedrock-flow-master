'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Building2,
  Landmark,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Activity,
  Flame,
} from 'lucide-react';
import {
  ENERGY_GHOST_TARGETS,
  recommendAethexerProducts,
} from '@/lib/energy-ghost-targets';

// ─── Types ────────────────────────────────────────────────────────────────

type TickerCategory = 'RECYCLING' | 'BIOCHAR' | 'METAL' | 'ENERGY_GHOST';
type FilterTab = 'ALL' | 'RECYCLING' | 'BIOCHAR' | 'METAL' | 'ENERGY_GHOST';

interface TickerItem {
  id: string;
  symbol: string;
  name: string;
  category: TickerCategory;
  value: number;
  change: number;
  changePercent: number;
  unit: string;
  verdict: string;
  sub_classification?: string;
  lastUpdated: number;
  // ENERGY_GHOST-only prospecting fields
  carbonGhostMargin?: number;
  facilityType?: string[];
  recommended?: string[];
  status?: 'PROSPECT' | 'ACTIVE' | 'CONTRACTED';
}

// ─── Seed Data (MEDIFLO facility telemetry nodes) ─────────

const SEED_TICKER_ITEMS: TickerItem[] = [
  // MEDIFLO-owned infrastructure telemetry nodes.
  // Values are live thermal / energy-throughput readings per facility — not asset valuations.
  // Reclaimed Asphalt (RAP) recycling
  { id: 'RAP-STAN-01', symbol: 'RAP-STAN-01', name: 'Stanton RAP Reclamation Plant', category: 'RECYCLING', value: 1842.00, change: 12.70, changePercent: 0.69, unit: 'kW', verdict: 'AUTO_APPROVED', lastUpdated: Date.now() },
  { id: 'RAP-OC-02', symbol: 'RAP-OC-02', name: 'Orange County Asphalt Line', category: 'RECYCLING', value: 1420.50, change: -4.20, changePercent: -0.30, unit: 'kW', verdict: 'AUTO_APPROVED', lastUpdated: Date.now() },
  { id: 'RAP-INL-03', symbol: 'RAP-INL-03', name: 'Inland Empire RAP Drum', category: 'RECYCLING', value: 884.00, change: 5.60, changePercent: 0.64, unit: 'kW', verdict: 'AUTO_APPROVED', lastUpdated: Date.now() },
  // Biochar / Carbon Dioxide Removal
  { id: 'BIO-KILN-01', symbol: 'BIO-KILN-01', name: 'Biochar Pyrolysis Kiln A', category: 'BIOCHAR', value: 612.00, change: 4.10, changePercent: 0.67, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'CDR_PYROLYSIS', lastUpdated: Date.now() },
  { id: 'BIO-KILN-02', symbol: 'BIO-KILN-02', name: 'Biochar Pyrolysis Kiln B', category: 'BIOCHAR', value: 368.00, change: 2.45, changePercent: 0.67, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'CDR_PYROLYSIS', lastUpdated: Date.now() },
  { id: 'BIO-FEED-03', symbol: 'BIO-FEED-03', name: 'Feedstock Dryer Unit', category: 'BIOCHAR', value: 225.00, change: -1.80, changePercent: -0.79, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'CDR_PYROLYSIS', lastUpdated: Date.now() },
  // Metal recovery
  { id: 'MTL-FER-01', symbol: 'MTL-FER-01', name: 'Ferrous Recovery Line', category: 'METAL', value: 425.00, change: 5.20, changePercent: 1.24, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'METAL_RECOVERY', lastUpdated: Date.now() },
  { id: 'MTL-NFR-02', symbol: 'MTL-NFR-02', name: 'Non-Ferrous Eddy Sorter', category: 'METAL', value: 389.00, change: -2.10, changePercent: -0.54, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'METAL_RECOVERY', lastUpdated: Date.now() },
  { id: 'MTL-MELT-03', symbol: 'MTL-MELT-03', name: 'Induction Melt Unit', category: 'METAL', value: 356.00, change: 1.48, changePercent: 0.42, unit: 'kW', verdict: 'AUTO_APPROVED', sub_classification: 'METAL_RECOVERY', lastUpdated: Date.now() },
  // Aethexer Energy Ghost scan PROSPECTS (third-party landmarks — no ownership,
  // no valuation implied). Seeded from the shared prospect catalog.
  ...ENERGY_GHOST_TARGETS.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    name: t.name,
    category: 'ENERGY_GHOST' as TickerCategory,
    value: t.thermalWasteKw,
    change: 0,
    changePercent: 0,
    unit: t.unit,
    verdict: t.verdict,
    carbonGhostMargin: t.carbonGhostMargin,
    facilityType: t.facilityType,
    recommended: recommendAethexerProducts(t),
    status: t.status,
    lastUpdated: Date.now(),
  })),
];

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'ALL' },
  { key: 'RECYCLING', label: 'RECYCLING' },
  { key: 'BIOCHAR', label: 'BIOCHAR' },
  { key: 'METAL', label: 'METAL' },
  { key: 'ENERGY_GHOST', label: 'ENERGY GHOST' },
];

const CATEGORY_FILTER_MAP: Record<FilterTab, TickerCategory[] | null> = {
  ALL: null,
  RECYCLING: ['RECYCLING'],
  BIOCHAR: ['BIOCHAR'],
  METAL: ['METAL'],
  ENERGY_GHOST: ['ENERGY_GHOST'],
};

// ─── Micro-simulation: jitter values for live-feel ────────────────────────

function jitterItem(item: TickerItem): TickerItem {
  const volatility = item.category === 'RECYCLING' ? 0.002 : 0.001;
  const delta = item.value * (Math.random() * volatility * 2 - volatility);
  const newValue = Math.max(0, item.value + delta);
  const newChange = item.change + delta;
  const newPercent = (newChange / (newValue - newChange)) * 100;
  return {
    ...item,
    value: newValue,
    change: newChange,
    changePercent: newPercent,
    lastUpdated: Date.now(),
  };
}

// ─── Component ────────────────────────────────────────────────────────────

export default function CockpitTicker() {
  const [items, setItems] = useState<TickerItem[]>(SEED_TICKER_ITEMS);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track which items flashed
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [humAnchors, setHumAnchors] = useState<string[]>([]);

  // SSE stream from /api/ticker-stream (Task 3 — WebSocket-equivalent)
  useEffect(() => {
    let es: EventSource | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    try {
      es = new EventSource('/api/ticker-stream');
      es.addEventListener('ticker', (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.assets && Array.isArray(payload.assets)) {
            setItems(payload.assets.map((a: Record<string, unknown>) => ({
              id: a.id as string,
              symbol: a.symbol as string,
              name: a.name as string,
              category: a.category as TickerCategory,
              value: a.value as number,
              change: a.change as number,
              changePercent: a.changePercent as number,
              unit: a.unit as string,
              verdict: a.verdict as string,
              sub_classification: a.sub_classification as string | undefined,
              lastUpdated: a.lastUpdated as number,
              carbonGhostMargin: a.carbonGhostMargin as number | undefined,
              facilityType: a.facilityType as string[] | undefined,
              recommended: a.recommended as string[] | undefined,
              status: a.status as ('PROSPECT' | 'ACTIVE' | 'CONTRACTED') | undefined,
            })));
            const ids = new Set((payload.assets as Array<{id: string}>).map((a) => a.id));
            setFlashIds(ids);
            setTimeout(() => setFlashIds(new Set()), 600);
          }
        } catch {}
      });
      es.addEventListener('hum_anchor', (e) => {
        try {
          const data = JSON.parse(e.data);
          setHumAnchors((prev) => [...prev.slice(-4), `${data.assetId} Δ${data.shiftPercent}%`]);
        } catch {}
      });
      es.onerror = () => {
        // Fallback to local jitter if SSE fails
        if (!fallbackInterval) {
          fallbackInterval = setInterval(() => {
            setItems((prev) => {
              const updated = prev.map(jitterItem);
              const ids = new Set(updated.map((i) => i.id));
              setFlashIds(ids);
              setTimeout(() => setFlashIds(new Set()), 600);
              return updated;
            });
          }, 2500);
        }
      };
    } catch {
      // SSE not supported — fallback
      fallbackInterval = setInterval(() => {
        setItems((prev) => prev.map(jitterItem));
      }, 2500);
    }

    return () => {
      es?.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animFrame: number;
    let scrollPos = 0;
    const speed = 0.5;

    const tick = () => {
      scrollPos += speed;
      if (scrollPos >= el.scrollWidth / 2) scrollPos = 0;
      el.scrollLeft = scrollPos;
      animFrame = requestAnimationFrame(tick);
    };
    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [activeFilter]);

  const filtered = activeFilter === 'ALL'
    ? items
    : items.filter((i) => {
        const cats = CATEGORY_FILTER_MAP[activeFilter];
        return cats ? cats.includes(i.category) : true;
      });

  // Double the items for seamless scroll loop
  const tickerItems = [...filtered, ...filtered];

  const getCategoryIcon = (cat: TickerCategory) => {
    switch (cat) {
      case 'RECYCLING': return <Activity className="h-3.5 w-3.5" />;
      case 'BIOCHAR': return <Building2 className="h-3.5 w-3.5" />;
      case 'METAL': return <Landmark className="h-3.5 w-3.5" />;
      case 'ENERGY_GHOST': return <Flame className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryColor = (cat: TickerCategory) => {
    switch (cat) {
      case 'RECYCLING': return 'text-cyan-400';
      case 'BIOCHAR': return 'text-violet-400';
      case 'METAL': return 'text-amber-400';
      case 'ENERGY_GHOST': return 'text-orange-400';
    }
  };

  const getVerdictBadge = (verdict: string) => {
    if (verdict === 'AUTO_APPROVED') {
      return (
        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          APPROVED
        </span>
      );
    }
    if (verdict === 'REJECTED') {
      return (
        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30">
          REJECTED
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
        PENDING SOVEREIGN REVIEW
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 overflow-hidden backdrop-blur-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold text-zinc-300 tracking-wider uppercase">
            Live Asset Matrix
          </span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          {humAnchors.length > 0 && (
            <span className="text-[9px] font-mono text-amber-400 animate-pulse">
              ⚡ {humAnchors[humAnchors.length - 1]}
            </span>
          )}
          <span className="text-[10px] text-zinc-500 font-mono">
            BT-C9C4C5 v2.4
          </span>
        </div>
      </div>

      {/* Scrolling ticker strip */}
      <div
        ref={scrollRef}
        className="overflow-hidden whitespace-nowrap py-2.5 px-2"
      >
        <div className="inline-flex gap-4">
          {tickerItems.map((item, idx) => {
            const isUp = item.change >= 0;
            const TrendIcon = item.change > 0 ? TrendingUp : item.change < 0 ? TrendingDown : Minus;

            // ── ENERGY GHOST scan prospect (amber/orange card) ──────────────
            if (item.category === 'ENERGY_GHOST') {
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={cn(
                    'inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-950/60 to-orange-950/40 border border-amber-500/40 hover:border-amber-400/60 shadow-sm shadow-amber-500/10 transition-all duration-300',
                    flashIds.has(item.id) && 'ring-1 ring-amber-400/50'
                  )}
                >
                  <span className="flex-shrink-0 text-orange-400">
                    <Flame className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                    ⚡ Energy Ghost Detected
                  </span>
                  <span className="text-xs font-semibold text-zinc-100">{item.name}</span>
                  {typeof item.carbonGhostMargin === 'number' && (
                    <span className="text-[11px] font-mono text-orange-300">
                      {item.carbonGhostMargin.toFixed(1)}% Carbon Ghost Margin
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-amber-200">
                    {item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} kW Thermal Waste
                  </span>
                  {item.recommended && item.recommended.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      {item.recommended.map((code) => (
                        <span
                          key={code}
                          className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-orange-500/20 text-orange-300 border border-orange-500/30"
                        >
                          → {code}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    PROSPECT — AETHEXER SCAN TARGET
                  </span>
                </div>
              );
            }

            return (
              <div
                key={`${item.id}-${idx}`}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 hover:border-zinc-600/60 transition-all duration-300',
                  flashIds.has(item.id) && 'ring-1 ring-cyan-500/40 bg-zinc-800/80'
                )}
              >
                <span className={cn('flex-shrink-0', getCategoryColor(item.category))}>
                  {getCategoryIcon(item.category)}
                </span>
                <span className="text-xs font-bold text-zinc-200">
                  {item.symbol}
                </span>
                <span className="text-xs font-mono text-zinc-300">
                  {item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-zinc-500">{item.unit}</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-[11px] font-semibold',
                    isUp ? 'text-emerald-400' : 'text-red-400'
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  {isUp ? '+' : ''}
                  {item.changePercent.toFixed(2)}%
                </span>
                {getVerdictBadge(item.verdict)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-zinc-800 bg-zinc-950/50">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          const count = tab.key === 'ALL'
            ? items.length
            : items.filter((i) => {
                const cats = CATEGORY_FILTER_MAP[tab.key];
                return cats ? cats.includes(i.category) : false;
              }).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 text-[11px] font-bold tracking-wider rounded-md transition-all',
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'ml-1.5 text-[9px] font-mono',
                  isActive ? 'text-cyan-400' : 'text-zinc-600'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
