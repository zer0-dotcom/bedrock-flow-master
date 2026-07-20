'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FolderOpen, Leaf, Gauge, Target, Fingerprint, Shield, AlertCircle } from 'lucide-react';
import { DashboardStats } from '@/lib/types';
import AethexProtocolWidget from './aethex-protocol-widget';

export default function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
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

  if (error) {
    return (
      <div className="rounded-xl bg-slate-500/10 border border-slate-700 p-6 text-center">
        <p className="text-slate-400">No active data points to report. Begin your first assessment using the Carbon Calculator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects ?? 0}
          icon={FolderOpen}
          color="blue"
        />
        <StatCard
          title="Carbon Credits Saved"
          value={stats?.totalCarbonSaved ?? 0}
          suffix="tonnes"
          icon={Leaf}
          color="emerald"
          decimals={2}
        />
        <StatCard
          title="Average Carbon Score"
          value={stats?.averageCarbonScore ?? 0}
          suffix="kg/ton"
          icon={Gauge}
          color="amber"
          decimals={1}
        />
        <StatCard
          title="Green Target Projects"
          value={stats?.projectsMeetingGreenTarget ?? 0}
          suffix={`(${(stats?.greenTargetPercentage ?? 0).toFixed(0)}%)`}
          icon={Target}
          color="emerald"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <a
          href="/calculator"
          className="group rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-500/20 p-3 group-hover:bg-emerald-500/30 transition-colors">
              <Gauge className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold">Carbon Calculator</h3>
              <p className="text-sm text-muted-foreground">Calculate emissions for new projects</p>
            </div>
          </div>
        </a>

        <a
          href="/projects"
          className="group rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-500/20 p-3 group-hover:bg-blue-500/30 transition-colors">
              <FolderOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">View Projects</h3>
              <p className="text-sm text-muted-foreground">Browse all saved projects</p>
            </div>
          </div>
        </a>

        <a
          href="/analytics"
          className="group rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-amber-500/20 p-3 group-hover:bg-amber-500/30 transition-colors">
              <Target className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-muted-foreground">View performance insights</p>
            </div>
          </div>
        </a>
      </div>

      {/* Info Panel and Aethex Protocol */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Platform Overview</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-emerald-600 dark:text-emerald-400">Core Capabilities</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Certified LCA Carbon Modeling (A1–A3 Lifecycle)</li>
                <li>• Automated Mix Optimization with GHG Targeting</li>
                <li>• On-Chain Verification Ledger (Solana-Anchored)</li>
                <li>• Real-Time Operational Telemetry &amp; Reporting</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-emerald-600 dark:text-emerald-400">Operational KPIs</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Industry Benchmark: 60 kg CO₂/ton</li>
                <li>• Green Bid Target: &lt;45 kg CO₂/ton</li>
                <li>• Max RAP (Surface): 25%</li>
                <li>• Max RAP (Base): 40%</li>
              </ul>
            </div>
          </div>

          {/* Aethex Protocol Integration Note */}
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-violet-900/20 to-cyan-900/20 border border-violet-500/20">
            <div className="flex items-start gap-3">
              <Fingerprint className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-violet-400 mb-1">Aethex Protocol Integration</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  All verification operations are now processed through the Aethex Protocol Universal Truth Layer,
                  proprietary IP of ZerO. This significantly reduces physical armored transport dependency with up to 100% GHG reduction for qualifying digital transfers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Aethex Protocol Widget */}
        <AethexProtocolWidget />
      </div>

      {/* Due4 System Note Banner */}
      <div className="rounded-xl bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-amber-900/30 border border-amber-500/30 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-amber-400">Due4 Economic Note</h4>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SYSTEM ADVISORY
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Assets verified by the <span className="text-violet-400 font-medium">Aethex Protocol</span> are processed into secure on-chain assets,
              significantly reducing the dependency on physical carbon-intensive security (Armored Transport).
              GHG savings calculations reflect <span className="text-emerald-400 font-medium">up to 100% reduction</span> for qualifying Armored Digital Packet transfers.
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-bold text-emerald-400">-2.7</div>
            <div className="text-[10px] text-gray-500">kg CO2e/mile saved</div>
          </div>
        </div>
      </div>
    </div>
  );
}
