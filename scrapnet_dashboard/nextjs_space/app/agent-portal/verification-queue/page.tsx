'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Leaf,
  Recycle,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueItem {
  id: string;
  type: string;
  itemType: 'biochar' | 'recycling';
  createdAt: string;
  // Biochar fields
  batchId?: string;
  feedstockType?: string;
  dryWeightKg?: number;
  cdrCreditsTonnes?: number;
  farmerName?: string | null;
  // Recycling fields
  logId?: string;
  materialType?: string;
  weightKg?: number;
  sourceLocation?: string | null;
  submitterName?: string | null;
  yardName?: string | null;
}

export default function VerificationQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'biochar' | 'recycling'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [counts, setCounts] = useState({ biochar: 0, recycling: 0, total: 0 });

  // Simulated agent ID (in production, get from auth context)
  const agentId = 'demo-agent-id';

  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch(`/api/agent/verification-queue?type=${filter}`);
      const data = await response.json();
      if (data.success) {
        setItems(data.items);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleVerify = async (item: QueueItem) => {
    setProcessingId(item.id);
    try {
      const response = await fetch('/api/agent/verification-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          itemType: item.itemType,
          action: 'verify',
          agentId,
        }),
      });

      if (response.ok) {
        // Remove from list
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setCounts((prev) => ({
          ...prev,
          [item.itemType]: prev[item.itemType as keyof typeof prev] - 1,
          total: prev.total - 1,
        }));
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: QueueItem) => {
    if (!rejectionReason.trim()) {
      return;
    }

    setProcessingId(item.id);
    try {
      const response = await fetch('/api/agent/verification-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          itemType: item.itemType,
          action: 'reject',
          agentId,
          rejectionReason,
        }),
      });

      if (response.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setCounts((prev) => ({
          ...prev,
          [item.itemType]: prev[item.itemType as keyof typeof prev] - 1,
          total: prev.total - 1,
        }));
        setRejectingId(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Rejection failed:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/agent-portal"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
          <h1 className="text-3xl font-bold text-white">Verification Queue</h1>
          <p className="text-slate-400 mt-1">One-tap verification for pending submissions</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All', count: counts.total },
            { key: 'biochar', label: 'Biochar Batches', count: counts.biochar, icon: Leaf },
            { key: 'recycling', label: 'Recycling Logs', count: counts.recycling, icon: Recycle },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all',
                filter === tab.key
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              )}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  filter === tab.key ? 'bg-amber-600' : 'bg-slate-700'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Queue Items */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">All Caught Up!</h2>
            <p className="text-slate-400">No pending items require verification.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Item Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          item.itemType === 'biochar' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                        )}
                      >
                        {item.itemType === 'biochar' ? (
                          <Leaf className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Recycle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <span
                          className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            item.itemType === 'biochar'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-blue-500/10 text-blue-400'
                          )}
                        >
                          {item.itemType === 'biochar' ? 'Biochar Batch' : 'Recycling Log'}
                        </span>
                        <p className="text-white font-medium mt-1">
                          {item.itemType === 'biochar' ? item.batchId : item.logId}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {item.itemType === 'biochar' ? (
                        <>
                          <div>
                            <p className="text-slate-500">Feedstock</p>
                            <p className="text-white capitalize">{item.feedstockType?.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Weight</p>
                            <p className="text-white flex items-center gap-1">
                              <Scale className="w-3 h-3" />
                              {item.dryWeightKg?.toLocaleString()} kg
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">CDR Credits</p>
                            <p className="text-emerald-400 font-medium">
                              {item.cdrCreditsTonnes?.toFixed(4)} tonnes
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Farmer</p>
                            <p className="text-white flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.farmerName || 'Unknown'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-slate-500">Material</p>
                            <p className="text-white capitalize">{item.materialType}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Weight</p>
                            <p className="text-white flex items-center gap-1">
                              <Scale className="w-3 h-3" />
                              {item.weightKg?.toLocaleString()} kg
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Source</p>
                            <p className="text-white flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.sourceLocation || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Destination</p>
                            <p className="text-white">{item.yardName || 'Not assigned'}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      Submitted {formatDate(item.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {rejectingId === item.id ? (
                      <div className="w-64">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Reason for rejection..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleReject(item)}
                            disabled={!rejectionReason.trim() || processingId === item.id}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50"
                          >
                            {processingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              'Confirm'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionReason('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleVerify(item)}
                          disabled={processingId === item.id}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                        >
                          {processingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Verify
                        </button>
                        <button
                          onClick={() => setRejectingId(item.id)}
                          disabled={processingId === item.id}
                          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-red-600 text-white font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        {items.length > 0 && (
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium">Verification Tip</p>
                <p className="text-sm text-amber-400/80 mt-1">
                  Verify items to approve them for carbon credit issuance. Rejected items will require
                  the submitter to resubmit with corrections.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
