'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Building2,
  Landmark,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Send,
  Eye,
  DollarSign,
  Shield,
  MapPin,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
  Flame,
  Zap,
} from 'lucide-react';

// ─── Energy Ghost scan-target types (Aethexer prospects — no ownership) ────────

interface AethexerProduct {
  code: string;
  label: string;
  description: string;
}

interface ScanTarget {
  id: string;
  symbol: string;
  name: string;
  category: 'ENERGY_GHOST';
  thermalWasteKw: number;
  unit: string;
  carbonGhostMargin: number;
  facilityType: string[];
  status: 'PROSPECT' | 'ACTIVE' | 'CONTRACTED';
  recommended: string[];
  recommendedProducts: AethexerProduct[];
  onboardingLink: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────────

type DiscoveryCategory = 'RECYCLING' | 'BIOCHAR' | 'METAL';
type DiscoveryVerdict = 'PENDING_SOVEREIGN_REVIEW' | 'AUTO_APPROVED';

interface DiscoveryAsset {
  id: string;
  symbol: string;
  name: string;
  category: DiscoveryCategory;
  location: string;
  thermalWasteKw?: number;
  carbonGhostMargin?: number;
  verdict: DiscoveryVerdict;
  subClassification?: string | null;
  outreachSent: boolean;
  settlementId?: string | null;
  settled: boolean;
  settledAt?: string | null;
  approvedAt?: string | null;
}

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED';

function formatUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function DiscoveryDashboard() {
  const [assets, setAssets] = useState<DiscoveryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [approving, setApproving] = useState(false);
  const [approveResult, setApproveResult] = useState<string | null>(null);

  // Energy Ghost scan targets (Aethexer prospects)
  const [scanTargets, setScanTargets] = useState<ScanTarget[]>([]);
  const [catalog, setCatalog] = useState<Record<string, AethexerProduct>>({});

  // PURGE modal state
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeInput, setPurgeInput] = useState('');
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/discovery');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error('[Discovery] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScanTargets = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/discovery/scan-targets');
      if (!res.ok) throw new Error('Failed to fetch scan targets');
      const data = await res.json();
      setScanTargets(data.targets || []);
      setCatalog(data.catalog || {});
    } catch (err) {
      console.error('[Discovery] Scan-target fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchScanTargets();
  }, [fetchAssets, fetchScanTargets]);

  const filtered = useMemo(() => {
    if (filter === 'PENDING') return assets.filter((a) => a.verdict === 'PENDING_SOVEREIGN_REVIEW');
    if (filter === 'APPROVED') return assets.filter((a) => a.verdict === 'AUTO_APPROVED');
    return assets;
  }, [assets, filter]);

  const pendingCount = assets.filter((a) => a.verdict === 'PENDING_SOVEREIGN_REVIEW').length;
  const approvedCount = assets.filter((a) => a.verdict === 'AUTO_APPROVED').length;
  const totalThermalWasteKw = assets.reduce((s, a) => s + (a.thermalWasteKw ?? 0), 0);

  const triggerOutreach = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, outreachSent: true } : a))
    );
  };

  const handleApproveAll = async () => {
    setApproving(true);
    setApproveResult(null);
    try {
      const res = await fetch('/api/v1/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_all' }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'APPROVAL_COMPLETE') {
        setApproveResult(`${data.summary.totalApproved} asset(s) approved and settled.`);
        await fetchAssets();
      } else {
        setApproveResult(data.message || data.error || 'Approval failed.');
      }
    } catch (err: any) {
      setApproveResult(err.message || 'Network error');
    } finally {
      setApproving(false);
    }
  };

  const handlePurge = async () => {
    if (purgeInput !== 'PURGE') return;
    setPurging(true);
    setPurgeResult(null);
    try {
      const res = await fetch('/api/v1/admin/purge-test-artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationToken: 'PURGE' }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'PURGE_COMPLETE') {
        setPurgeResult(`Purge complete — ${data.summary.totalDeleted} artifact(s) removed.`);
        setPurgeInput('');
        setTimeout(() => setPurgeModalOpen(false), 2000);
      } else {
        setPurgeResult(data.message || data.error || 'Purge failed.');
      }
    } catch (err: any) {
      setPurgeResult(err.message || 'Network error');
    } finally {
      setPurging(false);
    }
  };

  const getCategoryIcon = (cat: DiscoveryCategory) => {
    switch (cat) {
      case 'RECYCLING': return <Activity className="h-5 w-5" />;
      case 'BIOCHAR': return <Building2 className="h-5 w-5" />;
      case 'METAL': return <Landmark className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (cat: DiscoveryCategory) => {
    switch (cat) {
      case 'RECYCLING': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'BIOCHAR': return 'text-violet-400 bg-violet-500/10 border-violet-500/30';
      case 'METAL': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="h-6 w-6 text-cyan-400" />
            Macro-Asset Discovery
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Passive intelligence feed — unlisted macro-assets flagged for sovereign review
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
            <span className="text-zinc-400">Aggregate Thermal Waste:</span>{' '}
            <span className="text-amber-400 font-bold font-mono">{totalThermalWasteKw.toLocaleString()} kW</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Auto Approved</span>
          </div>
          <span className="text-2xl font-bold text-emerald-400">{approvedCount}</span>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Pending Review</span>
          </div>
          <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Total Assets</span>
          </div>
          <span className="text-2xl font-bold text-white">{assets.length}</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'APPROVED'] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                'px-4 py-2 text-xs font-bold tracking-wider rounded-lg transition-all border',
                filter === t
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'text-zinc-500 hover:text-zinc-300 bg-zinc-900/50 border-zinc-700/30 hover:border-zinc-600'
              )}
            >
              {t === 'PENDING' ? 'PENDING REVIEW' : t}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Approve All Pending Button */}
        {pendingCount > 0 && (
          <button
            onClick={handleApproveAll}
            disabled={approving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
          >
            {approving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            APPROVE ALL PENDING ({pendingCount})
          </button>
        )}

        {/* PURGE Button */}
        <button
          onClick={() => { setPurgeModalOpen(true); setPurgeResult(null); setPurgeInput(''); }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
        >
          <Trash2 className="h-4 w-4" />
          PURGE SYSTEM TEST ARTIFACTS
        </button>
      </div>

      {/* Approve Result Banner */}
      {approveResult && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 inline mr-2" />
          {approveResult}
        </div>
      )}

      {/* Asset Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((asset) => (
          <div
            key={asset.id}
            className="rounded-xl bg-zinc-900/80 border border-zinc-700/50 p-5 hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg border', getCategoryColor(asset.category))}>
                  {getCategoryIcon(asset.category)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{asset.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-zinc-500">{asset.symbol}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                      <MapPin className="h-3 w-3" />
                      {asset.location}
                    </span>
                  </div>
                </div>
              </div>
              {/* Verdict Badge */}
              {asset.verdict === 'AUTO_APPROVED' ? (
                <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3" />
                  APPROVED
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  RIGHT SHARE PENDING
                </span>
              )}
            </div>

            {/* Value Row */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-lg bg-zinc-800/60 p-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Thermal Waste</p>
                <p className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                  {asset.thermalWasteKw ? `${asset.thermalWasteKw.toLocaleString()} kW` : '— kW'}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3">
                <p className="text-[10px] text-orange-500 uppercase tracking-wider">Carbon Ghost Margin</p>
                <p className="text-lg font-bold font-mono text-orange-400 mt-0.5">
                  {asset.carbonGhostMargin != null ? `${asset.carbonGhostMargin}%` : '—'}
                </p>
              </div>
            </div>

            {/* Settlement Info (if settled) */}
            {asset.settled && asset.settlementId && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-[10px] text-emerald-500 uppercase tracking-wider">Settlement</p>
                <p className="text-xs font-mono text-emerald-400 mt-0.5">{asset.settlementId}</p>
              </div>
            )}

            {/* Sub-classification + Outreach */}
            <div className="flex items-center justify-between mt-4">
              {asset.subClassification && (
                <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  {asset.subClassification}
                </span>
              )}
              {asset.verdict === 'PENDING_SOVEREIGN_REVIEW' && (
                <button
                  onClick={() => triggerOutreach(asset.id)}
                  disabled={asset.outreachSent}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                    asset.outreachSent
                      ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                  )}
                >
                  <Send className="h-3.5 w-3.5" />
                  {asset.outreachSent ? 'Outreach Sent' : 'Trigger Outreach'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── ENERGY GHOST SCANNER (Aethexer prospects) ─────────────────────────── */}
      {scanTargets.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              Energy Ghost Scanner
            </h3>
            <p className="text-sm text-zinc-400">
              Aethexer thermal-scan prospects — public landmarks flagged for
              product-fit review.
            </p>
            <p className="text-[11px] text-amber-400/80 leading-relaxed max-w-3xl">
              MEDIFLO LLC asserts <span className="font-bold">no ownership, equity, or valuation</span>{' '}
              over any facility listed below. Every entry is a{' '}
              <span className="font-bold">PROSPECT</span> only. Thermal-waste and
              carbon-ghost figures are Aethexer scan projections for prospecting —
              not verified telemetry and not asset valuations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {scanTargets.map((t) => (
              <div
                key={t.id}
                className="rounded-xl bg-gradient-to-br from-amber-950/40 to-orange-950/20 border border-amber-500/30 p-5 hover:border-amber-400/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{t.name}</h4>
                      <span className="text-[10px] font-mono text-zinc-500">{t.symbol}</span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Zap className="h-3 w-3" />
                    {t.status} — SCAN TARGET
                  </span>
                </div>

                {/* Scan projections */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="rounded-lg bg-black/30 border border-amber-500/20 p-3">
                    <p className="text-[10px] text-orange-400 uppercase tracking-wider">Carbon Ghost Margin</p>
                    <p className="text-lg font-bold font-mono text-orange-300 mt-0.5">
                      {t.carbonGhostMargin.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-black/30 border border-amber-500/20 p-3">
                    <p className="text-[10px] text-amber-400 uppercase tracking-wider">Thermal Waste</p>
                    <p className="text-lg font-bold font-mono text-amber-200 mt-0.5">
                      {t.thermalWasteKw.toLocaleString()} <span className="text-xs">{t.unit}</span>
                    </p>
                  </div>
                </div>

                {/* Facility type tags */}
                {t.facilityType.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {t.facilityType.map((f) => (
                      <span
                        key={f}
                        className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Recommended Aethexer products */}
                {t.recommendedProducts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      Recommended Aethexer Products
                    </p>
                    {t.recommendedProducts.map((p) => (
                      <div
                        key={p.code}
                        className="rounded-lg bg-zinc-800/60 border border-zinc-700/50 p-2.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            → {p.code}
                          </span>
                          <span className="text-xs font-semibold text-zinc-200">{p.label}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{p.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PURGE CONFIRMATION MODAL ──────────────────────────────────────────── */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-red-500/40 shadow-2xl shadow-red-500/10 p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-red-400">DESTRUCTIVE OPERATION</h3>
              </div>
              <button
                onClick={() => setPurgeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning Text */}
            <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4 mb-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                This will permanently delete all diagnostic and test artifacts from
                the production database, including:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Telemetry readings with DIAG-* or TEST-* prefix
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Diagnostic ingest nonces
                </li>
              </ul>
              <p className="mt-3 text-xs text-red-400 font-bold">
                This action cannot be undone.
              </p>
            </div>

            {/* Confirmation Input */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-400 mb-2">
                Type <span className="font-mono font-bold text-red-400">PURGE</span> to confirm:
              </label>
              <input
                type="text"
                value={purgeInput}
                onChange={(e) => setPurgeInput(e.target.value)}
                placeholder="Type PURGE here"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* Purge Result */}
            {purgeResult && (
              <div className="mb-4 rounded-lg bg-zinc-800 border border-zinc-700 p-3 text-xs text-zinc-300">
                {purgeResult}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPurgeModalOpen(false)}
                className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handlePurge}
                disabled={purgeInput !== 'PURGE' || purging}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all border',
                  purgeInput === 'PURGE'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                    : 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed'
                )}
              >
                {purging ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                EXECUTE PURGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
