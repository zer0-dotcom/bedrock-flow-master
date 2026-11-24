'use client';

// Sprint 5 — CorporateIntake review panel (Tab B of the admin console).
// Additive: standalone component mounted beside the untouched DiscoveryAsset panel.

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

type IntakeStatus = 'PENDING_FORENSIC_REVIEW' | 'APPROVED' | 'REJECTED';
type FilterTab = IntakeStatus | 'ALL';

interface IntakeRow {
  id: string;
  submissionRef: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  fileName: string;
  fileSizeBytes: number;
  fileHash: string;
  status: string;
  referralCode: string | null;
  clientWalletAddress: string | null;
  attestationTxSig: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'PENDING_FORENSIC_REVIEW', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All' },
];

function fmtBytes(n: number): string {
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return s;
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING_FORENSIC_REVIEW: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  const label: Record<string, string> = {
    PENDING_FORENSIC_REVIEW: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap',
      map[status] ?? 'bg-zinc-700/40 text-zinc-300 border-zinc-600')}>
      {label[status] ?? status}
    </span>
  );
}

export default function IntakeQueuePanel() {
  const [filter, setFilter] = useState<FilterTab>('PENDING_FORENSIC_REVIEW');
  const [rows, setRows] = useState<IntakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [modal, setModal] = useState<{ kind: 'approve' | 'reject'; row: IntakeRow } | null>(null);
  const [walletInput, setWalletInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/intake?status=${encodeURIComponent(filter)}&page=1&limit=100`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);
      setRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const openModal = (kind: 'approve' | 'reject', row: IntakeRow) => {
    setModal({ kind, row });
    setWalletInput('');
    setReasonInput('');
    setFeedback(null);
  };

  const submitAction = async () => {
    if (!modal || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const url = `/api/v1/intake/${modal.row.id}/${modal.kind}`;
      const body = modal.kind === 'approve'
        ? { clientWalletAddress: walletInput.trim() || undefined }
        : { rejectionReason: reasonInput.trim() || undefined };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setModal(null);
        setFeedback({ type: 'success', message: `${modal.row.submissionRef} ${modal.kind === 'approve' ? 'approved' : 'rejected'}.` });
        await fetchRows();
      } else {
        setFeedback({ type: 'error', message: data?.message || `Action failed (${res.status}).` });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error. Please retry.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter tabs + refresh */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setExpanded(null); }}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg border transition-all',
                filter === f.key
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchRows}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-600 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          REFRESH
        </button>
      </div>

      {feedback && (
        <div className={cn('rounded-lg border px-4 py-2.5 text-xs',
          feedback.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-red-500/10 text-red-300 border-red-500/30')}>
          {feedback.message}
        </div>
      )}

      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-700/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-14 text-sm text-zinc-500">
            No submissions matching this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-700/50">
                  <th className="px-3 py-3 w-6"></th>
                  <th className="px-3 py-3">Ref</th>
                  <th className="px-3 py-3">Company</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">File</th>
                  <th className="px-3 py-3">Size</th>
                  <th className="px-3 py-3">Referral</th>
                  <th className="px-3 py-3">Submitted</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const open = expanded === row.id;
                  const isPending = row.status === 'PENDING_FORENSIC_REVIEW';
                  return (
                    <>
                      <tr
                        key={row.id}
                        className="border-b border-zinc-800/60 hover:bg-zinc-800/30 cursor-pointer"
                        onClick={() => setExpanded(open ? null : row.id)}
                      >
                        <td className="px-3 py-3 text-zinc-500">
                          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </td>
                        <td className="px-3 py-3 font-mono text-cyan-400 whitespace-nowrap">{row.submissionRef}</td>
                        <td className="px-3 py-3 text-white max-w-[160px] truncate">{row.companyName}</td>
                        <td className="px-3 py-3 text-zinc-300 whitespace-nowrap">{row.contactName}</td>
                        <td className="px-3 py-3 text-zinc-400 max-w-[180px] truncate">{row.contactEmail}</td>
                        <td className="px-3 py-3 text-zinc-400 max-w-[140px] truncate">{row.fileName}</td>
                        <td className="px-3 py-3 text-zinc-400 whitespace-nowrap">{fmtBytes(row.fileSizeBytes)}</td>
                        <td className="px-3 py-3 font-mono text-zinc-300 whitespace-nowrap">{row.referralCode ?? '—'}</td>
                        <td className="px-3 py-3 text-zinc-400 whitespace-nowrap">{fmtDate(row.createdAt)}</td>
                        <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => openModal('approve', row)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all font-bold"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => openModal('reject', row)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-all font-bold"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr key={`${row.id}-detail`} className="border-b border-zinc-800/60 bg-zinc-950/40">
                          <td></td>
                          <td colSpan={10} className="px-3 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-xs">
                              <Detail label="Submission Ref" value={row.submissionRef} mono />
                              <Detail label="Company" value={row.companyName} />
                              <Detail label="Contact" value={row.contactName} />
                              <Detail label="Email" value={row.contactEmail} />
                              <Detail label="File Name" value={row.fileName} />
                              <Detail label="File Size" value={fmtBytes(row.fileSizeBytes)} />
                              <Detail label="SHA-256 (Hash Match)" value={row.fileHash} mono wrap />
                              <Detail label="Referral Code" value={row.referralCode ?? '—'} mono />
                              <Detail label="Client Wallet Address" value={row.clientWalletAddress ?? '—'} mono wrap />
                              <Detail label="Status" value={row.status} />
                              <Detail label="Submitted" value={fmtDate(row.createdAt)} />
                              <Detail label="Approved By" value={row.approvedBy ?? '—'} mono />
                              <Detail label="Approved At" value={fmtDate(row.approvedAt)} />
                              <Detail label="Rejected By" value={row.rejectedBy ?? '—'} mono />
                              <Detail label="Rejected At" value={fmtDate(row.rejectedAt)} />
                              <Detail label="Rejection Reason" value={row.rejectionReason ?? '—'} wrap />
                            </div>
                            {row.status === 'APPROVED' && (
                              <div className="mt-3 pt-3 border-t border-zinc-800/60">
                                <AttestationField txSig={row.attestationTxSig} />
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve / Reject modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn('p-2 rounded-lg border',
                  modal.kind === 'approve'
                    ? 'bg-emerald-500/15 border-emerald-500/30'
                    : 'bg-red-500/15 border-red-500/30')}>
                  {modal.kind === 'approve'
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    : <XCircle className="h-5 w-5 text-red-400" />}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {modal.kind === 'approve' ? 'Approve Submission' : 'Reject Submission'}
                </h3>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-500" />
              <span className="font-mono text-cyan-400">{modal.row.submissionRef}</span>
              <span className="text-zinc-600">·</span>
              <span className="truncate">{modal.row.companyName}</span>
            </p>

            {modal.kind === 'approve' ? (
              <div className="mb-4">
                <label className="block text-xs text-zinc-400 mb-2">Client Wallet Address <span className="text-zinc-600">(optional)</span></label>
                <input
                  type="text"
                  value={walletInput}
                  onChange={e => setWalletInput(e.target.value)}
                  placeholder="e.g. 7xKX...wallet"
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-xs placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs text-zinc-400 mb-2">Rejection Reason <span className="text-zinc-600">(optional)</span></label>
                <textarea
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  placeholder="Reason for rejection"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 resize-none"
                  spellCheck={true}
                />
              </div>
            )}

            {feedback?.type === 'error' && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
                {feedback.message}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={submitAction}
                disabled={submitting}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all border disabled:opacity-50',
                  modal.kind === 'approve'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                )}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {modal.kind === 'approve' ? 'CONFIRM APPROVE' : 'CONFIRM REJECT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttestationField({ txSig }: { txSig: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!txSig) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Solana Attestation</span>
        <span className="text-zinc-500 italic text-xs">Attestation pending / not configured</span>
      </div>
    );
  }

  const truncated = `${txSig.slice(0, 8)}…${txSig.slice(-8)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(txSig);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Solana Attestation (Tx)</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-emerald-400 text-xs">{truncated}</span>
        <button
          type="button"
          onClick={copy}
          title="Copy transaction signature"
          className="text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <a
          href={`https://explorer.solana.com/tx/${txSig}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Solana Explorer"
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="text-[10px] uppercase tracking-wider">Explorer</span>
        </a>
      </div>
    </div>
  );
}

function Detail({ label, value, mono, wrap }: { label: string; value: string; mono?: boolean; wrap?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className={cn('text-zinc-200', mono && 'font-mono', wrap ? 'break-all' : 'truncate')}>{value}</span>
    </div>
  );
}
