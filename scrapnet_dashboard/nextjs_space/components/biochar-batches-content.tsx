'use client';

import { useState, useEffect } from 'react';
import { Package, Download, Trash2, Eye, CheckCircle2, AlertTriangle, Clock, Filter } from 'lucide-react';
import { cn, formatNumber, formatDate, downloadJson } from '@/lib/utils';
import { BiocharBatchData, BiocharDashboardStats } from '@/lib/types';

export default function BiocharBatchesContent() {
  const [batches, setBatches] = useState<BiocharBatchData[]>([]);
  const [stats, setStats] = useState<BiocharDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    feedstockType: '',
    stabilityClass: '',
  });
  const [selectedBatch, setSelectedBatch] = useState<BiocharBatchData | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.feedstockType) params.set('feedstockType', filters.feedstockType);
      if (filters.stabilityClass) params.set('stabilityClass', filters.stabilityClass);

      const [batchesRes, statsRes] = await Promise.all([
        fetch(`/api/biochar?${params}`),
        fetch('/api/biochar/stats'),
      ]);

      const batchesData = await batchesRes.json();
      const statsData = await statsRes.json();

      setBatches(Array.isArray(batchesData) ? batchesData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    try {
      await fetch(`/api/biochar/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  const handleExportAll = () => {
    const guardianData = batches.map((b) => JSON.parse(b.hederaGuardianJson));
    downloadJson(guardianData, 'all-batches-guardian.json');
  };

  const getStabilityBadge = (stability: string) => {
    switch (stability) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3" /> Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="h-3 w-3" /> Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Total Batches</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalBatches}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Total CDR Credits</p>
            <p className="text-2xl font-bold text-amber-600">{formatNumber(stats.totalCdrCredits, 2)} t</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Biochar Yield</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(stats.totalBiocharYield, 0)} kg</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">High Stability %</p>
            <p className="text-2xl font-bold text-emerald-600">{formatNumber(stats.highStabilityPercentage, 1)}%</p>
          </div>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={filters.feedstockType}
            onChange={(e) => setFilters({ ...filters, feedstockType: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">All Feedstock</option>
            <option value="agricultural_waste">Agricultural Waste</option>
            <option value="wood_chips">Wood Chips</option>
            <option value="used_soil">Used Soil</option>
            <option value="crop_residues">Crop Residues</option>
          </select>
          <select
            value={filters.stabilityClass}
            onChange={(e) => setFilters({ ...filters, stabilityClass: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">All Stability</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <button
          onClick={handleExportAll}
          disabled={batches.length === 0}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export All Guardian JSON
        </button>
      </div>

      {/* Batches Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : batches.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-500">
            <Package className="h-12 w-12 mb-2 opacity-50" />
            <p>No biochar batches found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Batch ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Feedstock</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Weight</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">CDR Credits</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Stability</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white">
                    {batch.batchId.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(batch.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white capitalize">
                    {batch.feedstockType.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                    {formatNumber(batch.dryWeightKg, 0)} kg
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-amber-600">
                    {formatNumber(batch.cdrCreditsTonnes, 4)} t
                  </td>
                  <td className="px-4 py-3">
                    {getStabilityBadge(batch.stabilityClass)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadJson(JSON.parse(batch.hederaGuardianJson), `guardian-${batch.batchId}.json`)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(batch.id)}
                        className="rounded p-1 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Batch Details</h3>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Batch ID</p>
                  <p className="font-mono text-sm text-slate-900 dark:text-white">{selectedBatch.batchId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm text-slate-900 dark:text-white">{formatDate(selectedBatch.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Feedstock Type</p>
                  <p className="text-sm capitalize text-slate-900 dark:text-white">{selectedBatch.feedstockType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dry Weight</p>
                  <p className="text-sm text-slate-900 dark:text-white">{formatNumber(selectedBatch.dryWeightKg, 2)} kg</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pyrolysis Temp</p>
                  <p className="text-sm text-slate-900 dark:text-white">{selectedBatch.pyrolysisTempCelsius}°C</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">H:Corg Ratio</p>
                  <p className="text-sm text-slate-900 dark:text-white">{selectedBatch.hCorgRatio}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CDR Credits</p>
                  <p className="text-sm font-semibold text-amber-600">{formatNumber(selectedBatch.cdrCreditsTonnes, 4)} tonnes</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Permanence</p>
                  <p className="text-sm text-slate-900 dark:text-white">{selectedBatch.permanenceYears}+ years</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Hedera Guardian Metadata</p>
                <pre className="rounded-lg bg-slate-100 p-4 text-xs overflow-x-auto dark:bg-slate-800">
                  {JSON.stringify(JSON.parse(selectedBatch.hederaGuardianJson), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
