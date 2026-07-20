'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, Shield, Lock } from 'lucide-react';

interface SovereignEquityCardProps {
  score: number;
  change?: number;
  isVerified?: boolean;
}

export default function SovereignEquityCard({ score, change = 0, isVerified = false }: SovereignEquityCardProps) {
  const formatScore = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="relative bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
      {/* Accent Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
      
      {/* Trust Indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
          isVerified 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : "bg-gray-800 text-gray-500"
        )}>
          <Shield className="w-3 h-3" />
          <span>{isVerified ? 'Verified' : 'Pending'}</span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Label */}
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-gray-500" />
          <p className="text-sm text-gray-400 font-medium">Sovereign Equity Score</p>
        </div>

        {/* Main Score - Large, Centered */}
        <div className="text-center py-6">
          <p className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            {formatScore(score)}
          </p>
          
          {/* Change Indicator */}
          {change !== 0 && (
            <div className={cn(
              "inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-sm",
              change > 0 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-red-500/20 text-red-400"
            )}>
              <TrendingUp className={cn("w-4 h-4", change < 0 && "rotate-180")} />
              <span>{change > 0 ? '+' : ''}{change.toFixed(2)}%</span>
              <span className="text-gray-500">this period</span>
            </div>
          )}
        </div>

        {/* Encrypted Label */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
          <Lock className="w-3 h-3" />
          <span>End-to-End Encrypted • Private Ledger</span>
        </div>
      </div>
    </div>
  );
}
