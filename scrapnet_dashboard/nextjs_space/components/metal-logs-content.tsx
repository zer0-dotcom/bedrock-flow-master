'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Recycle, CheckCircle2, Clock, XCircle, Download, Search } from 'lucide-react';

interface MetalLog {
  id: string;
  logId: string;
  createdAt: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  metalType: string;
  weightKg: number;
  purityPercent: number;
  sourceDescription: string | null;
  avoidedEmissionsKg: number;
  emissionFactorUsed: number;
  notes: string | null;
}

const statusConfig = {
  PENDING: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  VERIFIED: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  REJECTED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

const metalTypeColors: Record<string, string> = {
  STEEL: 'bg-slate-500',
  ALUMINUM: 'bg-gray-400',
  COPPER: 'bg-orange-600',
  BRASS: 'bg-yellow-600',
  STAINLESS: 'bg-slate-400',
  MIXED: 'bg-purple-500',
  OTHER: 'bg-gray-500',
};

export default function MetalLogsContent() {
  const [logs, setLogs] = useState<MetalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams();
        if (filter !== 'all') params.append('status', filter);
        const res = await fetch(`/api/metal?${params}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [filter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.logId.toLowerCase().includes(search) ||
      log.metalType.toLowerCase().includes(search) ||
      log.sourceDescription?.toLowerCase().includes(search)
    );
  });

  const handleExport = () => {
    const data = filteredLogs.map((log) => ({
      logId: log.logId,
      date: new Date(log.createdAt).toLocaleDateString(),
      metalType: log.metalType,
      weightKg: log.weightKg,
      purityPercent: log.purityPercent,
      avoidedEmissionsKg: log.avoidedEmissionsKg,
      avoidedEmissionsTonnes: (log.avoidedEmissionsKg / 1000).toFixed(3),
      status: log.verificationStatus,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metal-recovery-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === 'all'
                ? 'bg-cyan-500 text-white'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === 'PENDING'
                ? 'bg-amber-500 text-white'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('VERIFIED')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === 'VERIFIED'
                ? 'bg-green-500 text-white'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            Verified
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length > 0 ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Log ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Metal Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Weight</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Avoided CO₂</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLogs.map((log) => {
                const status = statusConfig[log.verificationStatus];
                const StatusIcon = status.icon;
                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{log.logId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', metalTypeColors[log.metalType])} />
                        <span className="text-sm">{log.metalType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{log.weightKg.toLocaleString()} kg</span>
                      <span className="text-xs text-muted-foreground ml-1">({log.purityPercent}%)</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-cyan-500">
                        {(log.avoidedEmissionsKg / 1000).toFixed(3)} t
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs', status.bg, status.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {log.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl border">
          <Recycle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No metal recovery logs found</p>
        </div>
      )}
    </div>
  );
}
