'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Leaf,
  DollarSign,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface TickerEntry {
  symbol: string;
  name: string;
  lastTrade: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  greenAlpha: number;
  verificationRate: number;
  timestamp: string;
}

interface BedrockIndex {
  symbol: string;
  name: string;
  value: number;
  change24h: number;
  changePercent24h: number;
  greenAlpha: number;
  components: number;
}

interface MarketSummary {
  totalVolume: number;
  totalValue: number;
  totalGreenAlpha: number;
  verifiedTrades: number;
  speculativeTrades: number;
  carbonPrice: number;
  marketStatus: string;
}

interface TickerData {
  ticker: TickerEntry[];
  index: BedrockIndex;
  marketSummary: MarketSummary;
}

export default function CapitalMarketsTicker({ className }: { className?: string }) {
  const [data, setData] = useState<TickerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTickerData = async () => {
    try {
      const response = await fetch('/api/trade-settlement/ticker?period=24h');
      if (!response.ok) throw new Error('Failed to fetch ticker data');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickerData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTickerData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className={cn('bg-[hsl(225,25%,8%)] rounded-xl border border-gray-700 p-6', className)}>
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn('bg-[hsl(225,25%,8%)] rounded-xl border border-gray-700 p-6', className)}>
        <div className="flex items-center justify-center h-48 text-gray-500">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span className="text-sm">Unable to load market data</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-[hsl(225,25%,8%)] rounded-xl border border-gray-700 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-emerald-900/20 to-cyan-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Capital Markets</h3>
              <p className="text-[10px] text-gray-500">Green Alpha Trading Feed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
              data.marketSummary.marketStatus === 'OPEN'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            )}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {data.marketSummary.marketStatus}
            </div>
            <button
              onClick={fetchTickerData}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Bedrock Index */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-cyan-900/10 to-violet-900/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500">{data.index.symbol}</div>
            <div className="text-lg font-bold text-white">
              ${data.index.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right">
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              data.index.changePercent24h >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {data.index.changePercent24h >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {data.index.changePercent24h >= 0 ? '+' : ''}
              {data.index.changePercent24h.toFixed(2)}%
            </div>
            <div className="text-[10px] text-gray-500">
              {data.index.components} Components
            </div>
          </div>
        </div>
      </div>

      {/* Ticker Tape */}
      <div className="overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-2 border-b border-gray-800 bg-black/20">
          {[...data.ticker, ...data.ticker].map((entry, idx) => (
            <div key={`${entry.symbol}-${idx}`} className="flex items-center gap-3 px-4">
              <span className="text-xs font-mono text-cyan-400">{entry.symbol}</span>
              <span className="text-xs text-white font-medium">
                ${entry.lastTrade.toFixed(2)}
              </span>
              <span className={cn(
                'text-xs font-medium',
                entry.changePercent24h >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {entry.changePercent24h >= 0 ? '↑' : '↓'}
                {Math.abs(entry.changePercent24h).toFixed(1)}%
              </span>
              <span className="text-gray-600">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ticker List */}
      <div className="max-h-[200px] overflow-y-auto">
        {data.ticker.map((entry) => (
          <div
            key={entry.symbol}
            className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <span className="text-[10px] font-bold text-cyan-400">
                  {entry.symbol.split('.')[1]}
                </span>
              </div>
              <div>
                <div className="text-xs font-medium text-white">{entry.name}</div>
                <div className="text-[10px] text-gray-500">{entry.symbol}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-mono text-white">
                  ${entry.lastTrade.toFixed(2)}
                </div>
                <div className={cn(
                  'text-[10px]',
                  entry.changePercent24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {entry.changePercent24h >= 0 ? '+' : ''}
                  {entry.changePercent24h.toFixed(2)}%
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Leaf className="w-3 h-3" />
                  {entry.greenAlpha.toFixed(2)}t
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Activity className="w-3 h-3" />
                  {entry.volume24h}
                </div>
              </div>
              <div className="w-12">
                {entry.verificationRate >= 90 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : entry.verificationRate >= 50 ? (
                  <Zap className="w-4 h-4 text-amber-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Market Summary Footer */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-900/30">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xs font-bold text-cyan-400">
              ${(data.marketSummary.totalValue / 1000).toFixed(1)}k
            </div>
            <div className="text-[9px] text-gray-500">Total Value</div>
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400">
              {data.marketSummary.totalGreenAlpha.toFixed(1)}t
            </div>
            <div className="text-[9px] text-gray-500">Green Alpha</div>
          </div>
          <div>
            <div className="text-xs font-bold text-violet-400">
              {data.marketSummary.totalVolume}
            </div>
            <div className="text-[9px] text-gray-500">Trades</div>
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400">
              ${data.marketSummary.carbonPrice}
            </div>
            <div className="text-[9px] text-gray-500">$/tCO2e</div>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="px-4 py-1 border-t border-gray-800 bg-black/20">
        <div className="flex items-center justify-between text-[9px] text-gray-600">
          <span>Layer 3 Feed • Aethex Protocol</span>
          <span>Updated: {lastUpdate?.toLocaleTimeString()}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
