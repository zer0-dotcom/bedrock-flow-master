'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Leaf, Flame, Recycle, TreePine, Car, Home, TrendingUp } from 'lucide-react';

interface CarbonImpactData {
  totalVerifiedImpactTonnes: number;
  totalImpactTonnes: number;
  timestamp: string;
  asphalt: {
    name: string;
    icon: string;
    projectCount: number;
    savedKg: number;
    savedTonnes: number;
    unit: string;
    displayValue: number;
    contributionPercent: number;
  };
  biochar: {
    name: string;
    icon: string;
    batchCount: number;
    verifiedTonnes: number;
    totalTonnes: number;
    unit: string;
    displayValue: number;
    contributionPercent: number;
  };
  metal: {
    name: string;
    icon: string;
    logCount: number;
    avoidedKg: number;
    avoidedTonnes: number;
    totalTonnes: number;
    unit: string;
    displayValue: number;
    contributionPercent: number;
  };
  equivalencies: {
    treesPlanted: number;
    carMilesAvoided: number;
    homesYearOffset: number;
  };
}

const iconMap = {
  emerald: Leaf,
  amber: Flame,
  cyan: Recycle,
};

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-500',
    progress: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    progress: 'bg-amber-500',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-500',
    progress: 'bg-cyan-500',
  },
};

export default function TotalCarbonImpact() {
  const [data, setData] = useState<CarbonImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const res = await fetch('/api/carbon-impact');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to fetch carbon impact:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchImpact();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-8">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const engines = [
    { key: 'asphalt', data: data.asphalt, color: 'emerald' as const },
    { key: 'biochar', data: data.biochar, color: 'amber' as const },
    { key: 'metal', data: data.metal, color: 'cyan' as const },
  ];

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header - Total Impact */}
      <div className="bg-gradient-to-r from-emerald-600/20 via-amber-600/20 to-cyan-600/20 p-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Total Carbon Impact
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Unified verified impact across all three engines
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-4xl font-bold bg-gradient-to-r from-emerald-500 via-amber-500 to-cyan-500 bg-clip-text text-transparent">
              {data.totalVerifiedImpactTonnes.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">tonnes CO₂e verified</p>
          </div>
        </div>
      </div>

      {/* Engine Breakdown */}
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {engines.map(({ key, data: engineData, color }) => {
            const Icon = iconMap[color];
            const colors = colorClasses[color];
            return (
              <div
                key={key}
                className={cn(
                  'rounded-xl border p-4 transition-all hover:shadow-md',
                  colors.bg,
                  colors.border
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-2 rounded-lg', colors.bg)}>
                      <Icon className={cn('h-5 w-5', colors.text)} />
                    </div>
                    <span className="font-medium text-sm">{engineData.name}</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className={cn('text-2xl font-bold', colors.text)}>
                    {key === 'asphalt'
                      ? `${engineData.displayValue.toLocaleString()} kg`
                      : `${engineData.displayValue.toFixed(2)} t`}
                  </p>
                  <p className="text-xs text-muted-foreground">CO₂ {key === 'asphalt' ? 'saved' : key === 'biochar' ? 'sequestered' : 'avoided'}</p>
                </div>

                {/* Contribution Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Contribution</span>
                    <span className={colors.text}>{engineData.contributionPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', colors.progress)}
                      style={{ width: `${Math.min(engineData.contributionPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Equivalencies */}
        <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
            <TreePine className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-lg font-bold text-green-500">
                {data.equivalencies.treesPlanted.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Trees planted equivalent</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10">
            <Car className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-lg font-bold text-blue-500">
                {data.equivalencies.carMilesAvoided.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Car miles avoided</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10">
            <Home className="h-6 w-6 text-purple-500" />
            <div>
              <p className="text-lg font-bold text-purple-500">
                {data.equivalencies.homesYearOffset.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Homes offset (1 year)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
