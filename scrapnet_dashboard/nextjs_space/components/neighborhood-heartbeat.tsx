'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Heart, DollarSign } from 'lucide-react';

interface ZipOverflow {
  zipCode: string;
  amount: number;
  pulseCount: number;
  lastPulse: string;
}

interface NeighborhoodHeartbeatProps {
  overflows: ZipOverflow[];
  totalDistributed: number;
  className?: string;
}

// Simulated US map positions for zip codes (simplified grid)
const getZipPosition = (zipCode: string): { x: number; y: number } => {
  const zip = parseInt(zipCode.slice(0, 3)) || 0;
  // Map 0-999 to grid positions
  const col = (zip % 20) / 20;
  const row = Math.floor(zip / 50) / 20;
  return {
    x: 10 + col * 80,
    y: 10 + row * 80,
  };
};

export default function NeighborhoodHeartbeat({
  overflows,
  totalDistributed,
  className,
}: NeighborhoodHeartbeatProps) {
  const activeZips = useMemo(() => {
    return overflows.slice(0, 12).map((o) => ({
      ...o,
      position: getZipPosition(o.zipCode),
    }));
  }, [overflows]);

  const maxAmount = useMemo(() => {
    return Math.max(...overflows.map((o) => o.amount), 100);
  }, [overflows]);

  return (
    <div className={cn('relative', className)}>
      <div className="bg-[hsl(225,25%,8%)] rounded-xl border border-cyan-500/20 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Heart className="w-5 h-5 text-cyan-400" />
              <div className="absolute inset-0 animate-ping">
                <Heart className="w-5 h-5 text-cyan-400 opacity-30" />
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-300">Regional Distribution</span>
          </div>
          <div className="text-xs text-gray-500">10% Public Resilience</div>
        </div>

        {/* Map visualization */}
        <div className="relative h-48 bg-[hsl(225,25%,6%)] rounded-lg overflow-hidden border border-gray-800">
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(225 20% 12%)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Zip beacons */}
          {activeZips.map((zip, i) => {
            const size = 8 + (zip.amount / maxAmount) * 16;
            const intensity = zip.amount / maxAmount;
            return (
              <div
                key={zip.zipCode}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{
                  left: `${zip.position.x}%`,
                  top: `${zip.position.y}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                {/* Glow ring */}
                <div
                  className="absolute rounded-full animate-ping"
                  style={{
                    width: size * 2.5,
                    height: size * 2.5,
                    left: -(size * 0.75),
                    top: -(size * 0.75),
                    background: `radial-gradient(circle, hsl(175 95% 50% / ${0.2 + intensity * 0.3}) 0%, transparent 70%)`,
                  }}
                />
                {/* Core beacon */}
                <div
                  className="rounded-full animate-heartbeat"
                  style={{
                    width: size,
                    height: size,
                    background: `radial-gradient(circle, hsl(175 95% ${50 + intensity * 20}%) 0%, hsl(175 95% 40%) 100%)`,
                    boxShadow: `0 0 ${10 + intensity * 20}px hsl(175 95% 50% / ${0.5 + intensity * 0.5})`,
                  }}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-[hsl(225,25%,12%)] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                    <div className="flex items-center gap-1 text-cyan-400 font-semibold">
                      <MapPin className="w-3 h-3" />
                      {zip.zipCode}
                    </div>
                    <div className="text-gray-400 mt-1">
                      ${zip.amount.toLocaleString()} <span className="text-cyan-400/60">Financial Offset</span>
                    </div>
                    <div className="text-gray-500">
                      {zip.pulseCount} pulses
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[10px] text-gray-500">Active Overflow Zone</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              ${(totalDistributed / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-gray-500">Carbon Offset Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {overflows.length}
            </div>
            <div className="text-[10px] text-gray-500">Active Zip Codes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">
              {overflows.reduce((sum, o) => sum + o.pulseCount, 0)}
            </div>
            <div className="text-[10px] text-gray-500">Total Pulses</div>
          </div>
        </div>

        {/* Recent overflows list */}
        <div className="mt-4 max-h-32 overflow-y-auto space-y-1">
          {overflows.slice(0, 5).map((overflow) => (
            <div
              key={overflow.zipCode}
              className="flex items-center justify-between px-2 py-1.5 bg-[hsl(225,25%,10%)] rounded text-xs"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-cyan-500" />
                <span className="text-gray-300 font-mono">{overflow.zipCode}</span>
              </div>
              <div className="flex items-center gap-1 text-cyan-400">
                <DollarSign className="w-3 h-3" />
                {overflow.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
