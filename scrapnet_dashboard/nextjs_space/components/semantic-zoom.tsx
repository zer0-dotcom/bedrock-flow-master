'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Globe, Microscope, ZoomIn, ZoomOut, Hash, ExternalLink, FileCheck, FileDown } from 'lucide-react';
import ExportReportModal from './export-report-modal';

interface SettlementEntry {
  id: string;
  entryId: string;
  extractionType: string;
  totalValueUsd: number;
  founderYieldUsd: number;
  stewardshipUsd: number;
  publicResilienceUsd: number;
  carbonAvoidedTonnes: number;
  complianceState: string;
  poeHash?: string;
  timestamp: string;
  sourceNodeId?: string;
}

interface SemanticZoomProps {
  entries: SettlementEntry[];
  globalStats: {
    totalValue: number;
    totalCarbon: number;
    totalEntries: number;
    complianceRate: number;
  };
  className?: string;
}

type ViewMode = 'macro' | 'micro';

export default function SemanticZoom({
  entries,
  globalStats,
  className,
}: SemanticZoomProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('macro');
  const [hoveredEntry, setHoveredEntry] = useState<SettlementEntry | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      DEAD_MASS: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
      RESONANCE: 'bg-pink-500/20 border-pink-500/40 text-pink-400',
      PARTICIPATION: 'bg-violet-500/20 border-violet-500/40 text-violet-400',
      LEGACY_AUDIT: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
      VIBRATIONAL_EQUITY: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
      PARAMETRIC_INSURANCE: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
      RE_HOSPITALITY_SALE: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
      RE_HOSPITALITY_RENT: 'bg-pink-500/20 border-pink-500/40 text-pink-400',
      RE_HOSPITALITY_AIRBNB: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
    };
    return colors[type] || 'bg-gray-500/20 border-gray-500/40 text-gray-400';
  };

  return (
    <div className={cn('relative', className)}>
      <div className="bg-[hsl(225,25%,8%)] rounded-xl border border-cyan-500/20 overflow-hidden">
        {/* Header with toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            {viewMode === 'macro' ? (
              <Globe className="w-5 h-5 text-cyan-400" />
            ) : (
              <Microscope className="w-5 h-5 text-violet-400" />
            )}
            <span className="text-sm font-semibold text-gray-300">
              {viewMode === 'macro' ? 'Global Performance Metrics' : 'Audit Trail Explorer'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Export Report Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
              Export Report
            </button>

            {/* Zoom toggle */}
            <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('macro')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  viewMode === 'macro'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <ZoomOut className="w-3 h-3" />
                MACRO
              </button>
              <button
                onClick={() => setViewMode('micro')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  viewMode === 'micro'
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <ZoomIn className="w-3 h-3" />
                MICRO
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="p-4 min-h-[300px]">
          {viewMode === 'macro' ? (
            /* MACRO VIEW - Global health metrics */
            <div className="space-y-4 zoom-transition macro-view">
              {/* Big numbers */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-cyan-900/30 to-cyan-900/10 rounded-xl border border-cyan-500/20">
                  <div className="text-3xl font-bold text-cyan-400">
                    ${(globalStats.totalValue / 1000000).toFixed(2)}M
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Total Value Settled</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-emerald-900/30 to-emerald-900/10 rounded-xl border border-emerald-500/20">
                  <div className="text-3xl font-bold text-emerald-400">
                    {globalStats.totalCarbon.toFixed(1)}t
                  </div>
                  <div className="text-xs text-gray-500 mt-1">CO₂ Avoided</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-900/30 to-amber-900/10 rounded-xl border border-amber-500/20">
                  <div className="text-3xl font-bold text-amber-400">
                    {globalStats.totalEntries.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Ledger Entries</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-violet-900/30 to-violet-900/10 rounded-xl border border-violet-500/20">
                  <div className="text-3xl font-bold text-violet-400">
                    {globalStats.complianceRate}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">GENIUS Compliance</div>
                </div>
              </div>

              {/* Compliance health bar */}
              <div className="bg-[hsl(225,25%,6%)] rounded-lg p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">System Compliance Index</span>
                  <span className="text-sm text-cyan-400 font-mono">
                    {Math.min(100, globalStats.complianceRate + 5)}%
                  </span>
                </div>
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, globalStats.complianceRate + 5)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-600">
                  <span>CRITICAL</span>
                  <span>BASELINE</span>
                  <span>COMPLIANT</span>
                  <span>EXEMPLARY</span>
                </div>
              </div>
            </div>
          ) : (
            /* MICRO VIEW - Enterprise Audit Table */
            <div className="zoom-transition micro-view overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Effective Date</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Audit Reference ID</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Asset/Node</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Scope</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Activity Type</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Verified Impact</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody className="max-h-[240px] overflow-y-auto">
                  {entries.slice(0, 20).map((entry) => {
                    const getScope = (type: string) => {
                      if (type.includes('DEAD_MASS') || type.includes('LEGACY')) return 'Scope 3';
                      if (type.includes('RESONANCE') || type.includes('PARTICIPATION')) return 'Scope 2';
                      return 'Scope 1';
                    };
                    const getActivityLabel = (type: string) => {
                      const labels: Record<string, string> = {
                        DEAD_MASS: 'Physical Recovery',
                        RESONANCE: 'Logistical Efficiency',
                        PARTICIPATION: 'Stakeholder Action',
                        LEGACY_AUDIT: 'Historical Restoration',
                        VIBRATIONAL_EQUITY: 'Asset Valuation',
                        RE_HOSPITALITY_SALE: 'Property Transaction',
                        RE_HOSPITALITY_RENT: 'Lease Agreement',
                        RE_HOSPITALITY_AIRBNB: 'Short-Term Rental',
                        PARAMETRIC_INSURANCE: 'Risk Coverage',
                      };
                      return labels[type] || type.replace(/_/g, ' ');
                    };
                    const getStatusBadge = (state: string) => {
                      if (state === 'COMPLIANT' || state === 'VERIFIED') {
                        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                      }
                      if (state === 'PENDING' || state === 'HIGH_FRICTION') {
                        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                      }
                      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                    };
                    const formatDate = (ts: string) => {
                      const d = new Date(ts);
                      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    };

                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                        onMouseEnter={() => setHoveredEntry(entry)}
                        onMouseLeave={() => setHoveredEntry(null)}
                      >
                        <td className="py-2.5 px-2 text-gray-300 whitespace-nowrap">
                          {formatDate(entry.timestamp)}
                        </td>
                        <td className="py-2.5 px-2">
                          <button
                            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                            onClick={() => navigator.clipboard.writeText(entry.entryId)}
                            title="Copy Audit Reference ID"
                          >
                            {entry.entryId.slice(0, 12)}...
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-gray-300">
                          {entry.sourceNodeId ? entry.sourceNodeId.slice(0, 10) : 'NETWORK'}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-700/50 text-slate-300">
                            {getScope(entry.extractionType)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-gray-300">
                          {getActivityLabel(entry.extractionType)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-emerald-400">
                          {entry.carbonAvoidedTonnes.toFixed(3)} t CO₂
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={cn(
                            'px-2 py-0.5 text-[10px] rounded-full border font-medium',
                            getStatusBadge(entry.complianceState)
                          )}>
                            {entry.complianceState === 'COMPLIANT' ? 'Verified' : 
                             entry.complianceState === 'HIGH_FRICTION' ? 'Pending' : 
                             entry.complianceState}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          {entry.poeHash ? (
                            <button
                              className="flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
                              onClick={() => navigator.clipboard.writeText(entry.poeHash || '')}
                              title="Copy Evidence Hash"
                            >
                              <FileCheck className="w-3 h-3" />
                              <span className="font-mono text-[10px]">{entry.poeHash.slice(0, 8)}...</span>
                            </button>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {entries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No active data points to report. Begin your first assessment using the Carbon Calculator.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with hash preview */}
        {viewMode === 'micro' && hoveredEntry?.poeHash && (
          <div className="px-4 py-2 border-t border-gray-800 bg-black/30">
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <Hash className="w-3 h-3 text-cyan-500" />
              <span className="text-gray-500">Proof of Extraction:</span>
              <span className="text-cyan-400 break-all">{hoveredEntry.poeHash}</span>
            </div>
          </div>
        )}
      </div>

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        entries={entries}
        reportType="ledger"
      />
    </div>
  );
}
