'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useBpsTable } from '@/lib/use-bps-table';
import {
  Loader2,
  Brain,
  Scale,
  FileDown,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface Doc {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  parsed: boolean;
  parsedAt: string | null;
}

interface SettlementData {
  id: string;
  settlementId: string;
  totalValueUsd: number;
  assetOwnerShare: number;
  treasuryShare: number;
  specialistShare: number;
  routedToSustainabilityPool: boolean;
  executed: boolean;
  executionHash: string | null;
}

interface Submission {
  id: string;
  submissionId: string;
  createdAt: string;
  track: string;
  status: string;
  walletAddress: string;
  companyName: string | null;
  vendorName: string | null;
  materialVolume: number | null;
  materialUnit: string | null;
  energyDeltaMw: number | null;
  carbonTonnes: number | null;
  carbonValueUsd: number | null;
  parserConfidence: number | null;
  iceMaterial: string | null;
  iceCoefficient: number | null;
  backtraceId: string;
  solanaTxHash: string | null;
  cdrCreditsTonnes: number | null;
  documents: Doc[];
  settlement: SettlementData | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-400', icon: Clock },
  PENDING_FORENSIC_VERIFICATION: { label: 'Pending Forensic', color: 'text-amber-400', icon: AlertTriangle },
  FORENSIC_VERIFIED: { label: 'Verified', color: 'text-blue-400', icon: Shield },
  SETTLEMENT_COMPLETE: { label: 'Settled', color: 'text-green-400', icon: CheckCircle2 },
  REJECTED_FORENSIC: { label: 'Rejected', color: 'text-red-400', icon: XCircle },
};

const TRACK_LABELS: Record<string, string> = {
  TRACK_A_MATERIALS: 'Track A — Materials',
  TRACK_B_ENERGY_179D: 'Track B — 179D Energy',
  TRACK_C_BIOCHAR_CDR: 'Track C — Biochar CDR',
};

export default function SubmissionsList({ walletAddress }: { walletAddress: string }) {
  const bpsTable = useBpsTable();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [actionMessages, setActionMessages] = useState<Record<string, { success: boolean; message: string }>>({});

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/submissions?wallet=${walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const runParser = async (id: string) => {
    setActionLoading((p) => ({ ...p, [id]: 'parse' }));
    setActionMessages((p) => ({ ...p, [id]: undefined as unknown as { success: boolean; message: string } }));
    try {
      const res = await fetch(`/api/submissions/${id}/parse`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setActionMessages((p) => ({
          ...p,
          [id]: { success: true, message: 'Forensic parsing complete. Status updated.' },
        }));
        await fetchSubmissions();
      } else {
        setActionMessages((p) => ({
          ...p,
          [id]: { success: false, message: data.error || 'Parsing failed' },
        }));
      }
    } catch {
      setActionMessages((p) => ({
        ...p,
        [id]: { success: false, message: 'Network error during parsing' },
      }));
    } finally {
      setActionLoading((p) => ({ ...p, [id]: '' }));
    }
  };

  const runSettlement = async (id: string) => {
    setActionLoading((p) => ({ ...p, [id]: 'settle' }));
    setActionMessages((p) => ({ ...p, [id]: undefined as unknown as { success: boolean; message: string } }));
    try {
      const res = await fetch(`/api/submissions/${id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceVerify: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessages((p) => ({
          ...p,
          [id]: { success: true, message: `Settlement ${data.settlement.settlementId} executed.` },
        }));
        await fetchSubmissions();
      } else {
        setActionMessages((p) => ({
          ...p,
          [id]: { success: false, message: data.error || 'Settlement failed' },
        }));
      }
    } catch {
      setActionMessages((p) => ({
        ...p,
        [id]: { success: false, message: 'Network error during settlement' },
      }));
    } finally {
      setActionLoading((p) => ({ ...p, [id]: '' }));
    }
  };

  const downloadCertificate = async (id: string, submissionId: string) => {
    setActionLoading((p) => ({ ...p, [id]: 'cert' }));
    try {
      const res = await fetch(`/api/submissions/${id}/certificate`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Certificate generation failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sovereign-cert-${submissionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionMessages((p) => ({
        ...p,
        [id]: { success: false, message: err instanceof Error ? err.message : 'Download failed' },
      }));
    } finally {
      setActionLoading((p) => ({ ...p, [id]: '' }));
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm('Delete this submission? This cannot be undone.')) return;
    try {
      await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
      await fetchSubmissions();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Shield className="w-10 h-10 mx-auto mb-3 text-gray-700" />
        <p className="text-sm">No submissions yet. Upload documents above to begin.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Submissions ({submissions.length})
        </h2>
        <button
          onClick={() => { setLoading(true); fetchSubmissions(); }}
          className="text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {submissions.map((sub) => {
          const statusCfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.DRAFT;
          const StatusIcon = statusCfg.icon;
          const isExpanded = expanded === sub.id;

          return (
            <div
              key={sub.id}
              className="border border-[#2a2a2a] rounded-xl bg-[#1a1a1a] overflow-hidden"
            >
              {/* Row Header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : sub.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#222] transition-colors"
              >
                <StatusIcon className={cn('w-4 h-4 flex-shrink-0', statusCfg.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {sub.submissionId}
                    </span>
                    <span className="text-[10px] bg-[#111] border border-[#2a2a2a] rounded px-2 py-0.5 text-gray-500">
                      {TRACK_LABELS[sub.track] || sub.track}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={cn('text-xs', statusCfg.color)}>
                      {statusCfg.label}
                    </span>
                    {sub.vendorName && (
                      <span className="text-xs text-gray-500">
                        {sub.vendorName}
                      </span>
                    )}
                    {sub.carbonTonnes && (
                      <span className="text-xs text-green-400">
                        {sub.carbonTonnes.toFixed(4)} tCO₂e
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-gray-600">
                  {new Date(sub.createdAt).toLocaleDateString()}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="border-t border-[#2a2a2a] px-4 py-4 space-y-4">
                  {/* Data Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <DataCell label="Vendor" value={sub.vendorName || '—'} />
                    <DataCell
                      label="Material"
                      value={
                        sub.materialVolume
                          ? `${sub.materialVolume} ${sub.materialUnit || ''}`
                          : '—'
                      }
                    />
                    <DataCell
                      label="Energy Delta"
                      value={sub.energyDeltaMw ? `${sub.energyDeltaMw} MW` : '—'}
                    />
                    <DataCell
                      label="Confidence"
                      value={
                        sub.parserConfidence
                          ? `${(sub.parserConfidence * 100).toFixed(0)}%`
                          : '—'
                      }
                    />
                    <DataCell
                      label="ICE Coefficient"
                      value={
                        sub.iceCoefficient
                          ? `${sub.iceCoefficient} kgCO₂e/t`
                          : '—'
                      }
                    />
                    <DataCell
                      label="Carbon Impact"
                      value={
                        sub.carbonTonnes
                          ? `${sub.carbonTonnes.toFixed(4)} tCO₂e`
                          : '—'
                      }
                      highlight
                    />
                    <DataCell
                      label="Carbon Value"
                      value={
                        sub.carbonValueUsd
                          ? `$${sub.carbonValueUsd.toFixed(2)}`
                          : '—'
                      }
                      highlight
                    />
                    <DataCell label="Backtrace" value={sub.backtraceId} mono />
                  </div>

                  {/* Settlement Info */}
                  {sub.settlement && (
                    <div className="bg-[#111] rounded-lg p-3 border border-[#2a2a2a]">
                      <div className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-wider">
                        {bpsTable ? bpsTable.label : 'DYNAMIC BPS'} SETTLEMENT — {sub.settlement.settlementId}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-green-500/5 rounded border border-green-500/20">
                          <div className="text-lg font-bold text-green-400">{bpsTable ? `${bpsTable.earnerPct}%` : '—'}</div>
                          <div className="text-xs text-gray-500">
                            ${sub.settlement.assetOwnerShare.toFixed(2)}
                          </div>
                          <div className="text-[9px] text-gray-600">Asset Sovereign</div>
                        </div>
                        <div className="text-center p-2 bg-blue-500/5 rounded border border-blue-500/20">
                          <div className="text-lg font-bold text-blue-400">{bpsTable ? `${bpsTable.nodePct}%` : '—'}</div>
                          <div className="text-xs text-gray-500">
                            ${sub.settlement.treasuryShare.toFixed(2)}
                          </div>
                          <div className="text-[9px] text-gray-600">Verification Node</div>
                        </div>
                        <div className="text-center p-2 bg-purple-500/5 rounded border border-purple-500/20">
                          <div className="text-lg font-bold text-purple-400">{bpsTable ? `${bpsTable.depinPct}%` : '—'}</div>
                          <div className="text-xs text-gray-500">
                            ${sub.settlement.specialistShare.toFixed(2)}
                          </div>
                          <div className="text-[9px] text-gray-600">
                            {sub.settlement.routedToSustainabilityPool
                              ? 'Public Resilience'
                              : 'Public Resilience'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {sub.documents.length > 0 && (
                    <div>
                      <div className="text-[10px] text-gray-500 font-semibold mb-2">DOCUMENTS</div>
                      <div className="space-y-1">
                        {sub.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 text-xs text-gray-400 bg-[#111] rounded px-3 py-1.5 border border-[#2a2a2a]"
                          >
                            <span className="flex-1 truncate">{doc.fileName}</span>
                            <span className="text-gray-600">
                              {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                            </span>
                            {doc.parsed ? (
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                            ) : (
                              <Clock className="w-3 h-3 text-gray-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Messages */}
                  {actionMessages[sub.id] && (
                    <div
                      className={cn(
                        'text-xs rounded-lg p-2 border',
                        actionMessages[sub.id].success
                          ? 'bg-green-500/5 border-green-500/20 text-green-400'
                          : 'bg-red-500/5 border-red-500/20 text-red-400'
                      )}
                    >
                      {actionMessages[sub.id].message}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {sub.status === 'DRAFT' && (
                      <ActionButton
                        onClick={() => runParser(sub.id)}
                        loading={actionLoading[sub.id] === 'parse'}
                        icon={Brain}
                        label="Run AI Forensic Parser"
                        color="blue"
                      />
                    )}
                    {(sub.status === 'PENDING_FORENSIC_VERIFICATION' ||
                      sub.status === 'FORENSIC_VERIFIED') &&
                      !sub.settlement && (
                        <ActionButton
                          onClick={() => runSettlement(sub.id)}
                          loading={actionLoading[sub.id] === 'settle'}
                          icon={Scale}
                          label="Execute Dynamic BPS Settlement"
                          color="green"
                        />
                      )}
                    {(sub.status === 'SETTLEMENT_COMPLETE' ||
                      sub.status === 'FORENSIC_VERIFIED' ||
                      sub.status === 'PENDING_FORENSIC_VERIFICATION') && (
                      <ActionButton
                        onClick={() => downloadCertificate(sub.id, sub.submissionId)}
                        loading={actionLoading[sub.id] === 'cert'}
                        icon={FileDown}
                        label="Download Sovereign Certificate"
                        color="purple"
                      />
                    )}
                    <button
                      onClick={() => deleteSubmission(sub.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-red-500/20 text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataCell({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="bg-[#111] rounded-lg px-3 py-2 border border-[#2a2a2a]">
      <div className="text-[10px] text-gray-600 mb-0.5">{label}</div>
      <div
        className={cn(
          'text-sm truncate',
          highlight ? 'text-green-400 font-semibold' : 'text-gray-300',
          mono && 'font-mono text-xs'
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  loading,
  icon: Icon,
  label,
  color,
}: {
  onClick: () => void;
  loading: boolean;
  icon: typeof Brain;
  label: string;
  color: 'blue' | 'green' | 'purple';
}) {
  const colors = {
    blue: 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10',
    green: 'border-green-500/30 text-green-400 hover:bg-green-500/10',
    purple: 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors',
        loading ? 'opacity-50 cursor-not-allowed' : colors[color]
      )}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      {label}
    </button>
  );
}
