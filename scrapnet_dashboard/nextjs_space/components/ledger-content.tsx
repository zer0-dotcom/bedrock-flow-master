'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Scale,
  Zap,
  Music,
  Heart,
  TrendingUp,
  Home,
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Coins,
  Factory,
  Radio,
  Users,
  Globe,
  Flame,
  ArrowRight,
  Leaf,
  Clock,
  Building2,
  Umbrella,
  Activity,
  Battery,
  History,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SovereignPentagon from './sovereign-pentagon';
import PulseWaveEqualizer from './pulse-wave-equalizer';
import NeighborhoodHeartbeat from './neighborhood-heartbeat';
import PulseMarquee, { PulseEntry, PulseType } from './pulse-marquee';
import SemanticZoom from './semantic-zoom';
import CapitalMarketsTicker from './capital-markets-ticker';

interface LedgerStats {
  universalLedger: {
    totalEntries: number;
    totalValueUsd: number;
    founderYieldUsd: number;
    stewardshipUsd: number;
    publicResilienceUsd: number;
    carbonAvoidedTonnes: number;
  };
  module1_deadMass: {
    extractions: number;
    totalWeightKg: number;
    carbonAvoidedTonnes: number;
    totalValueUsd: number;
  };
  module2_resonance: {
    prints: number;
    totalViews: number;
    totalStreams: number;
    carbonAvoidedTonnes: number;
    totalRevenueUsd: number;
  };
  module3_participation: {
    eligibleParticipants: number;
    totalSocialYield: number;
    totalReductionKg: number;
  };
  publicResilience: {
    grantsDistributed: number;
    totalDistributedUsd: number;
    poolAvailable: number;
  };
  compliance: {
    compliant: number;
    highFriction: number;
    complianceRate: number;
  };
}

interface LedgerEntry {
  id: string;
  entryId: string;
  extractionType: string;
  sourceNodeId: string;
  totalValueUsd: number;
  founderYieldUsd: number;
  stewardshipUsd: number;
  publicResilienceUsd: number;
  carbonAvoidedTonnes: number;
  complianceState: string;
  tokenType: string;
  tokenMinted: boolean;
  createdAt: string;
  poeHash?: string;
}

interface V2Stats {
  version: string;
  modules: {
    module4_legacyAudit: {
      totalAudits: number;
      legacyYieldUsd: number;
      publicResilienceUsd: number;
      carbonAvoidedTonnes: number;
    };
    realEstate_vibrationalEquity: {
      totalEquities: number;
      totalEquityValueUsd: number;
      totalDebtErasedUsd: number;
    };
    insurance_parametric: {
      totalPolicies: number;
      totalCoverageUsd: number;
      accruedYieldUsd: number;
    };
    pulseStrings: {
      totalPulses: number;
    };
  };
}

interface PulseString {
  id: string;
  type: string;
  string: string;
  timestamp: string;
  totalValueUsd: number;
  publicResilienceUsd: number | null;
  targetZipCode: string | null;
}

type TabType = 'organism' | 'pentagon' | 'pulse' | 'heartbeat' | 'explorer';

export default function LedgerContent() {
  const [activeTab, setActiveTab] = useState<TabType>('organism');
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [v2Stats, setV2Stats] = useState<V2Stats | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [pulseStrings, setPulseStrings] = useState<PulseString[]>([]);
  const [loading, setLoading] = useState(true);
  const [highFrictionEntries, setHighFrictionEntries] = useState<LedgerEntry[]>([]);
  const [activePentagonNode, setActivePentagonNode] = useState<string | null>(null);
  const [hoveredPulse, setHoveredPulse] = useState<PulseEntry | null>(null);
  const [settlementVelocity, setSettlementVelocity] = useState(2.5);
  const [settlementLatency, setSettlementLatency] = useState(150);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, entriesRes, complianceRes, v2StatsRes, pulseRes] = await Promise.all([
        fetch('/api/ledger?action=stats'),
        fetch('/api/ledger?action=entries&limit=20'),
        fetch('/api/ledger?action=compliance'),
        fetch('/api/ledger?action=v2-stats'),
        fetch('/api/ledger?action=pulse-strings&limit=20'),
      ]);

      const statsData = await statsRes.json();
      const entriesData = await entriesRes.json();
      const complianceData = await complianceRes.json();
      const v2StatsData = await v2StatsRes.json();
      const pulseData = await pulseRes.json();

      setStats(statsData);
      setEntries(entriesData.entries || []);
      setHighFrictionEntries(complianceData.highFrictionEntries || []);
      setV2Stats(v2StatsData);
      setPulseStrings(pulseData.pulses || []);

      // Simulate velocity/latency updates
      setSettlementVelocity(Math.random() * 8 + 1);
      setSettlementLatency(Math.floor(Math.random() * 200 + 50));
    } catch (err) {
      console.error('Error fetching ledger data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Calculate pentagon data from stats
  const pentagonData = useMemo(() => {
    if (!stats || !v2Stats) {
      return { industrial: 50, resonance: 50, participation: 50, legacy: 50, equity: 50 };
    }
    const total = stats.universalLedger.totalValueUsd || 1;
    return {
      industrial: Math.min(100, (stats.module1_deadMass.totalValueUsd / total) * 500 + 20),
      resonance: Math.min(100, (stats.module2_resonance.totalRevenueUsd / total) * 500 + 20),
      participation: Math.min(100, (stats.module3_participation.totalSocialYield / total) * 1000 + 30),
      legacy: Math.min(100, (v2Stats.modules.module4_legacyAudit.legacyYieldUsd / total) * 500 + 25),
      equity: Math.min(100, (v2Stats.modules.realEstate_vibrationalEquity.totalEquityValueUsd / total) * 100 + 40),
    };
  }, [stats, v2Stats]);

  // Transform pulse strings to PulseEntry format
  const transformedPulses = useMemo((): PulseEntry[] => {
    return pulseStrings.map((p) => {
      let pulseType: PulseType = 'STANDARD';
      if (p.type.includes('RETRO') || p.type.includes('LEGACY')) pulseType = 'LEGACY';
      else if (p.type.includes('EQUITY') || p.type.includes('DEBT')) pulseType = 'EQUITY';
      else if (p.type.includes('CLAIM') || p.type.includes('INSURANCE')) pulseType = 'INSURANCE';
      else if (p.type.includes('RENT')) pulseType = 'RENT';
      else if (p.type.includes('SALE')) pulseType = 'SALE';
      else if (p.type.includes('AIRBNB') || p.type.includes('HOST')) pulseType = 'AIRBNB';

      return {
        id: p.id,
        type: pulseType,
        string: p.string,
        timestamp: p.timestamp,
        totalValueUsd: p.totalValueUsd,
        publicResilienceUsd: p.publicResilienceUsd || undefined,
        targetZipCode: p.targetZipCode || undefined,
        poeHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      };
    });
  }, [pulseStrings]);

  // Generate zip overflow data
  const zipOverflows = useMemo(() => {
    const zips: Record<string, { amount: number; pulseCount: number; lastPulse: string }> = {};
    pulseStrings.forEach((p) => {
      if (p.targetZipCode && p.publicResilienceUsd) {
        if (!zips[p.targetZipCode]) {
          zips[p.targetZipCode] = { amount: 0, pulseCount: 0, lastPulse: p.timestamp };
        }
        zips[p.targetZipCode].amount += p.publicResilienceUsd;
        zips[p.targetZipCode].pulseCount += 1;
        zips[p.targetZipCode].lastPulse = p.timestamp;
      }
    });
    // Add some sample data if empty
    if (Object.keys(zips).length === 0) {
      ['90210', '10001', '60601', '30301', '75201', '85001', '33101', '98101'].forEach((zip, i) => {
        zips[zip] = { amount: Math.floor(Math.random() * 5000 + 500), pulseCount: Math.floor(Math.random() * 20 + 5), lastPulse: new Date().toISOString() };
      });
    }
    return Object.entries(zips).map(([zipCode, data]) => ({ zipCode, ...data }));
  }, [pulseStrings]);

  // Transform entries for SemanticZoom
  const semanticEntries = useMemo(() => {
    return entries.map((e) => ({
      ...e,
      timestamp: e.createdAt,
      poeHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    }));
  }, [entries]);

  const globalStats = useMemo(() => ({
    totalValue: stats?.universalLedger.totalValueUsd || 0,
    totalCarbon: stats?.universalLedger.carbonAvoidedTonnes || 0,
    totalEntries: stats?.universalLedger.totalEntries || 0,
    complianceRate: stats?.compliance.complianceRate || 0,
  }), [stats]);

  return (
    <div className="p-6 space-y-6 bg-[hsl(225,25%,6%)] min-h-screen">
      {/* Header with Sovereign Styling */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="relative">
              <Scale className="w-7 h-7 text-cyan-400" />
              <div className="absolute inset-0 animate-ping opacity-30">
                <Scale className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
              Frequency Settlement Engine
            </span>
            <span className="text-xs px-2 py-0.5 bg-violet-500/20 rounded text-violet-400 font-mono">v2.5</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Living Economic Organism — Transform Invisible Debt into Liquid Overflow
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[hsl(225,25%,10%)] hover:bg-[hsl(225,25%,14%)] rounded-lg text-gray-400 transition-all border border-cyan-500/20 hover:border-cyan-500/40"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Sync Frequency
        </button>
      </div>

      {/* Pulse Wave Equalizer - Always visible at top */}
      <PulseWaveEqualizer velocity={settlementVelocity} latency={settlementLatency} />

      {/* Dynamic Pulse Marquee */}
      <PulseMarquee
        pulses={transformedPulses}
        onPulseHover={setHoveredPulse}
        autoScroll={true}
      />

      {/* Zero Greed Policy Alert */}
      {highFrictionEntries.length > 0 && (
        <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/40 flex items-center justify-between sovereign-glow-magenta">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <div className="font-semibold text-red-300">Zero Greed Policy Violation</div>
              <div className="text-sm text-red-400/80">
                {highFrictionEntries.length} transaction(s) flagged as HIGH-FRICTION. Settlement blocked.
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors">
            Review & Restore
          </button>
        </div>
      )}

      {/* Tab Navigation - Sovereign Style */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-2">
        {[
          { id: 'organism', label: 'Living Organism', icon: Sparkles, glow: 'cyan' },
          { id: 'pentagon', label: 'Sovereign Pentagon', icon: Globe, glow: 'amber' },
          { id: 'pulse', label: 'The Pulse', icon: Activity, glow: 'magenta' },
          { id: 'heartbeat', label: 'Regional Distribution', icon: Heart, glow: 'emerald' },
          { id: 'explorer', label: 'Settlement Explorer', icon: FileText, glow: 'violet' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium',
              activeTab === tab.id
                ? `bg-${tab.glow}-500/20 text-${tab.glow}-400 border border-${tab.glow}-500/40`
                : 'text-gray-500 hover:text-gray-300 hover:bg-[hsl(225,25%,10%)]'
            )}
            style={{
              backgroundColor: activeTab === tab.id ? `hsl(var(--neon-${tab.glow}) / 0.15)` : undefined,
              borderColor: activeTab === tab.id ? `hsl(var(--neon-${tab.glow}) / 0.4)` : undefined,
              color: activeTab === tab.id ? `hsl(var(--neon-${tab.glow}))` : undefined,
            }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB CONTENT ==================== */}

      {/* Living Organism Overview */}
      {activeTab === 'organism' && stats && (
        <div className="space-y-6">
          {/* 70/20/10 Universal Law Banner - Sovereign Style */}
          <div className="relative bg-gradient-to-r from-[hsl(225,25%,8%)] via-[hsl(225,25%,10%)] to-[hsl(225,25%,8%)] rounded-xl p-6 border border-cyan-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkgy0di0yaDEyem0wLTR2Mkgy0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
            <div className="relative flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-amber-500/20 rounded-xl border border-cyan-500/30">
                <Flame className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">
                  The 70/20/10 Universal Law
                </h2>
                <p className="text-gray-500 text-sm">Every unit of value split at the atomic level</p>
              </div>
            </div>
            <div className="relative grid grid-cols-3 gap-4">
              <div className="pentagon-card p-4 border-emerald-500/40">
                <div className="text-4xl font-bold text-emerald-400">70%</div>
                <div className="text-sm font-medium text-emerald-300 mt-1">Asset Sovereign</div>
                <div className="text-xs text-gray-500 mt-2">Direct liquidity for the source of energy</div>
                <div className="text-xs text-emerald-400/70 mt-2 uppercase tracking-wide">Carbon Valuation</div>
                <div className="text-lg font-semibold text-white">
                  ${stats.universalLedger.founderYieldUsd.toLocaleString()}
                </div>
              </div>
              <div className="pentagon-card p-4 border-amber-500/40">
                <div className="text-4xl font-bold text-amber-400">20%</div>
                <div className="text-sm font-medium text-amber-300 mt-1">Platform Processor</div>
                <div className="text-xs text-gray-500 mt-2">Node hardening + Debt-Erasure Protocol</div>
                <div className="text-xs text-amber-400/70 mt-2 uppercase tracking-wide">Carbon Valuation</div>
                <div className="text-lg font-semibold text-white">
                  ${stats.universalLedger.stewardshipUsd.toLocaleString()}
                </div>
              </div>
              <div className="pentagon-card p-4 border-cyan-500/40">
                <div className="text-4xl font-bold text-cyan-400">10%</div>
                <div className="text-sm font-medium text-cyan-300 mt-1">Public Resilience</div>
                <div className="text-xs text-gray-500 mt-2">Non-custodial routing to Public Resilience</div>
                <div className="text-xs text-cyan-400/70 mt-2 uppercase tracking-wide">Carbon Valuation</div>
                <div className="text-lg font-semibold text-white">
                  ${stats.universalLedger.publicResilienceUsd.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Pentagon + Stats */}
          <div className="grid grid-cols-2 gap-6">
            {/* Sovereign Pentagon */}
            <div className="bg-[hsl(225,25%,8%)] rounded-xl p-6 border border-cyan-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                Performance Distribution
              </h3>
              <div className="flex justify-center">
                <SovereignPentagon
                  data={pentagonData}
                  size={340}
                  onNodeHover={(node) => setActivePentagonNode(node)}
                  activeNode={activePentagonNode as any}
                />
              </div>
            </div>

            {/* Regional Distribution */}
            <NeighborhoodHeartbeat
              overflows={zipOverflows}
              totalDistributed={stats.publicResilience.totalDistributedUsd}
            />
          </div>

          {/* Module Summary Cards - Pentagon Style */}
          <div className="grid grid-cols-5 gap-4">
            <div className="pentagon-card-industrial p-4">
              <div className="flex items-center gap-2 mb-3">
                <Factory className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">Industrial</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.module1_deadMass.extractions}</div>
              <div className="text-xs text-gray-500">Extractions</div>
              <div className="text-sm text-amber-400 mt-2">
                {stats.module1_deadMass.carbonAvoidedTonnes.toFixed(2)}t CO₂
              </div>
            </div>
            <div className="pentagon-card-resonance p-4">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-5 h-5 text-pink-400" />
                <span className="text-sm font-semibold text-pink-400">Operational Flow</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.module2_resonance.prints}</div>
              <div className="text-xs text-gray-500">Process Logs</div>
              <div className="text-sm text-pink-400 mt-2">
                {(stats.module2_resonance.totalViews + stats.module2_resonance.totalStreams).toLocaleString()} Active Nodes
              </div>
            </div>
            <div className="pentagon-card-participation p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-violet-400" />
                <span className="text-sm font-semibold text-violet-400">Participation</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.module3_participation.eligibleParticipants}</div>
              <div className="text-xs text-gray-500">Participants</div>
              <div className="text-sm text-violet-400 mt-2">
                ${stats.module3_participation.totalSocialYield.toFixed(2)} Capital Efficiency
              </div>
            </div>
            <div className="pentagon-card-legacy p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Legacy</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {v2Stats?.modules.module4_legacyAudit.totalAudits || 0}
              </div>
              <div className="text-xs text-gray-500">Audits</div>
              <div className="text-sm text-emerald-400 mt-2">
                ${(v2Stats?.modules.module4_legacyAudit.legacyYieldUsd || 0).toLocaleString()}
              </div>
            </div>
            <div className="pentagon-card-equity p-4">
              <div className="flex items-center gap-2 mb-3">
                <Battery className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">Equity</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {v2Stats?.modules.realEstate_vibrationalEquity.totalEquities || 0}
              </div>
              <div className="text-xs text-gray-500">Properties</div>
              <div className="text-sm text-cyan-400 mt-2">
                ${((v2Stats?.modules.realEstate_vibrationalEquity.totalDebtErasedUsd || 0) / 1000).toFixed(1)}k Realized Value
              </div>
            </div>
          </div>

          {/* GENIUS Act Compliance Banner */}
          <div className="bg-gradient-to-r from-violet-900/20 to-purple-900/20 rounded-xl p-4 border border-violet-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-violet-400" />
                <div>
                  <div className="font-semibold text-violet-300">2026 GENIUS Act Compliant</div>
                  <div className="text-xs text-gray-500">All settlements require 64-char Proof of Extraction hash</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-violet-400">{stats.compliance.complianceRate}%</div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sovereign Pentagon Full View */}
      {activeTab === 'pentagon' && stats && (
        <div className="space-y-6">
          <div className="bg-[hsl(225,25%,8%)] rounded-xl p-8 border border-cyan-500/20">
            <div className="flex justify-center">
              <SovereignPentagon
                data={pentagonData}
                size={500}
                onNodeHover={(node) => setActivePentagonNode(node)}
                activeNode={activePentagonNode as any}
              />
            </div>
          </div>

          {/* Active Node Details */}
          {activePentagonNode && (
            <div className="bg-[hsl(225,25%,8%)] rounded-xl p-6 border border-cyan-500/20 animate-fadeIn">
              <h3 className="text-lg font-semibold text-white mb-4">
                {activePentagonNode.charAt(0).toUpperCase() + activePentagonNode.slice(1)} Module Details
              </h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="bg-[hsl(225,25%,10%)] rounded-lg p-4">
                  <div className="text-gray-500">Frequency Score</div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {(pentagonData as any)[activePentagonNode]?.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-[hsl(225,25%,10%)] rounded-lg p-4">
                  <div className="text-gray-500">Status</div>
                  <div className="text-emerald-400 font-semibold">ACTIVE</div>
                </div>
                <div className="bg-[hsl(225,25%,10%)] rounded-lg p-4">
                  <div className="text-gray-500">70% Asset Sovereign</div>
                  <div className="text-white font-semibold">Flowing</div>
                </div>
                <div className="bg-[hsl(225,25%,10%)] rounded-lg p-4">
                  <div className="text-gray-500">10% Public Resilience</div>
                  <div className="text-cyan-400 font-semibold">Distributed</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* The Pulse Full View */}
      {activeTab === 'pulse' && (
        <div className="space-y-6">
          <div className="bg-[hsl(225,25%,8%)] rounded-xl p-6 border border-pink-500/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6 text-pink-400" />
              The Pulse — Real-Time Settlement Feed
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Live settlement strings showing value flowing through the Universal Ledger.
            </p>

            <PulseMarquee
              pulses={transformedPulses}
              onPulseHover={setHoveredPulse}
              autoScroll={true}
              className="mb-6"
            />

            {/* Pulse details */}
            {hoveredPulse && (
              <div className="bg-[hsl(225,25%,10%)] rounded-lg p-4 border border-gray-800">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Pulse Details</h4>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-gray-500">Type</div>
                    <div className="text-white font-mono">{hoveredPulse.type}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Value</div>
                    <div className="text-emerald-400">${hoveredPulse.totalValueUsd.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">10% Public Resilience</div>
                    <div className="text-cyan-400">${hoveredPulse.publicResilienceUsd?.toLocaleString() || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Target Zip</div>
                    <div className="text-amber-400">{hoveredPulse.targetZipCode || '—'}</div>
                  </div>
                </div>
                {hoveredPulse.poeHash && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <div className="text-gray-500 text-xs mb-1">Proof of Extraction (PoE)</div>
                    <div className="text-cyan-400 font-mono text-[10px] break-all">{hoveredPulse.poeHash}</div>
                  </div>
                )}
              </div>
            )}

            {/* Pulse type legend */}
            <div className="grid grid-cols-7 gap-2 mt-6">
              {[
                { type: 'STANDARD', label: 'Standard', color: 'cyan' },
                { type: 'LEGACY', label: 'Legacy', color: 'emerald' },
                { type: 'EQUITY', label: 'Equity', color: 'amber' },
                { type: 'INSURANCE', label: 'Insurance', color: 'violet' },
                { type: 'RENT', label: 'Rent', color: 'pink' },
                { type: 'SALE', label: 'Sale', color: 'cyan' },
                { type: 'AIRBNB', label: 'Airbnb', color: 'blue' },
              ].map((pt) => (
                <div
                  key={pt.type}
                  className="text-center p-2 rounded-lg"
                  style={{ backgroundColor: `hsl(var(--neon-${pt.color}) / 0.1)` }}
                >
                  <div className="text-xs font-medium" style={{ color: `hsl(var(--neon-${pt.color}))` }}>
                    {pt.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Regional Distribution Full View */}
      {activeTab === 'heartbeat' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <NeighborhoodHeartbeat
              overflows={zipOverflows}
              totalDistributed={stats.publicResilience.totalDistributedUsd}
            />
            <div className="bg-[hsl(225,25%,8%)] rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-400" />
                Public Resilience Pool
              </h3>
              <div className="space-y-4">
                <div className="bg-[hsl(225,25%,10%)] rounded-lg p-4">
                  <div className="text-gray-500 text-sm">Total Pool Collected</div>
                  <div className="text-3xl font-bold text-emerald-400">
                    ${stats.universalLedger.publicResilienceUsd.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[hsl(225,25%,10%)] rounded-lg p-4">
                  <div className="text-gray-500 text-sm">Grants Distributed</div>
                  <div className="text-2xl font-bold text-white">{stats.publicResilience.grantsDistributed}</div>
                  <div className="text-xs text-gray-500">${stats.publicResilience.totalDistributedUsd.toLocaleString()} total</div>
                </div>
                <div className="bg-[hsl(225,25%,10%)] rounded-lg p-4">
                  <div className="text-gray-500 text-sm">Pool Available</div>
                  <div className="text-2xl font-bold text-cyan-400">
                    ${stats.publicResilience.poolAvailable.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zero Greed Policy */}
          <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Zero Greed Policy</h3>
            </div>
            <p className="text-gray-400 text-sm">
              If any transaction attempts to bypass the 10% Public Resilience (threshold: 9.9%), it is immediately
              flagged as &ldquo;HIGH-FRICTION&rdquo; and settlement is blocked until the ratio is restored.
            </p>
          </div>
        </div>
      )}

      {/* Settlement Explorer (Semantic Zoom) */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          <SemanticZoom entries={semanticEntries} globalStats={globalStats} />
          
          {/* Capital Markets Ticker Feed */}
          <CapitalMarketsTicker />
        </div>
      )}

      {loading && !stats && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
            <div className="text-gray-500">Syncing frequency data...</div>
          </div>
        </div>
      )}
    </div>
  );
}
