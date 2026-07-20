'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  X,
  Calendar,
  FileText,
  FileSpreadsheet,
  Download,
  Leaf,
  Filter,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface SettlementEntry {
  id: string;
  entryId: string;
  extractionType: string;
  totalValueUsd: number;
  carbonAvoidedTonnes: number;
  complianceState: string;
  poeHash?: string;
  timestamp: string;
  sourceNodeId?: string;
}

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: SettlementEntry[];
  reportType?: 'ledger' | 'remediation';
}

export default function ExportReportModal({
  isOpen,
  onClose,
  entries,
  reportType = 'ledger',
}: ExportReportModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scopeFilters, setScopeFilters] = useState({
    scope1: true,
    scope2: true,
    scope3: true,
  });
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Determine scope from extraction type
  const getScope = (type: string): 'scope1' | 'scope2' | 'scope3' => {
    if (type.includes('DEAD_MASS') || type.includes('LEGACY')) return 'scope3';
    if (type.includes('RESONANCE') || type.includes('PARTICIPATION')) return 'scope2';
    return 'scope1';
  };

  // Filter entries based on date range and scope
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Date filter
      const entryDate = new Date(entry.timestamp);
      if (startDate && entryDate < new Date(startDate)) return false;
      if (endDate && entryDate > new Date(endDate + 'T23:59:59')) return false;

      // Scope filter
      const scope = getScope(entry.extractionType);
      if (!scopeFilters[scope]) return false;

      return true;
    });
  }, [entries, startDate, endDate, scopeFilters]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalCO2e = filteredEntries.reduce((sum, e) => sum + e.carbonAvoidedTonnes, 0);
    const totalValue = filteredEntries.reduce((sum, e) => sum + e.totalValueUsd, 0);
    const verifiedCount = filteredEntries.filter(
      (e) => e.complianceState === 'COMPLIANT' || e.complianceState === 'VERIFIED'
    ).length;

    return {
      totalCO2e,
      totalValue,
      recordCount: filteredEntries.length,
      verifiedCount,
      verificationRate: filteredEntries.length > 0 
        ? ((verifiedCount / filteredEntries.length) * 100).toFixed(1) 
        : '0',
    };
  }, [filteredEntries]);

  const handleScopeToggle = (scope: 'scope1' | 'scope2' | 'scope3') => {
    setScopeFilters((prev) => ({ ...prev, [scope]: !prev[scope] }));
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (exportFormat === 'csv') {
      // Generate CSV
      const headers = [
        'Effective Date',
        'Audit Reference ID',
        'Asset/Node',
        'Scope',
        'Activity Type',
        'Verified Impact (t CO2e)',
        'Status',
        'Evidence Hash',
      ];

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

      const getScopeLabel = (type: string) => {
        const scope = getScope(type);
        return scope === 'scope1' ? 'Scope 1' : scope === 'scope2' ? 'Scope 2' : 'Scope 3';
      };

      const rows = filteredEntries.map((entry) => [
        new Date(entry.timestamp).toLocaleDateString('en-US'),
        entry.entryId,
        entry.sourceNodeId || 'NETWORK',
        getScopeLabel(entry.extractionType),
        getActivityLabel(entry.extractionType),
        entry.carbonAvoidedTonnes.toFixed(4),
        entry.complianceState === 'COMPLIANT' ? 'Verified' : entry.complianceState,
        entry.poeHash || '',
      ]);

      const csvContent = [
        `# Bedrock ESG - ${reportType === 'ledger' ? 'Consolidated Ledger' : 'Remediation Logs'} Export`,
        `# Generated: ${new Date().toISOString()}`,
        `# Date Range: ${startDate || 'All'} to ${endDate || 'Present'}`,
        `# Total Records: ${filteredEntries.length}`,
        `# Total CO2e Impact: ${summaryStats.totalCO2e.toFixed(4)} tonnes`,
        '',
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bedrock-esg-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Generate PDF-style JSON (for now, as full PDF would require server-side)
      const reportData = {
        reportType: reportType === 'ledger' ? 'Consolidated Ledger Report' : 'Remediation Logs Report',
        generatedAt: new Date().toISOString(),
        organization: 'Bedrock ESG',
        dateRange: {
          start: startDate || 'All Time',
          end: endDate || 'Present',
        },
        scopeFilters: {
          scope1: scopeFilters.scope1,
          scope2: scopeFilters.scope2,
          scope3: scopeFilters.scope3,
        },
        summary: {
          totalRecords: summaryStats.recordCount,
          totalCO2eImpact: `${summaryStats.totalCO2e.toFixed(4)} tonnes`,
          totalValueUSD: `$${summaryStats.totalValue.toLocaleString()}`,
          verificationRate: `${summaryStats.verificationRate}%`,
        },
        entries: filteredEntries.map((e) => ({
          date: new Date(e.timestamp).toLocaleDateString('en-US'),
          auditReferenceId: e.entryId,
          scope: getScope(e.extractionType).replace('scope', 'Scope '),
          activityType: e.extractionType.replace(/_/g, ' '),
          verifiedImpact: `${e.carbonAvoidedTonnes.toFixed(4)} t CO2e`,
          status: e.complianceState,
          evidenceHash: e.poeHash || null,
        })),
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bedrock-esg-${reportType}-executive-summary-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setIsGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-[hsl(225,25%,8%)] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Export Report</h2>
              <p className="text-xs text-gray-400">
                {reportType === 'ledger' ? 'Consolidated Ledger' : 'Remediation Logs'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Date Range */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Scope Filters */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Filter className="w-4 h-4 text-violet-400" />
              Scope Filters
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'scope1', label: 'Scope 1', desc: 'Direct Emissions', color: 'emerald' },
                { key: 'scope2', label: 'Scope 2', desc: 'Indirect Energy', color: 'cyan' },
                { key: 'scope3', label: 'Scope 3', desc: 'Value Chain', color: 'amber' },
              ].map((scope) => (
                <button
                  key={scope.key}
                  onClick={() => handleScopeToggle(scope.key as 'scope1' | 'scope2' | 'scope3')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                    scopeFilters[scope.key as keyof typeof scopeFilters]
                      ? `bg-${scope.color}-500/20 border-${scope.color}-500/50 text-${scope.color}-400`
                      : 'bg-gray-900 border-gray-700 text-gray-500'
                  )}
                  style={{
                    backgroundColor: scopeFilters[scope.key as keyof typeof scopeFilters]
                      ? scope.color === 'emerald' ? 'rgba(16, 185, 129, 0.2)'
                        : scope.color === 'cyan' ? 'rgba(6, 182, 212, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)'
                      : undefined,
                    borderColor: scopeFilters[scope.key as keyof typeof scopeFilters]
                      ? scope.color === 'emerald' ? 'rgba(16, 185, 129, 0.5)'
                        : scope.color === 'cyan' ? 'rgba(6, 182, 212, 0.5)'
                        : 'rgba(245, 158, 11, 0.5)'
                      : undefined,
                    color: scopeFilters[scope.key as keyof typeof scopeFilters]
                      ? scope.color === 'emerald' ? 'rgb(52, 211, 153)'
                        : scope.color === 'cyan' ? 'rgb(34, 211, 238)'
                        : 'rgb(251, 191, 36)'
                      : undefined,
                  }}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                      scopeFilters[scope.key as keyof typeof scopeFilters]
                        ? 'border-current bg-current/20'
                        : 'border-gray-600'
                    )}
                  >
                    {scopeFilters[scope.key as keyof typeof scopeFilters] && (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{scope.label}</div>
                    <div className="text-[10px] opacity-60">{scope.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Download className="w-4 h-4 text-pink-400" />
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('pdf')}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border transition-all',
                  exportFormat === 'pdf'
                    ? 'bg-pink-500/10 border-pink-500/50 text-pink-400'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                )}
              >
                <FileText className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">PDF</div>
                  <div className="text-xs opacity-60">Executive Summary</div>
                </div>
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border transition-all',
                  exportFormat === 'csv'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                )}
              >
                <FileSpreadsheet className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">CSV</div>
                  <div className="text-xs opacity-60">Raw Data Export</div>
                </div>
              </button>
            </div>
          </div>

          {/* Summary Preview */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Leaf className="w-4 h-4 text-emerald-400" />
              Impact Summary Preview
            </label>
            {summaryStats.recordCount > 0 ? (
              <div className="bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 rounded-xl border border-emerald-500/20 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {summaryStats.totalCO2e.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Total t CO₂e</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {summaryStats.recordCount}
                    </div>
                    <div className="text-xs text-gray-500">Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">
                      ${(summaryStats.totalValue / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs text-gray-500">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-400">
                      {summaryStats.verificationRate}%
                    </div>
                    <div className="text-xs text-gray-500">Verified</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6 text-center">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  No records found for this period.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Adjust your date range or scope filters.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-900/30">
          <p className="text-xs text-gray-500">
            {summaryStats.recordCount} records selected
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={summaryStats.recordCount === 0 || isGenerating}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
                summaryStats.recordCount === 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : generated
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/20'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : generated ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
