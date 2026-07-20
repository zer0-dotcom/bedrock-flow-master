'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  X,
  Activity,
  Building2,
  Landmark,
  MapPin,
  DollarSign,
  Eye,
  RefreshCw,
  Lock,
  LogOut,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────────

type DiscoveryCategory = 'EXCHANGE' | 'SKYSCRAPER' | 'CASINO';

interface DiscoveryAsset {
  id: string;
  symbol: string;
  name: string;
  category: DiscoveryCategory;
  location: string;
  estimatedValueUsd: number;
  sovereignShare70: number;
  verdict: string;
  subClassification?: string | null;
  outreachSent: boolean;
  settlementId?: string | null;
  settled: boolean;
  settledAt?: string | null;
  approvedAt?: string | null;
}

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

const ALLOWED_ROLES = ['FOUNDER', 'ADMIN'];

export default function AdminClient() {
  const router = useRouter();

  // ── Auth state ──
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ── Discovery state ──
  const [assets, setAssets] = useState<DiscoveryAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionResult, setActionResult] = useState<{ symbol: string; message: string; type: 'success' | 'error' } | null>(null);

  // ── Purge state ──
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeInput, setPurgeInput] = useState('');
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);
  const [purgePreview, setPurgePreview] = useState<{ target: string; count: number }[] | null>(null);

  // ── Auth check ──
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.success && ALLOWED_ROLES.includes(data.user.role)) {
          setUser({ id: data.user.id, email: data.user.email, name: data.user.name, role: data.user.role });
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  // ── Fetch discovery assets ──
  const fetchAssets = useCallback(async () => {
    setLoadingAssets(true);
    try {
      const res = await fetch('/api/v1/discovery');
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error('[Admin] Fetch error:', err);
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchAssets();
  }, [user, fetchAssets]);

  // ── Approve single asset ──
  const handleApprove = async (symbol: string) => {
    setActionLoading(prev => ({ ...prev, [symbol]: true }));
    setActionResult(null);
    try {
      const res = await fetch('/api/v1/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', symbols: [symbol] }),
      });
      const data = await res.json();
      if (res.ok && data.results?.[0]) {
        const r = data.results[0];
        setActionResult({ symbol, message: `Settled → ${r.settlement.id}`, type: 'success' });
        await fetchAssets();
      } else {
        setActionResult({ symbol, message: data.message || data.error || 'Failed', type: 'error' });
      }
    } catch (err: any) {
      setActionResult({ symbol, message: err.message, type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  // ── Reject / Re-scan single asset ──
  const handleReject = async (symbol: string) => {
    setActionLoading(prev => ({ ...prev, [symbol]: true }));
    setActionResult(null);
    try {
      const res = await fetch('/api/v1/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', symbols: [symbol] }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionResult({ symbol, message: 'Flagged for re-scan', type: 'success' });
        await fetchAssets();
      } else {
        setActionResult({ symbol, message: data.message || 'Failed', type: 'error' });
      }
    } catch (err: any) {
      setActionResult({ symbol, message: err.message, type: 'error' });
    } finally {
      setActionLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  // ── Purge preview ──
  const fetchPurgePreview = async () => {
    try {
      const res = await fetch('/api/v1/admin/purge-test-artifacts');
      const data = await res.json();
      setPurgePreview(data.targets || []);
    } catch {
      setPurgePreview([]);
    }
  };

  // ── Execute purge ──
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
        fetchPurgePreview();
      } else {
        setPurgeResult(data.message || data.error || 'Purge failed.');
      }
    } catch (err: any) {
      setPurgeResult(err.message);
    } finally {
      setPurging(false);
    }
  };

  const getCategoryIcon = (cat: DiscoveryCategory) => {
    switch (cat) {
      case 'EXCHANGE': return <Activity className="h-4 w-4" />;
      case 'SKYSCRAPER': return <Building2 className="h-4 w-4" />;
      case 'CASINO': return <Landmark className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (cat: DiscoveryCategory) => {
    switch (cat) {
      case 'EXCHANGE': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'SKYSCRAPER': return 'text-violet-400 bg-violet-500/10 border-violet-500/30';
      case 'CASINO': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  // ── AUTH GATE ──
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
          <Lock className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-zinc-400 text-center max-w-md">
          This control panel requires Founder or Admin session authentication.
          Sign in with an authorized account to proceed.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="mt-2 px-6 py-2.5 text-sm font-bold rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  const pendingAssets = assets.filter(a => a.verdict === 'PENDING_SOVEREIGN_REVIEW');
  const approvedAssets = assets.filter(a => a.verdict === 'AUTO_APPROVED');

  return (
    <div className="space-y-8">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-red-400" />
            Master Admin Control Panel
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Authenticated as <span className="text-cyan-400 font-mono">{user.name}</span>
            {' '}<span className="text-zinc-600">|</span>{' '}
            <span className="text-emerald-400 font-mono text-xs">{user.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAssets}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-600 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            REFRESH
          </button>
          <button
            onClick={() => router.push('/api/auth/logout')}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            SIGN OUT
          </button>
        </div>
      </div>

      {/* ═══ STATS STRIP ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Total Assets</span>
          </div>
          <span className="text-2xl font-bold text-white">{assets.length}</span>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Pending Review</span>
          </div>
          <span className="text-2xl font-bold text-amber-400">{pendingAssets.length}</span>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Approved</span>
          </div>
          <span className="text-2xl font-bold text-emerald-400">{approvedAssets.length}</span>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Total 70% Sovereign</span>
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            {formatUsd(assets.reduce((s, a) => s + a.sovereignShare70, 0))}
          </span>
        </div>
      </div>

      {/* ═══ SECTION 1: PENDING DISCOVERY QUEUE ═══ */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-700/50 p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          Pending Discovery Queue
          {pendingAssets.length > 0 && (
            <span className="ml-2 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {pendingAssets.length}
            </span>
          )}
        </h3>

        {loadingAssets ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : pendingAssets.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No pending assets — queue is clear.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAssets.map(asset => {
              const isLoading = actionLoading[asset.symbol] || false;
              return (
                <div
                  key={asset.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/40 hover:border-amber-500/30 transition-colors"
                >
                  {/* Asset Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn('p-2 rounded-lg border shrink-0', getCategoryColor(asset.category))}>
                      {getCategoryIcon(asset.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{asset.name}</h4>
                        <span className="text-[10px] font-mono text-zinc-600 shrink-0">{asset.symbol}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="h-3 w-3 text-zinc-600 shrink-0" />
                        <span className="text-[11px] text-zinc-500 truncate">{asset.location}</span>
                        {asset.subClassification && (
                          <span className="text-[10px] font-mono text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 shrink-0">
                            {asset.subClassification}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Value columns */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 uppercase">Est. Value</p>
                      <p className="text-sm font-bold font-mono text-white">{formatUsd(asset.estimatedValueUsd)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-500 uppercase">70% Sovereign</p>
                      <p className="text-sm font-bold font-mono text-emerald-400">{formatUsd(asset.sovereignShare70)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(asset.symbol)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      APPROVE & SETTLE
                    </button>
                    <button
                      onClick={() => handleReject(asset.symbol)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      REJECT / RE-SCAN
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action result toast */}
        {actionResult && (
          <div className={cn(
            'mt-4 rounded-lg p-3 text-sm flex items-center gap-2',
            actionResult.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          )}>
            {actionResult.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span className="font-mono text-xs">{actionResult.symbol}</span>: {actionResult.message}
          </div>
        )}
      </div>

      {/* ═══ SECTION 2: SETTLED ASSETS LEDGER (collapsed view) ═══ */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-700/50 p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          Settled Discovery Ledger
          <span className="ml-2 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {approvedAssets.length}
          </span>
        </h3>

        {approvedAssets.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">No settled assets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                  <th className="text-left py-2 px-3">Symbol</th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Category</th>
                  <th className="text-right py-2 px-3">70% Sovereign</th>
                  <th className="text-left py-2 px-3">Settlement ID</th>
                  <th className="text-left py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {approvedAssets.map(asset => (
                  <tr key={asset.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2.5 px-3 font-mono text-cyan-400">{asset.symbol}</td>
                    <td className="py-2.5 px-3 text-white">{asset.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold', getCategoryColor(asset.category))}>
                        {getCategoryIcon(asset.category)}
                        {asset.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{formatUsd(asset.sovereignShare70)}</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400 text-[10px]">{asset.settlementId || '—'}</td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleReject(asset.symbol)}
                        disabled={actionLoading[asset.symbol]}
                        className="text-[10px] text-zinc-600 hover:text-red-400 font-bold uppercase transition-colors"
                      >
                        RE-SCAN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ SECTION 3: NETWORK PURGE CONSOLE ═══ */}
      <div className="rounded-2xl bg-zinc-900/60 border border-red-500/20 p-6">
        <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-2">
          <Trash2 className="h-5 w-5" />
          Network Purge Console
        </h3>
        <p className="text-xs text-zinc-500 mb-4">
          Permanently remove diagnostic test artifacts (DIAG-*, TEST-*) from the production database.
        </p>

        <button
          onClick={() => {
            setPurgeModalOpen(true);
            setPurgeResult(null);
            setPurgeInput('');
            fetchPurgePreview();
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
        >
          <AlertTriangle className="h-4 w-4" />
          PURGE SYSTEM TEST ARTIFACTS
        </button>
      </div>

      {/* ═══ PURGE CONFIRMATION MODAL ═══ */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-red-500/40 shadow-2xl shadow-red-500/10 p-6">
            {/* Header */}
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

            {/* Preview scan */}
            <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4 mb-4">
              <p className="text-sm text-zinc-300 mb-2">Artifacts targeted for deletion:</p>
              {purgePreview ? (
                <ul className="space-y-1">
                  {purgePreview.map((t, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {t.target}
                      </span>
                      <span className="font-mono text-red-400">{t.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
              )}
              <p className="mt-3 text-xs text-red-400 font-bold">This action cannot be undone.</p>
            </div>

            {/* Typed confirmation gate */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-400 mb-2">
                Type <span className="font-mono font-bold text-red-400">PURGE</span> to confirm:
              </label>
              <input
                type="text"
                value={purgeInput}
                onChange={e => setPurgeInput(e.target.value)}
                placeholder="Type PURGE here"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* Result */}
            {purgeResult && (
              <div className="mb-4 rounded-lg bg-zinc-800 border border-zinc-700 p-3 text-xs text-zinc-300">
                {purgeResult}
              </div>
            )}

            {/* Buttons */}
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
