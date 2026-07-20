'use client';

import { useEffect, useState, useMemo } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProjectData } from '@/lib/types';
import { cn, downloadJson, formatDate, getCarbonScoreColor } from '@/lib/utils';
import {
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  X,
  FileJson,
  FolderOpen,
} from 'lucide-react';

export default function ProjectsContent() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  // Filters
  const [mixTypeFilter, setMixTypeFilter] = useState('all');
  const [greenTargetFilter, setGreenTargetFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (mixTypeFilter !== 'all') params.set('mixType', mixTypeFilter);
      if (greenTargetFilter !== 'all') params.set('greenTarget', greenTargetFilter);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [mixTypeFilter, greenTargetFilter, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete project');
      setProjects((prev) => prev?.filter((p) => p?.id !== id) ?? []);
      if (selectedProject?.id === id) setSelectedProject(null);
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const handleExportAll = () => {
    const blockchainData = projects?.map((p) => {
      try {
        return JSON.parse(p?.blockchainJson ?? '{}');
      } catch {
        return {};
      }
    }) ?? [];
    downloadJson(blockchainData, 'all-projects-blockchain.json');
  };

  const handleExportSingle = (project: ProjectData) => {
    try {
      const data = JSON.parse(project?.blockchainJson ?? '{}');
      downloadJson(data, `project-${project?.projectId?.slice?.(0, 8) ?? 'unknown'}.json`);
    } catch {
      alert('Failed to export project');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (loading && projects?.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4 text-muted-foreground" />
          Filters:
        </div>

        <select
          value={mixTypeFilter}
          onChange={(e) => setMixTypeFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Mix Types</option>
          <option value="HMA">HMA Only</option>
          <option value="WMA">WMA Only</option>
        </select>

        <select
          value={greenTargetFilter}
          onChange={(e) => setGreenTargetFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Targets</option>
          <option value="true">Green Target Met</option>
          <option value="false">Above Green Target</option>
        </select>

        <div className="flex-1" />

        <button
          onClick={handleExportAll}
          disabled={!projects?.length}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export All ({projects?.length ?? 0})
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Projects Table */}
      {projects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border bg-card">
          <div className="rounded-full bg-muted p-6 mb-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">No Projects Found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start by calculating a carbon footprint in the Calculator
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Date <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Project ID
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('plannedTonnage')}
                  >
                    <div className="flex items-center gap-1">
                      Tonnage <SortIcon field="plannedTonnage" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Mix
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('targetRapPercentage')}
                  >
                    <div className="flex items-center gap-1">
                      RAP % <SortIcon field="targetRapPercentage" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('carbonScore')}
                  >
                    <div className="flex items-center gap-1">
                      Carbon Score <SortIcon field="carbonScore" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('tonsCo2Saved')}
                  >
                    <div className="flex items-center gap-1">
                      CO₂ Saved <SortIcon field="tonsCo2Saved" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects?.map((project) => (
                  <tr key={project?.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      {formatDate(project?.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {project?.projectId?.slice?.(0, 8) ?? 'N/A'}...
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {project?.plannedTonnage?.toLocaleString?.() ?? '0'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        project?.mixType === 'WMA'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      )}>
                        {project?.mixType ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {project?.targetRapPercentage?.toFixed?.(1) ?? '0'}%
                    </td>
                    <td className={cn('px-4 py-3 text-sm font-semibold', getCarbonScoreColor(project?.carbonScore))}>
                      {project?.carbonScore?.toFixed?.(1) ?? '0'}
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                      {project?.tonsCo2Saved?.toFixed?.(2) ?? '0'}t
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={project?.meetsGreenTarget ? 'success' : 'warning'}
                        label={project?.meetsGreenTarget ? 'Green' : 'Standard'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="rounded-lg p-2 hover:bg-muted transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExportSingle(project)}
                          className="rounded-lg p-2 hover:bg-muted transition-colors"
                          title="Export JSON"
                        >
                          <FileJson className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project?.id)}
                          className="rounded-lg p-2 hover:bg-rose-500/10 text-rose-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) ?? null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Project Details</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Project ID</p>
                  <p className="font-mono text-sm">{selectedProject?.projectId ?? 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDate(selectedProject?.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Tonnage</p>
                  <p className="text-lg font-bold">{selectedProject?.plannedTonnage?.toLocaleString?.() ?? '0'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">RAP %</p>
                  <p className="text-lg font-bold">{selectedProject?.targetRapPercentage ?? 0}%</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Trip Distance</p>
                  <p className="text-lg font-bold">{selectedProject?.tripDistance ?? 0} km</p>
                </div>
              </div>

              <div className={cn(
                'rounded-xl p-6 text-center',
                selectedProject?.meetsGreenTarget
                  ? 'bg-emerald-500/10'
                  : 'bg-amber-500/10'
              )}>
                <p className="text-sm text-muted-foreground">Carbon Score</p>
                <p className={cn('text-4xl font-bold', getCarbonScoreColor(selectedProject?.carbonScore))}>
                  {selectedProject?.carbonScore?.toFixed?.(1) ?? '0'}
                </p>
                <p className="text-sm text-muted-foreground">kg CO₂ / ton</p>
              </div>

              <div className="flex gap-2">
                <StatusBadge
                  status={selectedProject?.meetsGreenTarget ? 'success' : 'warning'}
                  label={selectedProject?.meetsGreenTarget ? 'Meets Green Target' : 'Above Green Target'}
                />
                <StatusBadge
                  status={selectedProject?.carbonCapCompliance ? 'success' : 'error'}
                  label={selectedProject?.carbonCapCompliance ? 'Within Carbon Cap' : 'Exceeds Cap'}
                />
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-2">Mix Recommendation</p>
                <p className="text-sm text-muted-foreground">{selectedProject?.mixRecommendation ?? 'N/A'}</p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-2">Blockchain-Ready JSON</p>
                <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto max-h-60">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedProject?.blockchainJson ?? '{}'), null, 2);
                    } catch {
                      return selectedProject?.blockchainJson ?? '{}';
                    }
                  })()}
                </pre>
              </div>

              <button
                onClick={() => handleExportSingle(selectedProject)}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export for Blockchain Minting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
