'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Recycle, Scale, TreePine, Car, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetalStats {
  totalLogs: number;
  verifiedLogs: number;
  pendingLogs: number;
  totalWeightKg: number;
  verifiedWeightKg: number;
  totalAvoidedEmissionsKg: number;
  totalAvoidedEmissionsTonnes: number;
  verifiedAvoidedEmissionsKg: number;
  verifiedAvoidedEmissionsTonnes: number;
  byMetalType: Array<{
    metalType: string;
    count: number;
    totalWeightKg: number;
    avoidedEmissionsKg: number;
  }>;
  recentActivity: {
    logsCount: number;
    weightKg: number;
    avoidedEmissionsKg: number;
  };
  equivalentTreesPlanted: number;
  equivalentCarMilesAvoided: number;
}

const metalTypeColors: Record<string, string> = {
  STEEL: 'bg-slate-500',
  ALUMINUM: 'bg-gray-400',
  COPPER: 'bg-orange-600',
  BRASS: 'bg-yellow-600',
  STAINLESS: 'bg-slate-400',
  MIXED: 'bg-purple-500',
  OTHER: 'bg-gray-500',
};

export default function MetalDashboard() {
  const [stats, setStats] = useState<MetalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/metal/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch metal stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Recovery Logs"
          value={stats?.totalLogs ?? 0}
          icon={Recycle}
          color="cyan"
        />
        <StatCard
          title="Verified Avoided"
          value={stats?.verifiedAvoidedEmissionsTonnes ?? 0}
          suffix="t CO₂"
          icon={CheckCircle2}
          color="emerald"
          decimals={2}
        />
        <StatCard
          title="Total Metal Recovered"
          value={(stats?.totalWeightKg ?? 0) / 1000}
          suffix="tonnes"
          icon={Scale}
          color="blue"
          decimals={2}
        />
        <StatCard
          title="Pending Verification"
          value={stats?.pendingLogs ?? 0}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Equivalencies */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TreePine className="h-5 w-5 text-green-500" />
            Environmental Equivalencies
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
              <span className="text-sm">Trees Planted Equivalent</span>
              <span className="text-xl font-bold text-green-500">
                {(stats?.equivalentTreesPlanted ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
              <span className="text-sm flex items-center gap-2">
                <Car className="h-4 w-4" /> Car Miles Avoided
              </span>
              <span className="text-xl font-bold text-blue-500">
                {(stats?.equivalentCarMilesAvoided ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* By Metal Type */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">By Metal Type</h3>
          {stats?.byMetalType && stats.byMetalType.length > 0 ? (
            <div className="space-y-3">
              {stats.byMetalType.map((item) => (
                <div key={item.metalType} className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', metalTypeColors[item.metalType] || 'bg-gray-500')} />
                  <span className="flex-1 text-sm">{item.metalType}</span>
                  <span className="text-sm text-muted-foreground">
                    {(item.totalWeightKg / 1000).toFixed(2)}t
                  </span>
                  <span className="text-sm font-medium text-cyan-500">
                    {(item.avoidedEmissionsKg / 1000).toFixed(2)}t CO₂
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No metal recovery data yet.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/metal/calculator"
          className="group rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-cyan-500/20 p-3 group-hover:bg-cyan-500/30 transition-colors">
              <Scale className="h-6 w-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold">Carbon Calculator</h3>
              <p className="text-sm text-muted-foreground">Calculate avoided emissions for new recoveries</p>
            </div>
          </div>
        </Link>

        <Link
          href="/metal/logs"
          className="group rounded-xl border border-slate-500/30 bg-gradient-to-br from-slate-500/10 to-slate-600/5 p-6 hover:border-slate-500/50 hover:shadow-lg hover:shadow-slate-500/10 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-slate-500/20 p-3 group-hover:bg-slate-500/30 transition-colors">
              <Recycle className="h-6 w-6 text-slate-500" />
            </div>
            <div>
              <h3 className="font-semibold">View All Logs</h3>
              <p className="text-sm text-muted-foreground">Browse and manage recovery records</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Emission Factors Reference */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Emission Factors Reference</h3>
        <p className="text-sm text-muted-foreground mb-4">
          CO₂ avoided per kg of recycled metal (vs virgin production)
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Steel</p>
            <p className="font-bold">1.89 kg CO₂/kg</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Aluminum</p>
            <p className="font-bold">9.70 kg CO₂/kg</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Copper</p>
            <p className="font-bold">2.80 kg CO₂/kg</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Stainless</p>
            <p className="font-bold">4.10 kg CO₂/kg</p>
          </div>
        </div>
      </div>
    </div>
  );
}
