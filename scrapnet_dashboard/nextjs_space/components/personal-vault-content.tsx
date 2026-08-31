'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import SovereignEquityCard from './sovereign-equity-card';
import LookbackGauge from './lookback-gauge';
import RecentActivityCard from './recent-activity-card';
import VaultSidebar from './vault-sidebar';
import MintProofOfAudit from './mint-proof-of-audit';
import MintProofButton from '@/components/mint-proof-button';
import SolanaProofsList from './solana-proofs-list';
import WalletConnectButton from './wallet-connect-button';
import { useBpsTable } from '@/lib/use-bps-table';
import {
  Zap, TrendingUp, History, Wallet, Shield, ChevronRight,
  Loader2, AlertCircle, Activity, Clock, CheckCircle2, XCircle,
  Wheat, Building2, Briefcase, User, RefreshCw, ExternalLink,
  BarChart3, PieChart, ArrowUpRight, Leaf, Lock, Menu, X,
  Users, Settings, BadgeCheck, Hexagon
} from 'lucide-react';

interface VaultData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    onboardingComplete: boolean;
    isVerified?: boolean;
  };
  profile: any;
  profileType: string;
  metrics: {
    vibrationalBalance: number;
    ledgerEquity: number;
    carbonSavedTonnes: number;
    publicOverflow: number;
    totalEntries: number;
    totalAudits: number;
  };
  entriesByType: Record<string, { count: number; value: number }>;
  pentagonData: {
    industrialMass: number;
    resonanceYield: number;
    participationScore: number;
    legacyHealing: number;
    vibrationalEquity: number;
  };
  recentEntries: Array<{
    id: string;
    entryId: string;
    type: string;
    carbonSaved: number;
    value: number;
    founderYield: number;
    verified: boolean;
    createdAt: string;
  }>;
  recentAudits: Array<{
    id: string;
    auditId: string;
    legacyYield: number;
    carbonAvoided: number;
    yearsAnalyzed: number;
    compliant: boolean;
    createdAt: string;
  }>;
}

const MAINNET_MINT_ADDRESS = 'Eb4mSecyZh6BQ2wm5rbBnB2GNJu8iuEqGq53YHBVJ88V';
const MAINNET_EXPLORER_URL = `https://explorer.solana.com/address/${MAINNET_MINT_ADDRESS}`;

const roleIcons: Record<string, React.ReactNode> = {
  FARMER: <Wheat className="w-5 h-5" />,
  REALTOR: <Building2 className="w-5 h-5" />,
  BUSINESS_OWNER: <Briefcase className="w-5 h-5" />,
  SOVEREIGN_INDIVIDUAL: <User className="w-5 h-5" />,
};

const roleColors: Record<string, string> = {
  FARMER: 'text-emerald-400',
  REALTOR: 'text-violet-400',
  BUSINESS_OWNER: 'text-amber-400',
  SOVEREIGN_INDIVIDUAL: 'text-cyan-400',
};

const roleLabels: Record<string, string> = {
  FARMER: 'Farmer',
  REALTOR: 'Realtor',
  BUSINESS_OWNER: 'Business Owner',
  SOVEREIGN_INDIVIDUAL: 'Sovereign Individual',
};

export default function PersonalVaultContent() {
  const router = useRouter();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const bpsTable = useBpsTable();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchVaultData = async () => {
    try {
      const response = await fetch('/api/vault');
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) { router.push('/login'); return; }
        throw new Error(data.error || 'Failed to fetch vault data');
      }
      if (data.success) {
        if (!data.user.onboardingComplete) { router.push('/onboarding'); return; }
        setVaultData(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load vault data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchVaultData(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVaultData();
  };

  const activities = vaultData ? [
    ...vaultData.recentEntries.map(entry => ({
      id: entry.id,
      type: entry.type,
      description: `Carbon Entry - ${entry.entryId}`,
      value: entry.founderYield,
      carbonSaved: entry.carbonSaved,
      status: entry.verified ? 'verified' as const : 'pending' as const,
      timestamp: entry.createdAt
    })),
    ...vaultData.recentAudits.map(audit => ({
      id: audit.id,
      type: 'Legacy Audit',
      description: `Audit ${audit.auditId} - ${audit.yearsAnalyzed.toFixed(1)} years`,
      value: audit.legacyYield,
      carbonSaved: audit.carbonAvoided,
      status: audit.compliant ? 'verified' as const : 'processing' as const,
      timestamp: audit.createdAt
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your Sovereign Vault...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] rounded-2xl border border-red-500/30 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Vault</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => { setError(''); setLoading(true); fetchVaultData(); }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!vaultData) return null;

  const { user, profile, profileType, metrics, pentagonData, recentEntries, recentAudits } = vaultData;
  const totalYearsAnalyzed = recentAudits.reduce((sum, a) => sum + a.yearsAnalyzed, 0);
  const hasActivity = activities.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-[#0a0a0a] border-r border-gray-800/50 z-40 transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:w-16 lg:w-64"
      )}>
        <VaultSidebar />
      </div>

      {/* Main Content */}
      <main className="md:ml-16 lg:ml-64 min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30",
                roleColors[profileType] || 'text-cyan-400'
              )}>
                {roleIcons[profileType] || <User className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-white">{user.name}</h1>
                  {user.isVerified && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">Verified</span>
                    </div>
                  )}
                </div>
                <p className={cn("text-sm", roleColors[profileType] || 'text-cyan-400')}>
                  {roleLabels[profileType] || 'Sovereign Individual'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 rounded-xl bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white transition"
              >
                <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
              </button>
              <Link
                href="/legacy-healer"
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-medium flex items-center gap-2 hover:from-cyan-400 hover:to-emerald-400 transition text-sm md:text-base"
              >
                <History className="w-5 h-5" />
                <span className="hidden sm:inline">Start Legacy Audit</span>
                <span className="sm:hidden">Audit</span>
              </Link>
            </div>
          </div>

          {/* ═══ HIGH-DENSITY TOP ROW: Sovereign Equity + 9-Year Lookback ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Compact Sovereign Equity Score */}
            <div className="relative bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
              <div className="relative p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-400 font-medium">Sovereign Equity Score</span>
                  </div>
                  <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {metrics.ledgerEquity >= 1000000
                      ? `$${(metrics.ledgerEquity / 1000000).toFixed(2)}M`
                      : metrics.ledgerEquity >= 1000
                        ? `$${(metrics.ledgerEquity / 1000).toFixed(2)}K`
                        : `$${metrics.ledgerEquity.toFixed(2)}`}
                  </p>
                  {metrics.totalEntries > 0 && (
                    <div className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>+12.5% this period</span>
                    </div>
                  )}
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs flex-shrink-0",
                  user.isVerified
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-gray-800 text-gray-500"
                )}>
                  <Shield className="w-3 h-3" />
                  <span>{user.isVerified ? 'Verified' : 'Pending'}</span>
                </div>
              </div>
            </div>

            {/* Compact 9-Year Lookback Gauge */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs text-gray-400 font-medium">9-Year Lookback Gauge</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl md:text-4xl font-bold text-white">
                      {Math.min(totalYearsAnalyzed, 9).toFixed(1)}
                    </p>
                    <span className="text-sm text-gray-500">/ 9 years</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((Math.min(totalYearsAnalyzed, 9) / 9) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                      <span>Historical Audit Progress</span>
                      <span>{Math.min((Math.min(totalYearsAnalyzed, 9) / 9) * 100, 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-800 text-xs text-gray-400 flex-shrink-0">
                  <Shield className="w-3 h-3" />
                  <span>Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ ACTIVITY / ASSET READINESS INDICATOR ═══ */}
          {hasActivity ? (
            <RecentActivityCard activities={activities} />
          ) : (
            /* Mainnet Asset-Readiness Indicator */
            <div className="bg-[#1a1a1a] rounded-xl border border-cyan-500/20 p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <Hexagon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#1a1a1a] animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Mainnet Asset Bridge Active</p>
                  <p className="text-xs text-gray-400 mt-1">Token-2022 sovereign mint operational on Solana mainnet-beta</p>
                </div>
                <a
                  href={MAINNET_EXPLORER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono hover:bg-cyan-500/20 transition"
                >
                  <span>{MAINNET_MINT_ADDRESS.slice(0, 4)}...{MAINNET_MINT_ADDRESS.slice(-4)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <div className="flex items-center gap-4 text-[10px] text-gray-600">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Supply: 2</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-cyan-500" /> Token-2022</span>
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-gray-500" /> Zero Greed</span>
                </div>
              </div>
            </div>
          )}

          {/* Secondary Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-500">Total Carbon</span>
              </div>
              <p className="text-xl font-bold text-white">{metrics.carbonSavedTonnes.toFixed(2)}</p>
              <p className="text-xs text-gray-600">tonnes CO₂</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-500">Asset Sovereign</span>
              </div>
              <p className="text-xl font-bold text-white">${metrics.ledgerEquity.toFixed(2)}</p>
              <p className="text-xs text-cyan-400">{bpsTable ? `${bpsTable.earnerPct}% ` : ''}Asset Sovereign</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-gray-500">Community</span>
              </div>
              <p className="text-xl font-bold text-white">${metrics.publicOverflow.toFixed(2)}</p>
              <p className="text-xs text-amber-400">{bpsTable ? `${bpsTable.depinPct}% ` : ''}Public Resilience</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-gray-500">Audits</span>
              </div>
              <p className="text-xl font-bold text-white">{metrics.totalAudits}</p>
              <p className="text-xs text-violet-400">completed</p>
            </div>
          </div>

          {/* Solana Wallet Connectivity */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Solana Wallet</h3>
                <p className="text-sm text-gray-400">Connect to enable blockchain attestations</p>
              </div>
            </div>
            <WalletConnectButton />
          </div>

          {/* Solana Proof of Audit Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MintProofButton
              auditData={{
                userId: user.id,
                auditType: 'CARBON_CREDIT',
                carbonAmount: metrics.carbonSavedTonnes,
                valueUsd: metrics.ledgerEquity,
              }}
              onMintSuccess={(sig, slot) => {
                console.log('Minted:', sig);
                handleRefresh();
              }}
            />
            <SolanaProofsList userId={user.id} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/legacy-healer" className="p-4 rounded-xl bg-[#1a1a1a] border border-gray-800 hover:border-violet-500/50 transition group">
              <History className="w-8 h-8 text-violet-400 mb-2 group-hover:scale-110 transition" />
              <p className="text-sm font-medium text-white">Legacy Healer</p>
              <p className="text-xs text-gray-500">Reclaim frequency</p>
            </Link>
            <Link href="/ledger" className="p-4 rounded-xl bg-[#1a1a1a] border border-gray-800 hover:border-emerald-500/50 transition group">
              <Activity className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition" />
              <p className="text-sm font-medium text-white">Ledger</p>
              <p className="text-xs text-gray-500">All settlements</p>
            </Link>
            <Link href="/biochar" className="p-4 rounded-xl bg-[#1a1a1a] border border-gray-800 hover:border-amber-500/50 transition group">
              <Leaf className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition" />
              <p className="text-sm font-medium text-white">Biochar</p>
              <p className="text-xs text-gray-500">CDR engine</p>
            </Link>
            <Link href="/calculator" className="p-4 rounded-xl bg-[#1a1a1a] border border-gray-800 hover:border-cyan-500/50 transition group">
              <BarChart3 className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition" />
              <p className="text-sm font-medium text-white">Calculator</p>
              <p className="text-xs text-gray-500">Analysis</p>
            </Link>
          </div>

          {/* GENIUS Act Banner */}
          <div className="bg-[#1a1a1a] rounded-xl border border-emerald-500/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white">GENIUS Act 2026 Compliant</p>
                <p className="text-xs text-gray-500">Universal Law (Dynamic BPS) enforced</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">Private Ledger</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
