'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Clock,
  FileText,
  Globe2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Framework {
  id: string;
  name: string;
  jurisdiction: string;
  status: string;
  statusReason?: string;
  lastAuditDate?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  regulatoryBody?: string;
  requiresTreasuryBackup: boolean;
  requiresWhitepaperHash: boolean;
  travelRuleThreshold?: number;
  travelRuleCurrency?: string;
}

interface ComplianceData {
  overallStatus: 'GREEN' | 'YELLOW' | 'RED';
  safeToOperate: boolean;
  statusMessage: string;
  frameworks: Framework[];
  summary: {
    total: number;
    compliant: number;
    warning: number;
    nonCompliant: number;
    pendingReview: number;
  };
  timestamp: string;
}

const STATUS_CONFIG = {
  GREEN: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: CheckCircle2,
    label: 'Compliant',
  },
  YELLOW: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: AlertTriangle,
    label: 'Warning',
  },
  RED: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: XCircle,
    label: 'Non-Compliant',
  },
};

const FRAMEWORK_CONFIG: Record<string, { flag: string; color: string }> = {
  US: { flag: '🇺🇸', color: 'text-blue-400' },
  EU: { flag: '🇪🇺', color: 'text-yellow-400' },
  SG: { flag: '🇸🇬', color: 'text-red-400' },
  UK: { flag: '🇬🇧', color: 'text-indigo-400' },
  JP: { flag: '🇯🇵', color: 'text-pink-400' },
  CH: { flag: '🇨🇭', color: 'text-orange-400' },
};

interface ComplianceWidgetProps {
  compact?: boolean;
  className?: string;
}

export default function ComplianceWidget({ compact = false, className }: ComplianceWidgetProps) {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/compliance');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className={cn("bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-pulse", className)}>
        <div className="h-8 bg-slate-700 rounded w-1/3 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("bg-slate-800/50 border border-slate-700 rounded-xl p-6", className)}>
        <p className="text-slate-400">No active data points to report. Begin your first assessment using the Carbon Calculator.</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[data.overallStatus];
  const StatusIcon = statusConfig.icon;

  // Compact version for dashboard
  if (compact) {
    return (
      <div className={cn(
        "bg-slate-800/50 border rounded-xl p-4 cursor-pointer hover:bg-slate-800/70 transition-colors",
        statusConfig.borderColor,
        className
      )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", statusConfig.bgColor)}>
              <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
            </div>
            <div>
              <p className="text-white font-medium">Global Compliance</p>
              <p className={cn("text-sm", statusConfig.color)}>{statusConfig.label}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {data.frameworks.slice(0, 3).map((f) => {
              const config = FRAMEWORK_CONFIG[f.jurisdiction] || { flag: '🌐', color: 'text-slate-400' };
              const fStatus = f.status === 'COMPLIANT' ? 'GREEN' : f.status === 'WARNING' ? 'YELLOW' : 'RED';
              return (
                <div
                  key={f.id}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-lg",
                    STATUS_CONFIG[fStatus].bgColor
                  )}
                  title={`${f.name}: ${f.status}`}
                >
                  {config.flag}
                </div>
              );
            })}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
            {data.frameworks.map((f) => {
              const config = FRAMEWORK_CONFIG[f.jurisdiction] || { flag: '🌐', color: 'text-slate-400' };
              const fStatus = f.status === 'COMPLIANT' ? 'GREEN' : f.status === 'WARNING' ? 'YELLOW' : 'RED';
              const FStatusIcon = STATUS_CONFIG[fStatus].icon;
              return (
                <div key={f.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.flag}</span>
                    <span className="text-white text-sm">{f.name}</span>
                  </div>
                  <FStatusIcon className={cn("h-4 w-4", STATUS_CONFIG[fStatus].color)} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div className={cn("bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className={cn("p-6 border-b border-slate-700/50", statusConfig.bgColor)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-xl bg-slate-900/50")}>
              <Shield className={cn("h-8 w-8", statusConfig.color)} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Global Compliance Status</h3>
              <p className={cn("text-sm mt-1", statusConfig.color)}>
                {data.statusMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              statusConfig.bgColor,
              statusConfig.color
            )}>
              {data.safeToOperate ? 'SAFE TO OPERATE' : 'OPERATIONS RESTRICTED'}
            </span>
            <button
              onClick={fetchData}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Framework Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.frameworks.map((framework) => {
            const config = FRAMEWORK_CONFIG[framework.jurisdiction] || { flag: '🌐', color: 'text-slate-400' };
            const fStatus = framework.status === 'COMPLIANT' ? 'GREEN' : 
                            framework.status === 'WARNING' ? 'YELLOW' : 'RED';
            const fConfig = STATUS_CONFIG[fStatus];
            const FIcon = fConfig.icon;

            return (
              <div
                key={framework.id}
                className={cn(
                  "bg-slate-900/50 border rounded-xl p-4 hover:border-slate-600 transition-colors",
                  fConfig.borderColor
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.flag}</span>
                    <div>
                      <p className="text-white font-semibold">{framework.name}</p>
                      <p className="text-slate-400 text-xs">{framework.jurisdiction}</p>
                    </div>
                  </div>
                  <FIcon className={cn("h-5 w-5", fConfig.color)} />
                </div>

                {/* Status */}
                <div className={cn(
                  "px-3 py-2 rounded-lg mb-4",
                  fConfig.bgColor
                )}>
                  <p className={cn("text-sm font-medium", fConfig.color)}>
                    {framework.status.replace(/_/g, ' ')}
                  </p>
                  {framework.statusReason && (
                    <p className="text-slate-400 text-xs mt-1">{framework.statusReason}</p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {framework.licenseNumber && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText className="h-3 w-3" />
                      <span className="truncate" title={framework.licenseNumber}>
                        {framework.licenseNumber}
                      </span>
                    </div>
                  )}
                  {framework.lastAuditDate && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>Last Audit: {framework.lastAuditDate}</span>
                    </div>
                  )}
                  {framework.regulatoryBody && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Globe2 className="h-3 w-3" />
                      <span className="truncate text-xs">{framework.regulatoryBody}</span>
                    </div>
                  )}
                </div>

                {/* Requirements badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {framework.requiresTreasuryBackup && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                      Treasury Backup
                    </span>
                  )}
                  {framework.requiresWhitepaperHash && (
                    <span className="px-2 py-1 bg-violet-500/10 text-violet-400 rounded text-xs">
                      Whitepaper Hash
                    </span>
                  )}
                  {framework.travelRuleThreshold && (
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-xs">
                      Travel Rule: {framework.travelRuleCurrency}{framework.travelRuleThreshold}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="mt-6 pt-6 border-t border-slate-700/50 flex items-center justify-between">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Compliant: {data.summary.compliant}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-400">Warning: {data.summary.warning}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-400">Non-Compliant: {data.summary.nonCompliant}</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs">
            Updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
