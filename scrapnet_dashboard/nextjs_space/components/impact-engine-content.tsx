'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  TrendingUp,
  Zap,
  Globe,
  Server,
  PieChart,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Leaf,
  Building2,
  FileText,
  RefreshCw,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataCenter {
  id: string;
  name: string;
  region: string;
  coordinates: string;
  pue: number;
  gridCarbonIntensity: number;
  estimatedCapacityMW: number;
  operator: string;
  exchanges: string[];
}

interface DigitalHumData {
  timestamp: string;
  estimatedGlobalTradesPerSecond: number;
  estimatedEnergyDrawMW: number;
  co2ePerSecond: number;
  activeDataCenters: string[];
  marketStatus: 'PEAK' | 'ACTIVE' | 'LOW' | 'OVERNIGHT';
  activeDataCenterDetails: DataCenter[];
  dailyEstimate: {
    tradesPerDay: number;
    co2eKgPerDay: number;
    co2eTonnesPerDay: number;
  };
  backtrace: {
    backtraceId: string;
    type: string;
    dataLineage: Array<{
      source: string;
      dataType: string;
      methodology: string;
      confidence: string;
    }>;
  };
}

interface StockCarbon {
  ticker: string;
  companyName: string;
  sector: string;
  scope1: number;
  scope2: number;
  scope3: number;
  totalIntensity: number;
  sustainabilityRating: string;
  dataSource: string;
}

interface Holding {
  ticker: string;
  shares: number;
  currentPrice: number;
  companyName?: string;
}

interface PortfolioResult {
  holdings: Array<{
    ticker: string;
    companyName: string;
    sector: string;
    shares: number;
    value: number;
    scope1Contribution: number;
    scope2Contribution: number;
    scope3Contribution: number;
    totalContribution: number;
    sustainabilityRating: string;
    dataSource: string;
  }>;
  totals: {
    portfolioValue: number;
    totalScope1: number;
    totalScope2: number;
    totalScope3: number;
    totalCarbonDebt: number;
    weightedIntensity: number;
    averageRating: string;
  };
  equivalencies: {
    carMilesEquivalent: number;
    flightsNYtoLA: number;
    homeYearsEquivalent: number;
    treesToOffset: number;
  };
  backtraceId: string;
}

interface AvailableCredit {
  verificationId: string;
  creditAmount: number;
  creditType: string;
  destructionHash?: string;
}

export default function ImpactEngineContent() {
  const [activeTab, setActiveTab] = useState<'digital-hum' | 'live-telemetry' | 'portfolio' | 'zero-offset' | 'backtrace'>('digital-hum');
  
  // Digital Hum state
  const [humData, setHumData] = useState<DigitalHumData | null>(null);
  const [humLoading, setHumLoading] = useState(true);
  
  // Portfolio state
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [allStocks, setAllStocks] = useState<StockCarbon[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [newHolding, setNewHolding] = useState({ ticker: '', shares: '', price: '' });
  const [portfolioResult, setPortfolioResult] = useState<PortfolioResult | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  
  // ZerO Offset state
  const [availableCredits, setAvailableCredits] = useState<AvailableCredit[]>([]);
  const [selectedCredits, setSelectedCredits] = useState<string[]>([]);
  const [institutionName, setInstitutionName] = useState('');
  const [offsetLoading, setOffsetLoading] = useState(false);
  const [offsetResult, setOffsetResult] = useState<any>(null);
  
  // Backtrace state
  const [backtraceId, setBacktraceId] = useState('');
  const [backtraceResult, setBacktraceResult] = useState<any>(null);
  const [backtraceLoading, setBacktraceLoading] = useState(false);

  // Live Telemetry state
  interface TelemetryNode {
    nodeId: string;
    powerUsageKw: number;
    pueRatio: number;
    carbonPerTradeG: number;
    gridIntensityScore: number;
    sentinelVerdict: string | null;
    sentinelScore: number | null;
    settled: boolean;
    settlementId: string | null;
    lastIngestedAt: string;
  }
  const [telemetryNodes, setTelemetryNodes] = useState<TelemetryNode[]>([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [telemetryLastRefresh, setTelemetryLastRefresh] = useState<Date | null>(null);

  // Fetch Live Telemetry data
  const fetchTelemetryNodes = useCallback(async () => {
    setTelemetryLoading(true);
    setTelemetryError(null);
    try {
      const res = await fetch('/api/v1/telemetry-ingest');
      const data = await res.json();
      if (data.nodes) {
        setTelemetryNodes(data.nodes);
      }
      setTelemetryLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching telemetry:', err);
      setTelemetryError('Failed to fetch telemetry data');
    } finally {
      setTelemetryLoading(false);
    }
  }, []);

  // Auto-refresh telemetry every 60s when tab is active
  useEffect(() => {
    if (activeTab === 'live-telemetry') {
      fetchTelemetryNodes();
      const interval = setInterval(fetchTelemetryNodes, 60000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchTelemetryNodes]);

  // Fetch Digital Hum data
  const fetchHumData = useCallback(async () => {
    try {
      const res = await fetch('/api/impact?action=digital-hum');
      const data = await res.json();
      setHumData(data);
    } catch (err) {
      console.error('Error fetching hum data:', err);
    } finally {
      setHumLoading(false);
    }
  }, []);

  // Fetch stock data
  const fetchStockData = useCallback(async () => {
    try {
      const [tickersRes, stocksRes] = await Promise.all([
        fetch('/api/impact?action=tickers'),
        fetch('/api/impact?action=all-stocks'),
      ]);
      const tickersData = await tickersRes.json();
      const stocksData = await stocksRes.json();
      setAvailableTickers(tickersData.tickers || []);
      setAllStocks(stocksData.stocks || []);
    } catch (err) {
      console.error('Error fetching stock data:', err);
    }
  }, []);

  // Fetch available credits
  const fetchAvailableCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/impact?action=available-credits');
      const data = await res.json();
      setAvailableCredits(data.availableCredits || []);
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  }, []);

  useEffect(() => {
    fetchHumData();
    fetchStockData();
    fetchAvailableCredits();
    
    // Refresh hum data every 10 seconds
    const interval = setInterval(fetchHumData, 10000);
    return () => clearInterval(interval);
  }, [fetchHumData, fetchStockData, fetchAvailableCredits]);

  // Add holding
  const addHolding = () => {
    if (!newHolding.ticker || !newHolding.shares || !newHolding.price) return;
    
    const stock = allStocks.find(s => s.ticker.toUpperCase() === newHolding.ticker.toUpperCase());
    
    setHoldings(prev => [...prev, {
      ticker: newHolding.ticker.toUpperCase(),
      shares: parseFloat(newHolding.shares),
      currentPrice: parseFloat(newHolding.price),
      companyName: stock?.companyName,
    }]);
    setNewHolding({ ticker: '', shares: '', price: '' });
  };

  // Remove holding
  const removeHolding = (index: number) => {
    setHoldings(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate portfolio carbon
  const calculatePortfolio = async () => {
    if (holdings.length === 0) return;
    
    setPortfolioLoading(true);
    try {
      const res = await fetch('/api/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'portfolio-carbon',
          holdings: holdings.map(h => ({
            ticker: h.ticker,
            shares: h.shares,
            currentPrice: h.currentPrice,
          })),
        }),
      });
      const data = await res.json();
      setPortfolioResult(data);
    } catch (err) {
      console.error('Error calculating portfolio:', err);
    } finally {
      setPortfolioLoading(false);
    }
  };

  // Process ZerO offset
  const processOffset = async () => {
    if (!portfolioResult || selectedCredits.length === 0 || !institutionName) return;
    
    setOffsetLoading(true);
    try {
      const creditsToRetire = availableCredits
        .filter(c => selectedCredits.includes(c.verificationId))
        .map(c => ({
          verificationId: c.verificationId,
          creditAmount: c.creditAmount,
          creditType: c.creditType,
          destructionHash: c.destructionHash,
        }));
      
      const res = await fetch('/api/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'zero-offset',
          portfolioBacktraceId: portfolioResult.backtraceId,
          carbonDebtTonnes: portfolioResult.totals.totalCarbonDebt,
          retiredCredits: creditsToRetire,
          institutionId: `INST-${Date.now()}`,
          institutionName,
        }),
      });
      const data = await res.json();
      setOffsetResult(data);
      fetchAvailableCredits(); // Refresh available credits
    } catch (err) {
      console.error('Error processing offset:', err);
    } finally {
      setOffsetLoading(false);
    }
  };

  // Search backtrace
  const searchBacktrace = async () => {
    if (!backtraceId) return;
    
    setBacktraceLoading(true);
    try {
      const res = await fetch(`/api/impact?action=backtrace&id=${backtraceId}`);
      const data = await res.json();
      setBacktraceResult(data);
    } catch (err) {
      console.error('Error searching backtrace:', err);
    } finally {
      setBacktraceLoading(false);
    }
  };

  const getMarketStatusColor = (status: string) => {
    switch (status) {
      case 'PEAK': return 'text-red-400 bg-red-500/20';
      case 'ACTIVE': return 'text-amber-400 bg-amber-500/20';
      case 'LOW': return 'text-blue-400 bg-blue-500/20';
      case 'OVERNIGHT': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'A': return 'text-emerald-400 bg-emerald-500/20';
      case 'B': return 'text-lime-400 bg-lime-500/20';
      case 'C': return 'text-amber-400 bg-amber-500/20';
      case 'D': return 'text-orange-400 bg-orange-500/20';
      case 'F': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-rose-400" />
            Financed Emissions Impact Engine
          </h1>
          <p className="text-gray-400 mt-1">
            Track digital trade footprints, portfolio carbon intensity, and neutralize with ZerO Protocol
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'digital-hum', label: 'Digital Hum', icon: Zap },
          { id: 'live-telemetry', label: 'Live Telemetry', icon: Server },
          { id: 'portfolio', label: 'Portfolio Calculator', icon: PieChart },
          { id: 'zero-offset', label: 'ZerO Protocol', icon: Leaf },
          { id: 'backtrace', label: 'Data Transparency', icon: Search },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all',
              activeTab === tab.id
                ? 'bg-gray-800 text-rose-400 border-b-2 border-rose-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Digital Hum Tab */}
      {activeTab === 'digital-hum' && (
        <div className="space-y-6">
          {/* Digital Hum Visualization */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-rose-400" />
                The Digital Hum — Real-Time Energy Draw
              </h2>
              {humData && (
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getMarketStatusColor(humData.marketStatus))}>
                  {humData.marketStatus}
                </span>
              )}
            </div>

            {humLoading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
              </div>
            ) : humData ? (
              <div className="space-y-6">
                {/* Main Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-rose-400">
                      {humData.estimatedGlobalTradesPerSecond.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Trades/Second</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-amber-400">
                      {humData.estimatedEnergyDrawMW.toFixed(1)} MW
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Energy Draw</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-cyan-400">
                      {humData.co2ePerSecond.toLocaleString()} g
                    </div>
                    <div className="text-sm text-gray-400 mt-1">CO₂e/Second</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">
                      {humData.dailyEstimate.co2eTonnesPerDay.toFixed(1)} t
                    </div>
                    <div className="text-sm text-gray-400 mt-1">CO₂e/Day Est.</div>
                  </div>
                </div>

                {/* Energy Pulse Animation */}
                <div className="relative h-32 bg-gray-900/30 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">Operational Carbon Per Trade</div>
                      <div className="text-2xl font-bold text-white">2.45g CO₂e</div>
                    </div>
                  </div>
                  {/* Animated pulse rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-64 h-64 rounded-full border border-rose-500/30"
                        style={{
                          animation: `pulse-ring 3s ease-out infinite`,
                          animationDelay: `${i * 1}s`,
                        }}
                      />
                    ))}
                  </div>
                  <style jsx>{`
                    @keyframes pulse-ring {
                      0% { transform: scale(0.3); opacity: 0.8; }
                      100% { transform: scale(1.5); opacity: 0; }
                    }
                  `}</style>
                </div>

                {/* Active Data Centers */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Active Financial Data Centers ({humData.activeDataCenterDetails.length})
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {humData.activeDataCenterDetails.map(dc => (
                      <div key={dc.id} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">{dc.name}</div>
                            <div className="text-xs text-gray-500">{dc.operator}</div>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">PUE:</span>{' '}
                            <span className="text-gray-300">{dc.pue}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Capacity:</span>{' '}
                            <span className="text-gray-300">{dc.estimatedCapacityMW}MW</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Grid Intensity:</span>{' '}
                            <span className="text-gray-300">{dc.gridCarbonIntensity} gCO₂/kWh</span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {dc.exchanges.slice(0, 3).map(ex => (
                            <span key={ex} className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Backtrace Info */}
                <div className="text-xs text-gray-500 flex items-center justify-between border-t border-gray-700 pt-3">
                  <span>Backtrace ID: <code className="text-rose-400">{humData.backtrace.backtraceId}</code></span>
                  <span>Last updated: {new Date(humData.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No active data points to report. Begin your first assessment using the Carbon Calculator.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Telemetry Tab */}
      {activeTab === 'live-telemetry' && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-rose-400" />
                Live Data Center Telemetry
              </h2>
              <div className="flex items-center gap-3">
                {telemetryLastRefresh && (
                  <span className="text-xs text-gray-500">
                    Last refresh: {telemetryLastRefresh.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={fetchTelemetryNodes}
                  disabled={telemetryLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors text-sm disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', telemetryLoading && 'animate-spin')} />
                  Refresh
                </button>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Active node telemetry feeds push every 60 seconds. Sentinel verification auto-triggers Dynamic BPS settlement on <code className="text-emerald-400">AUTO_APPROVED</code> verdict.
            </p>

            {telemetryError && (
              <div className="flex items-center gap-2 text-amber-400 mb-4 bg-amber-500/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{telemetryError}</span>
              </div>
            )}

            {telemetryNodes.length === 0 && !telemetryLoading && !telemetryError ? (
              <div className="text-center py-12">
                <Server className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No active telemetry nodes detected.</p>
                <p className="text-gray-500 text-sm mt-1">Nodes will appear once they begin pushing telemetry via <code className="text-rose-400">POST /api/v1/telemetry-ingest</code></p>
              </div>
            ) : (
              <div className="grid gap-4">
                {telemetryNodes.map((node) => {
                  const ingestedDate = new Date(node.lastIngestedAt);
                  const ageSeconds = Math.floor((Date.now() - ingestedDate.getTime()) / 1000);
                  const isStale = ageSeconds > 120; // >2min = stale
                  const isRecent = ageSeconds <= 60;

                  return (
                    <div
                      key={node.nodeId}
                      className={cn(
                        'rounded-xl p-5 border transition-all',
                        isRecent
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : isStale
                            ? 'bg-gray-800/30 border-gray-700/50'
                            : 'bg-gray-800/50 border-gray-700'
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-3 h-3 rounded-full',
                            isRecent ? 'bg-emerald-400 animate-pulse' : isStale ? 'bg-gray-500' : 'bg-amber-400'
                          )} />
                          <div>
                            <h3 className="text-white font-mono font-semibold text-sm">{node.nodeId}</h3>
                            <p className="text-gray-500 text-xs">
                              {isRecent ? 'LIVE' : isStale ? 'STALE' : 'ACTIVE'} · Last ingested {ageSeconds < 60 ? `${ageSeconds}s ago` : ageSeconds < 3600 ? `${Math.floor(ageSeconds / 60)}m ago` : `${Math.floor(ageSeconds / 3600)}h ago`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {node.sentinelVerdict && (
                            <span className={cn(
                              'px-2 py-0.5 rounded text-xs font-mono',
                              node.sentinelVerdict === 'AUTO_APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : node.sentinelVerdict === 'REJECTED'
                                  ? 'bg-red-500/20 text-red-400'
                                  : node.sentinelVerdict === 'SOVEREIGN_HOLD'
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : node.sentinelVerdict === 'ESCROW_REVIEW'
                                      ? 'bg-cyan-500/20 text-cyan-400'
                                      : node.sentinelVerdict === 'PENDING_PLATFORM_REVIEW'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'bg-amber-500/20 text-amber-400'
                            )}>
                              {node.sentinelVerdict.replace(/_/g, ' ')}
                            </span>
                          )}
                          {node.settled && (
                            <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/20 text-blue-400">
                              SETTLED
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Power Draw</p>
                          <p className="text-white font-mono text-sm">{node.powerUsageKw.toLocaleString()} kW</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">PUE Ratio</p>
                          <p className="text-white font-mono text-sm">{node.pueRatio.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Carbon/Trade</p>
                          <p className="text-white font-mono text-sm">{node.carbonPerTradeG.toFixed(1)}g</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Grid Intensity</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                              <div
                                className={cn(
                                  'h-1.5 rounded-full',
                                  node.gridIntensityScore < 0.3 ? 'bg-emerald-400' : node.gridIntensityScore < 0.6 ? 'bg-amber-400' : 'bg-red-400'
                                )}
                                style={{ width: `${node.gridIntensityScore * 100}%` }}
                              />
                            </div>
                            <span className="text-white font-mono text-sm">{(node.gridIntensityScore * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      {node.sentinelScore !== null && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-xs">Sentinel Composite Score</span>
                            <span className="text-white font-mono text-xs">{(node.sentinelScore * 100).toFixed(1)}%</span>
                          </div>
                          <div className="mt-1 bg-gray-700 rounded-full h-1">
                            <div
                              className={cn(
                                'h-1 rounded-full transition-all',
                                node.sentinelScore >= 0.85 ? 'bg-emerald-400' : node.sentinelScore >= 0.65 ? 'bg-amber-400' : 'bg-red-400'
                              )}
                              style={{ width: `${node.sentinelScore * 100}%` }}
                            />
                          </div>
                          {node.settlementId && (
                            <p className="text-gray-500 text-xs mt-2 font-mono">
                              Settlement: {node.settlementId}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-gray-600 text-xs font-mono">
                          {ingestedDate.toISOString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary Stats */}
            {telemetryNodes.length > 0 && (
              <div className="mt-6 grid grid-cols-4 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-xs mb-1">Active Nodes</p>
                  <p className="text-2xl font-bold text-white">{telemetryNodes.length}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-xs mb-1">Total Power</p>
                  <p className="text-2xl font-bold text-white">
                    {telemetryNodes.reduce((sum, n) => sum + n.powerUsageKw, 0).toLocaleString()} kW
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-xs mb-1">Avg PUE</p>
                  <p className="text-2xl font-bold text-white">
                    {(telemetryNodes.reduce((sum, n) => sum + n.pueRatio, 0) / telemetryNodes.length).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-xs mb-1">Auto-Settled</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {telemetryNodes.filter(n => n.settled).length}/{telemetryNodes.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Calculator Tab */}
      {activeTab === 'portfolio' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Holdings Input */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-rose-400" />
              Portfolio Holdings
            </h2>

            {/* Add Holding Form */}
            <div className="flex gap-2 mb-4">
              <select
                value={newHolding.ticker}
                onChange={(e) => setNewHolding(prev => ({ ...prev, ticker: e.target.value }))}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Select Ticker</option>
                {availableTickers.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Shares"
                value={newHolding.shares}
                onChange={(e) => setNewHolding(prev => ({ ...prev, shares: e.target.value }))}
                className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              />
              <input
                type="number"
                placeholder="Price $"
                value={newHolding.price}
                onChange={(e) => setNewHolding(prev => ({ ...prev, price: e.target.value }))}
                className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              />
              <button
                onClick={addHolding}
                disabled={!newHolding.ticker || !newHolding.shares || !newHolding.price}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Holdings List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {holdings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Add holdings to calculate portfolio carbon debt
                </div>
              ) : (
                holdings.map((h, i) => {
                  const stock = allStocks.find(s => s.ticker === h.ticker);
                  return (
                    <div key={i} className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-white">{h.ticker}</div>
                        <div className="text-sm text-gray-400">
                          {h.shares} shares @ ${h.currentPrice}
                        </div>
                        {stock && (
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getRatingColor(stock.sustainabilityRating))}>
                            {stock.sustainabilityRating}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          ${(h.shares * h.currentPrice).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeHolding(i)}
                          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {holdings.length > 0 && (
              <button
                onClick={calculatePortfolio}
                disabled={portfolioLoading}
                className="w-full mt-4 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {portfolioLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Calculate Carbon Debt
                  </>
                )}
              </button>
            )}
          </div>

          {/* Results */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-rose-400" />
              Carbon Debt Analysis
            </h2>

            {portfolioResult ? (
              <div className="space-y-4">
                {/* Total Debt */}
                <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg p-4 border border-red-500/30">
                  <div className="text-sm text-gray-400">Total Carbon Debt</div>
                  <div className="text-3xl font-bold text-red-400">
                    {portfolioResult.totals.totalCarbonDebt.toFixed(3)} tCO₂e
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Portfolio Value: ${portfolioResult.totals.portfolioValue.toLocaleString()}
                  </div>
                </div>

                {/* Scope Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-400">
                      {portfolioResult.totals.totalScope1.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500">Scope 1 (Direct)</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-cyan-400">
                      {portfolioResult.totals.totalScope2.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500">Scope 2 (Indirect)</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-400">
                      {portfolioResult.totals.totalScope3.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500">Scope 3 (Value Chain)</div>
                  </div>
                </div>

                {/* Equivalencies */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">🚗 Car Miles</div>
                    <div className="text-lg font-semibold text-white">
                      {portfolioResult.equivalencies.carMilesEquivalent.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">✈️ Flights NY-LA</div>
                    <div className="text-lg font-semibold text-white">
                      {portfolioResult.equivalencies.flightsNYtoLA}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">🏠 Home-Years</div>
                    <div className="text-lg font-semibold text-white">
                      {portfolioResult.equivalencies.homeYearsEquivalent}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">🌳 Trees to Offset</div>
                    <div className="text-lg font-semibold text-white">
                      {portfolioResult.equivalencies.treesToOffset.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Backtrace */}
                <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
                  <span>Backtrace ID: <code className="text-rose-400">{portfolioResult.backtraceId}</code></span>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Calculate portfolio to see carbon debt analysis
              </div>
            )}
          </div>
        </div>
      )}

      {/* ZerO Offset Tab */}
      {activeTab === 'zero-offset' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-xl p-6 border border-emerald-500/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <Leaf className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">The ZerO Offset Protocol</h2>
                <p className="text-gray-400 mt-1">
                  Neutralize your portfolio carbon debt by retiring Tokenization Prints (Avoided Logistics Credits)
                  generated from physical specie decommissioning.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Available Credits */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Available Tokenization Prints
              </h3>

              {availableCredits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  No credits available for retirement
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableCredits.map(credit => (
                    <label
                      key={credit.verificationId}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all',
                        selectedCredits.includes(credit.verificationId)
                          ? 'bg-emerald-900/30 border border-emerald-500/50'
                          : 'bg-gray-900/50 border border-transparent hover:border-gray-600'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCredits.includes(credit.verificationId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCredits(prev => [...prev, credit.verificationId]);
                            } else {
                              setSelectedCredits(prev => prev.filter(id => id !== credit.verificationId));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-white">
                            {credit.verificationId}
                          </div>
                          <div className="text-xs text-gray-500">
                            {credit.creditType.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">
                          {credit.creditAmount.toFixed(4)} tCO₂e
                        </div>
                        {credit.destructionHash && (
                          <div className="text-xs text-gray-500">Verified</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Institution Input */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <label className="text-sm text-gray-400 block mb-2">Institution Name</label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Enter institution name"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              {portfolioResult && selectedCredits.length > 0 && institutionName && (
                <button
                  onClick={processOffset}
                  disabled={offsetLoading}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  {offsetLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Neutralize Carbon Debt
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Offset Result */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Offset Certificate
              </h3>

              {offsetResult ? (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                    offsetResult.result.status === 'COMPLETE' ? 'bg-emerald-500/20 text-emerald-400' :
                    offsetResult.result.status === 'PARTIAL' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  )}>
                    {offsetResult.result.status === 'COMPLETE' && <CheckCircle2 className="w-4 h-4" />}
                    {offsetResult.result.status}
                  </div>

                  {/* Certificate Details */}
                  <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 rounded-lg p-4 border border-emerald-500/20">
                    <div className="text-xs text-gray-500 mb-2">ZerO Protocol Certificate</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Offset ID</span>
                        <code className="text-emerald-400 text-sm">{offsetResult.result.offsetId}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Original Debt</span>
                        <span className="text-white">{offsetResult.result.originalDebt.toFixed(3)} tCO₂e</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Credits Retired</span>
                        <span className="text-emerald-400">{offsetResult.result.creditsRetired.toFixed(4)} tCO₂e</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Remaining Debt</span>
                        <span className="text-red-400">{offsetResult.result.remainingDebt.toFixed(3)} tCO₂e</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Coverage</span>
                        <span className="text-white">{offsetResult.result.coveragePercent.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Valid Until */}
                  <div className="text-sm text-gray-500">
                    Valid until: {new Date(offsetResult.result.certificate.validUntil).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                  <Leaf className="w-12 h-12 mb-2 opacity-30" />
                  <p>Calculate portfolio debt first, then select credits to retire</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backtrace Tab */}
      {activeTab === 'backtrace' && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-rose-400" />
              Data Transparency — Backtrackable Emissions
            </h2>
            <p className="text-gray-400 mb-4">
              Every emissions calculation is fully auditable. Enter a Backtrace ID to see exactly which 
              data centers and company footprints contributed to the total.
            </p>

            {/* Search */}
            <div className="flex gap-2">
              <input
                type="text"
                value={backtraceId}
                onChange={(e) => setBacktraceId(e.target.value)}
                placeholder="Enter Backtrace ID (e.g., 7A3F2B1C9D4E8F01)"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <button
                onClick={searchBacktrace}
                disabled={!backtraceId || backtraceLoading}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {backtraceLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </button>
            </div>

            {/* Result */}
            {backtraceResult && (
              <div className="mt-6 bg-gray-900/50 rounded-lg p-4">
                {backtraceResult.found ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      Record Found
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Backtrace ID</div>
                        <code className="text-rose-400">{backtraceResult.backtraceId}</code>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Type</div>
                        <span className="text-white">{backtraceResult.emissionType || backtraceResult.type}</span>
                      </div>
                      {backtraceResult.totalEmissions && (
                        <div>
                          <div className="text-sm text-gray-500">Total Emissions</div>
                          <span className="text-white">{backtraceResult.totalEmissions.toFixed(6)} tCO₂e</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-gray-500">Created</div>
                        <span className="text-white">{new Date(backtraceResult.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {backtraceResult.backtraceData?.dataLineage && (
                      <div className="border-t border-gray-700 pt-4">
                        <div className="text-sm text-gray-500 mb-2">Data Lineage</div>
                        <div className="space-y-2">
                          {backtraceResult.backtraceData.dataLineage.map((item: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 text-sm">
                              <ArrowRight className="w-4 h-4 text-gray-500 mt-0.5" />
                              <div>
                                <div className="text-white">{item.source}</div>
                                <div className="text-gray-500">{item.methodology}</div>
                                <span className={cn(
                                  'inline-block mt-1 px-2 py-0.5 rounded text-xs',
                                  item.confidence === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400' :
                                  item.confidence === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-red-500/20 text-red-400'
                                )}>
                                  {item.confidence} Confidence
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                    {backtraceResult.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Calculations */}
          {portfolioResult && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-md font-semibold text-white mb-3">Recent Session Calculations</h3>
              <div className="flex items-center gap-4 bg-gray-900/50 rounded-lg p-3">
                <div className="text-sm">
                  <span className="text-gray-400">Portfolio Carbon:</span>{' '}
                  <code className="text-rose-400">{portfolioResult.backtraceId}</code>
                </div>
                <button
                  onClick={() => {
                    setBacktraceId(portfolioResult.backtraceId);
                    searchBacktrace();
                  }}
                  className="text-sm text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Lookup
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
