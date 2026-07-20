'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatCard } from '@/components/ui/stat-card';
import { Leaf, Gauge, Target, FolderOpen } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface AnalyticsData {
  cumulativeSavings: Array<{ date: string; cumulative: number; individual: number }>;
  rapTrends: Array<{ month: string; avgRapUsage: number; projectCount: number }>;
  mixDistribution: Array<{ name: string; value: number }>;
  monthlyPerformance: Array<{ month: string; avgCarbonScore: number; projectCount: number }>;
  summary: {
    totalCO2Saved: number;
    avgRapUsage: number;
    greenTargetPercentage: number;
    totalProjects: number;
  };
}

const COLORS = ['#10B981', '#60A5FA', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
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

  const hasData = (data?.summary?.totalProjects ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total CO₂ Saved"
          value={data?.summary?.totalCO2Saved ?? 0}
          suffix="tonnes"
          icon={Leaf}
          color="emerald"
          decimals={2}
        />
        <StatCard
          title="Average RAP Usage"
          value={data?.summary?.avgRapUsage ?? 0}
          suffix="%"
          icon={Gauge}
          color="blue"
          decimals={1}
        />
        <StatCard
          title="Green Target Rate"
          value={data?.summary?.greenTargetPercentage ?? 0}
          suffix="%"
          icon={Target}
          color="emerald"
          decimals={1}
        />
        <StatCard
          title="Total Projects"
          value={data?.summary?.totalProjects ?? 0}
          icon={FolderOpen}
          color="amber"
        />
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border bg-card">
          <div className="rounded-full bg-muted p-6 mb-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">No Data Available</p>
          <p className="text-sm text-muted-foreground mt-1">
            Save some projects in the Calculator to see analytics
          </p>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Cumulative Carbon Savings */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Cumulative Carbon Savings</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.cumulativeSavings ?? []}>
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      label={{ value: 'Tonnes CO₂', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: 11,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                      name="Cumulative Savings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RAP Usage Trends */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">RAP Usage Trends</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.rapTrends ?? []}>
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      label={{ value: 'Avg RAP %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: 11,
                      }}
                    />
                    <Bar
                      dataKey="avgRapUsage"
                      fill="#60A5FA"
                      radius={[4, 4, 0, 0]}
                      name="Avg RAP Usage %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mix Type Distribution */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Mix Type Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.mixDistribution ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {(data?.mixDistribution ?? []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS?.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: 11,
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Carbon Performance */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Fleet-Wide Carbon Performance</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.monthlyPerformance ?? []}>
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      domain={[0, 70]}
                      label={{ value: 'kg CO₂/ton', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: 11,
                      }}
                    />
                    <Bar
                      dataKey="avgCarbonScore"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                      name="Avg Carbon Score"
                    />
                    {/* Green target reference line */}
                    <Line
                      type="monotone"
                      dataKey={() => 45}
                      stroke="#10B981"
                      strokeDasharray="5 5"
                      dot={false}
                      legendType="none"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-0.5 w-4 bg-emerald-500" style={{ borderStyle: 'dashed' }} />
                  Green Target (45 kg/ton)
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
