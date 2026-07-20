'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Globe2,
  TrendingUp,
  Shield,
  Search,
  Building2,
  Banknote,
  Leaf,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  MapPin,
  FileCheck,
  Hash,
  Activity,
  ArrowRight,
  Zap,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LedgerStats {
  totalKmAvoided: number;
  totalCo2Vested: number;
  totalCo2VestedTonnes: number;
  totalValueDigitized: number;
  totalVerifications: number;
  totalCredits: number;
  activeNodes: number;
}

interface RegionData {
  name: string;
  totalValue: number;
  totalCo2Avoided: number;
  verificationCount: number;
  nodeCount: number;
}

interface MapNode {
  id: string;
  name: string;
  type: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  securityLevel: number;
  verifications: number;
}

interface TokenLookupResult {
  found: boolean;
  message?: string;
  token?: {
    tokenId: string;
    status: string;
    currencyType: string;
    totalValue: number;
    valueCurrency: string;
    destructionVideoHash: string | null;
    destructionMethod: string | null;
    destructionTimestamp: string | null;
    avoidedCo2Kg: number | null;
    creditStatus: string | null;
    vaultNode: {
      name: string;
      type: string;
      region: string;
      country: string;
    } | null;
    createdAt: string;
  };
}

interface ActivityItem {
  id: string;
  type: 'TRANSACTION' | 'VERIFICATION';
  subtype: string;
  timestamp: string;
  jurisdiction: string;
  toJurisdiction: string | null;
  amount: number;
  currency: string;
  status: string;
  travelRuleTriggered: boolean;
  refId: string;
  nodeName?: string;
}

interface BacktraceResult {
  found: boolean;
  trace?: {
    transactionId: string;
    type: string;
    status: string;
    timestamp: string;
    originator: { jurisdiction: string; wallet: string | null; name: string | null };
    beneficiary: { jurisdiction: string | null; wallet: string | null; name: string | null };
    financial: { currency: string; amount: number; amountUsd: number | null };
    compliance: { travelRuleTriggered: boolean; vatApplicable: boolean };
    creditSplit: { bankShare: number | null; platformShare: number | null; sustainabilityShare: number | null };
    privacyNotice: string;
  };
}

const JURISDICTION_FLAGS: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', SG: '🇸🇬', JP: '🇯🇵', CH: '🇨🇭',
  APAC: '🌏', LATAM: '🌎', MENA: '🌍', UNKNOWN: '🌐',
};

export default function GlobalLedgerContent() {
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [regions, setRegions] = useState<RegionData[]>([]);
  
  // Activity feed state
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  
  // Backtrace state
  const [backtraceQuery, setBacktraceQuery] = useState('');
  const [backtraceResult, setBacktraceResult] = useState<BacktraceResult | null>(null);
  const [backtracing, setBacktracing] = useState(false);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Verification lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<TokenLookupResult | null>(null);
  const [searching, setSearching] = useState(false);

  // Animated counters
  const [displayKm, setDisplayKm] = useState(0);
  const [displayCo2, setDisplayCo2] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/global-ledger');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRegions(data.regions);
        setNodes(data.nodes);
        setLastUpdated(new Date(data.timestamp).toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch ledger data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActivityFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/global-ledger?action=activity-feed&limit=15');
      const data = await res.json();
      if (data.success) {
        setActivityFeed(data.activityFeed);
      }
    } catch (error) {
      console.error('Failed to fetch activity feed:', error);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  const handleBacktrace = async () => {
    if (!backtraceQuery.trim()) return;
    setBacktracing(true);
    setBacktraceResult(null);
    
    try {
      const res = await fetch(`/api/global-ledger?action=backtrace&transactionId=${encodeURIComponent(backtraceQuery.trim())}`);
      const data = await res.json();
      setBacktraceResult(data);
    } catch (error) {
      setBacktraceResult({ found: false });
    } finally {
      setBacktracing(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchActivityFeed();
    const dataInterval = setInterval(fetchData, 30000); // Refresh every 30s
    const activityInterval = setInterval(fetchActivityFeed, 10000); // Refresh every 10s
    return () => {
      clearInterval(dataInterval);
      clearInterval(activityInterval);
    };
  }, [fetchData, fetchActivityFeed]);

  // Animate counters
  useEffect(() => {
    if (!stats) return;
    
    const kmTarget = stats.totalKmAvoided;
    const co2Target = stats.totalCo2Vested;
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setDisplayKm(Math.round(kmTarget * eased));
      setDisplayCo2(Math.round(co2Target * eased * 100) / 100);
      if (step >= steps) clearInterval(timer);
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [stats]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResult(null);
    
    try {
      const res = await fetch(`/api/global-ledger?action=lookup&tokenId=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResult(data);
    } catch (error) {
      setSearchResult({ found: false, message: 'Search failed. Please try again.' });
    } finally {
      setSearching(false);
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Globe2 className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">Live Global Dashboard</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Impact Ledger</span>
            </h1>
            
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
              Real-time transparency into verified currency destruction, carbon credits, 
              and the global network of certified vault nodes.
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdated || 'Loading...'}</span>
              <button onClick={fetchData} className="ml-2 p-1 hover:bg-slate-800 rounded transition-colors">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Live Counters */}
      <section className="relative -mt-8 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kilometers Avoided */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
            <div className="relative bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <TrendingUp className="h-8 w-8 text-violet-400" />
                </div>
                <span className="text-xs px-2 py-1 rounded bg-violet-500/20 text-violet-400 font-mono">LIVE</span>
              </div>
              <p className="text-slate-400 text-sm mb-2">Kilometers of Armored Transport Avoided</p>
              <p className="text-4xl sm:text-5xl font-bold text-white font-mono">
                {displayKm.toLocaleString()}
                <span className="text-2xl text-slate-500 ml-2">km</span>
              </p>
            </div>
          </div>

          {/* CO2 Vested */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
            <div className="relative bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Leaf className="h-8 w-8 text-emerald-400" />
                </div>
                <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono">LIVE</span>
              </div>
              <p className="text-slate-400 text-sm mb-2">Total CO₂ Vested (Avoided Emissions)</p>
              <p className="text-4xl sm:text-5xl font-bold text-white font-mono">
                {displayCo2.toLocaleString()}
                <span className="text-2xl text-slate-500 ml-2">kg</span>
              </p>
              <p className="text-sm text-emerald-400 mt-2">
                ≈ {stats ? (stats.totalCo2VestedTonnes).toFixed(4) : '0'} tonnes CO₂e
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proof of Reserve by Region */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Shield className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Proof of Reserve</h2>
            <p className="text-slate-400 text-sm">Total value of assets digitized by region</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {regions.length > 0 ? regions.map((region) => (
            <div
              key={region.name}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-amber-500/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-amber-400" />
                <h3 className="text-white font-semibold">{region.name}</h3>
              </div>
              <p className="text-3xl font-bold text-amber-400 mb-2">
                {formatValue(region.totalValue)}
              </p>
              <div className="space-y-1 text-sm text-slate-400">
                <p>{region.nodeCount} Active Node{region.nodeCount !== 1 ? 's' : ''}</p>
                <p>{region.verificationCount} Verification{region.verificationCount !== 1 ? 's' : ''}</p>
                <p>{region.totalCo2Avoided.toFixed(2)} kg CO₂ avoided</p>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-12 text-slate-500">
              {loading ? 'Loading regional data...' : 'No regional data available yet'}
            </div>
          )}
        </div>

        {/* Total Summary */}
        {stats && (
          <div className="mt-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-white">{formatValue(stats.totalValueDigitized)}</p>
                <p className="text-sm text-slate-400">Total Digitized</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.activeNodes}</p>
                <p className="text-sm text-slate-400">Active Nodes</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.totalVerifications}</p>
                <p className="text-sm text-slate-400">Verifications</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.totalCredits.toFixed(4)}</p>
                <p className="text-sm text-slate-400">Carbon Credits</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Node Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Globe2 className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Global Node Network</h2>
            <p className="text-slate-400 text-sm">Active certified vault nodes worldwide</p>
          </div>
        </div>

        {/* Interactive World Map */}
        <div className="relative bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden" style={{ minHeight: '500px' }}>
          {/* World map SVG background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 1000 500" className="w-full h-full opacity-20">
              <path
                d="M150,200 Q200,150 250,180 T350,160 T450,180 T550,150 T650,180 T750,150 T850,200
                   M100,250 Q150,220 200,240 T300,230 T400,250 T500,220 T600,250 T700,230 T800,260 T900,240
                   M150,300 Q200,280 250,310 T350,290 T450,320 T550,280 T650,310 T750,290 T850,320"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-emerald-500"
              />
              {/* Simplified continent outlines */}
              <ellipse cx="200" cy="220" rx="80" ry="60" fill="currentColor" className="text-slate-700" />
              <ellipse cx="500" cy="200" rx="100" ry="80" fill="currentColor" className="text-slate-700" />
              <ellipse cx="520" cy="320" rx="60" ry="40" fill="currentColor" className="text-slate-700" />
              <ellipse cx="750" cy="250" rx="120" ry="90" fill="currentColor" className="text-slate-700" />
              <ellipse cx="850" cy="380" rx="50" ry="40" fill="currentColor" className="text-slate-700" />
            </svg>
          </div>

          {/* Animated connection lines */}
          <div className="absolute inset-0">
            <svg className="w-full h-full">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              {nodes.slice(0, 10).map((node, i) => (
                nodes.slice(i + 1, i + 3).map((target, j) => (
                  <line
                    key={`${node.id}-${target.id}`}
                    x1={`${((node.lng + 180) / 360) * 100}%`}
                    y1={`${((90 - node.lat) / 180) * 100}%`}
                    x2={`${((target.lng + 180) / 360) * 100}%`}
                    y2={`${((90 - target.lat) / 180) * 100}%`}
                    stroke="url(#lineGradient)"
                    strokeWidth="1"
                    className="animate-pulse"
                    style={{ animationDelay: `${(i + j) * 200}ms` }}
                  />
                ))
              ))}
            </svg>
          </div>

          {/* Node markers */}
          <div className="absolute inset-0">
            {nodes.map((node) => {
              const x = ((node.lng + 180) / 360) * 100;
              const y = ((90 - node.lat) / 180) * 100;
              return (
                <div
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {/* Pulse ring */}
                  <div className="absolute inset-0 w-6 h-6 -m-1 rounded-full bg-emerald-500/30 animate-ping" />
                  {/* Node dot */}
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 shadow-lg",
                    node.type === 'BANK' ? 'bg-cyan-500 border-cyan-300' :
                    node.type === 'VAULT' ? 'bg-violet-500 border-violet-300' :
                    'bg-emerald-500 border-emerald-300'
                  )} />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl min-w-[200px]">
                      <p className="font-semibold text-white text-sm">{node.name}</p>
                      <p className="text-xs text-slate-400">{node.country || node.region}</p>
                      <div className="mt-2 pt-2 border-t border-slate-700 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">Type</p>
                          <p className="text-white capitalize">{node.type.toLowerCase()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Security</p>
                          <p className="text-white">Level {node.securityLevel}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-500">Verifications</p>
                          <p className="text-emerald-400">{node.verifications}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2 font-medium">Node Types</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-xs text-white">Bank</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-xs text-white">Repository</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-white">Certified Processor</span>
              </div>
            </div>
          </div>

          {/* Stats overlay */}
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">{nodes.length}</p>
            <p className="text-xs text-slate-400">Active Nodes</p>
          </div>
        </div>
      </section>

      {/* Verification Lookup */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <FileCheck className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Verification Lookup</h2>
            <p className="text-slate-400 text-sm">Enter a token ID to view the associated destruction proof</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Token ID or Verification ID (e.g., VLT-2026-XXXXX)"
                className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {searching ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              Search
            </button>
          </div>

          {/* Search Results */}
          {searchResult && (
            <div className={cn(
              "border rounded-xl p-6 transition-all",
              searchResult.found 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : "bg-red-500/10 border-red-500/30"
            )}>
              {searchResult.found && searchResult.token ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      <div>
                        <p className="text-white font-semibold text-lg">Token Verified</p>
                        <p className="text-slate-400 text-sm font-mono">{searchResult.token.tokenId}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      searchResult.token.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                      searchResult.token.status === 'DESTRUCTION_UPLOADED' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-amber-500/20 text-amber-400'
                    )}>
                      {searchResult.token.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Currency Type</p>
                        <p className="text-white font-medium">{searchResult.token.currencyType.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Total Value</p>
                        <p className="text-white font-medium">
                          {searchResult.token.valueCurrency} {searchResult.token.totalValue.toLocaleString()}
                        </p>
                      </div>
                      {searchResult.token.vaultNode && (
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Processing Node</p>
                          <p className="text-white font-medium">{searchResult.token.vaultNode.name}</p>
                          <p className="text-slate-500 text-sm">
                            {searchResult.token.vaultNode.country || searchResult.token.vaultNode.region}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {searchResult.token.destructionMethod && (
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Destruction Method</p>
                          <p className="text-white font-medium capitalize">
                            {searchResult.token.destructionMethod.toLowerCase()}
                          </p>
                        </div>
                      )}
                      {searchResult.token.avoidedCo2Kg && (
                        <div>
                          <p className="text-slate-400 text-sm mb-1">CO₂ Avoided</p>
                          <p className="text-emerald-400 font-medium">
                            {searchResult.token.avoidedCo2Kg.toFixed(2)} kg
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Created</p>
                        <p className="text-white font-medium">
                          {new Date(searchResult.token.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Video Hash */}
                  {searchResult.token.destructionVideoHash && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="h-5 w-5 text-violet-400" />
                        <p className="text-white font-semibold">Destruction Video Hash</p>
                      </div>
                      <p className="font-mono text-sm text-emerald-400 break-all bg-slate-950 rounded-lg p-3">
                        {searchResult.token.destructionVideoHash}
                      </p>
                      <p className="text-slate-500 text-xs mt-2">
                        SHA-256 hash of the destruction video, anchored to Hedera Consensus Service
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-400" />
                  <div>
                    <p className="text-white font-semibold">Token Not Found</p>
                    <p className="text-slate-400 text-sm">
                      {searchResult.message || 'No record found for this token ID. Please verify the ID and try again.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Note */}
          <div className="mt-6 flex items-start gap-3 text-sm text-slate-500">
            <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>
              All verification records are immutably stored and linked to the Hedera Consensus Service.
              The video hash serves as cryptographic proof that the destruction video has not been altered.
            </p>
          </div>
        </div>
      </section>

      {/* Live International Activity Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Activity className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Live International Activity</h2>
            <p className="text-slate-400 text-sm">Real-time cross-border transactions and verifications</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 text-xs font-medium">LIVE</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            {loadingActivity ? (
              <div className="p-8 text-center text-slate-400">Loading activity...</div>
            ) : activityFeed.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No recent activity</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {activityFeed.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Type Icon */}
                      <div className={cn(
                        "p-2 rounded-lg",
                        item.type === 'TRANSACTION' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
                      )}>
                        {item.type === 'TRANSACTION' ? (
                          <Banknote className={cn("h-5 w-5", item.type === 'TRANSACTION' ? 'text-blue-400' : 'text-emerald-400')} />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        )}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{JURISDICTION_FLAGS[item.jurisdiction] || '🌐'}</span>
                          {item.toJurisdiction && (
                            <>
                              <ArrowRight className="h-4 w-4 text-slate-500" />
                              <span className="text-lg">{JURISDICTION_FLAGS[item.toJurisdiction] || '🌐'}</span>
                            </>
                          )}
                          <span className="text-white font-medium">
                            {item.type === 'TRANSACTION' ? item.subtype : item.nodeName || 'Verification'}
                          </span>
                          {item.travelRuleTriggered && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded">
                              Travel Rule
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm truncate">
                          {item.refId}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p className="text-white font-mono">
                          {item.currency === 'CO2_KG' 
                            ? `${item.amount.toFixed(2)} kg CO₂`
                            : `$${item.amount.toLocaleString()}`
                          }
                        </p>
                        <p className="text-slate-500 text-xs">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>

                      {/* Status */}
                      <div className={cn(
                        "px-2 py-1 rounded text-xs",
                        item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-500/10 text-slate-400'
                      )}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Backtracking Tool */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Zap className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Transaction Backtracking</h2>
            <p className="text-slate-400 text-sm">Trace cross-border transactions with privacy compliance</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={backtraceQuery}
                onChange={(e) => setBacktraceQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBacktrace()}
                placeholder="Enter Transaction ID (e.g., TXN-1234567890-ABCD)"
                className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleBacktrace}
              disabled={backtracing || !backtraceQuery.trim()}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {backtracing ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              Trace
            </button>
          </div>

          {/* Trace Results */}
          {backtraceResult && (
            <div className={cn(
              "border rounded-xl p-6 transition-all",
              backtraceResult.found 
                ? "bg-violet-500/10 border-violet-500/30" 
                : "bg-red-500/10 border-red-500/30"
            )}>
              {backtraceResult.found && backtraceResult.trace ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold text-lg">Transaction Trace</p>
                      <p className="text-slate-400 text-sm font-mono">{backtraceResult.trace.transactionId}</p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      backtraceResult.trace.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-amber-500/20 text-amber-400'
                    )}>
                      {backtraceResult.trace.status}
                    </span>
                  </div>

                  {/* Flow Visualization */}
                  <div className="flex items-center justify-center gap-4 py-6 bg-slate-900/50 rounded-xl">
                    <div className="text-center">
                      <span className="text-4xl">{JURISDICTION_FLAGS[backtraceResult.trace.originator.jurisdiction] || '🌐'}</span>
                      <p className="text-white font-medium mt-2">{backtraceResult.trace.originator.jurisdiction}</p>
                      <p className="text-slate-400 text-xs">{backtraceResult.trace.originator.wallet}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4">
                      <div className="h-px w-12 bg-gradient-to-r from-violet-500 to-transparent" />
                      <div className="p-2 rounded-full bg-violet-500/20">
                        <ArrowRight className="h-5 w-5 text-violet-400" />
                      </div>
                      <div className="h-px w-12 bg-gradient-to-l from-cyan-500 to-transparent" />
                    </div>
                    <div className="text-center">
                      <span className="text-4xl">{JURISDICTION_FLAGS[backtraceResult.trace.beneficiary.jurisdiction || 'UNKNOWN'] || '🌐'}</span>
                      <p className="text-white font-medium mt-2">{backtraceResult.trace.beneficiary.jurisdiction || 'N/A'}</p>
                      <p className="text-slate-400 text-xs">{backtraceResult.trace.beneficiary.wallet}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-2">Financial</p>
                      <p className="text-white font-mono text-lg">
                        {backtraceResult.trace.financial.currency} {backtraceResult.trace.financial.amount.toLocaleString()}
                      </p>
                      {backtraceResult.trace.financial.amountUsd && (
                        <p className="text-slate-500 text-sm">≈ ${backtraceResult.trace.financial.amountUsd.toLocaleString()} USD</p>
                      )}
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-2">Credit Split (70/20/10)</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-emerald-400">Bank: {backtraceResult.trace.creditSplit.bankShare?.toFixed(4) || 0}</p>
                        <p className="text-cyan-400">Platform: {backtraceResult.trace.creditSplit.platformShare?.toFixed(4) || 0}</p>
                        <p className="text-violet-400">Sustainability: {backtraceResult.trace.creditSplit.sustainabilityShare?.toFixed(4) || 0}</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-2">Compliance</p>
                      <div className="space-y-1">
                        {backtraceResult.trace.compliance.travelRuleTriggered && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-xs">
                            <AlertTriangle className="h-3 w-3" /> Travel Rule
                          </span>
                        )}
                        {backtraceResult.trace.compliance.vatApplicable && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs ml-1">
                            VAT Applied
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Privacy Notice */}
                  <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg text-sm">
                    <Lock className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-400">
                      {backtraceResult.trace.privacyNotice}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-400" />
                  <div>
                    <p className="text-white font-semibold">Transaction Not Found</p>
                    <p className="text-slate-400 text-sm">
                      No record found for this transaction ID. Please verify the ID and try again.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 p-8 sm:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
          
          <div className="relative text-center">
            <Building2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Join the Global Network
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto mb-8">
              Become a certified vault node and participate in the future of secure currency 
              digitization. Earn carbon credits while ensuring global financial security.
            </p>
            <Link
              href="/signup/agent"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all"
            >
              Apply for Certification
              <ExternalLink className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            © 2026 Bedrock ESG Protocol. All carbon credits verified via Hedera Guardian Framework.
          </p>
        </div>
      </footer>
    </div>
  );
}
