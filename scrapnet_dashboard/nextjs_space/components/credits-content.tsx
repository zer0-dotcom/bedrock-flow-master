'use client';

import { useState, useEffect } from 'react';
import { Coins, CheckCircle2, Clock, Wallet, Download, ArrowRight } from 'lucide-react';
import { cn, formatNumber, formatDate, downloadJson } from '@/lib/utils';
import { FarmerCreditData, CreditStatus } from '@/lib/types';

interface CreditStats {
  pending: { count: number; amount: number };
  issued: { count: number; amount: number };
  redeemed: { count: number; amount: number };
  total: { count: number; amount: number };
}

export default function CreditsContent() {
  const [credits, setCredits] = useState<FarmerCreditData[]>([]);
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedCredits, setSelectedCredits] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);

      const [creditsRes, statsRes] = await Promise.all([
        fetch(`/api/credits?${params}`),
        fetch('/api/credits/stats'),
      ]);

      const creditsData = await creditsRes.json();
      const statsData = await statsRes.json();

      setCredits(Array.isArray(creditsData) ? creditsData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const handleIssueCredits = async () => {
    if (selectedCredits.length === 0) return;
    setIsProcessing(true);
    try {
      await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue', creditIds: selectedCredits }),
      });
      setSelectedCredits([]);
      fetchData();
    } catch (error) {
      console.error('Error issuing credits:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemCredits = async () => {
    if (selectedCredits.length === 0) return;
    const tokenId = prompt('Enter Token ID for blockchain minting:');
    const transactionHash = prompt('Enter Transaction Hash:');
    if (!tokenId || !transactionHash) return;

    setIsProcessing(true);
    try {
      await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'redeem', creditIds: selectedCredits, tokenId, transactionHash }),
      });
      setSelectedCredits([]);
      fetchData();
    } catch (error) {
      console.error('Error redeeming credits:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportMintData = () => {
    const mintData = credits
      .filter((c) => c.status === 'issued' && selectedCredits.includes(c.id))
      .map((c) => ({
        credit_id: c.creditId,
        farmer_id: c.farmer?.farmerId,
        farmer_name: c.farmer?.name,
        credit_amount_tonnes: c.creditAmount,
        credit_type: c.creditType,
        batch_id: c.batchId,
        issued_at: c.issuedAt,
        metadata: {
          standard: 'ERC-20',
          network: 'Polygon',
          decimals: 18,
          symbol: 'SCRP',
        },
      }));
    downloadJson(mintData, 'mint-ready-credits.json');
  };

  const toggleSelect = (id: string) => {
    setSelectedCredits((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = credits
      .filter((c) => !filterStatus || c.status === filterStatus)
      .map((c) => c.id);
    setSelectedCredits(filteredIds);
  };

  const getStatusBadge = (status: CreditStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'issued':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Issued
          </span>
        );
      case 'redeemed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <Wallet className="h-3 w-3" /> Redeemed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending.count}</p>
            <p className="text-xs text-slate-500">{formatNumber(stats.pending.amount, 4)} tonnes</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Issued</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.issued.count}</p>
            <p className="text-xs text-slate-500">{formatNumber(stats.issued.amount, 4)} tonnes</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Redeemed</p>
            <p className="text-2xl font-bold text-purple-600">{stats.redeemed.count}</p>
            <p className="text-xs text-slate-500">{formatNumber(stats.redeemed.amount, 4)} tonnes</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Total Credits</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total.count}</p>
            <p className="text-xs text-slate-500">{formatNumber(stats.total.amount, 4)} tonnes</p>
          </div>
        </div>
      )}

      {/* Credit Flow Diagram */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Credit Lifecycle</h3>
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Pending</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400" />
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Issued</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400" />
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 mx-auto">
              <Wallet className="h-6 w-6 text-purple-600" />
            </div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Redeemed (Minted)</p>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="issued">Issued</option>
            <option value="redeemed">Redeemed</option>
          </select>
          <button
            onClick={selectAllFiltered}
            className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400"
          >
            Select All
          </button>
          {selectedCredits.length > 0 && (
            <span className="text-sm text-slate-500">
              {selectedCredits.length} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleIssueCredits}
            disabled={selectedCredits.length === 0 || isProcessing}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Issue Selected
          </button>
          <button
            onClick={handleExportMintData}
            disabled={selectedCredits.length === 0}
            className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export Mint Data
          </button>
          <button
            onClick={handleRedeemCredits}
            disabled={selectedCredits.length === 0 || isProcessing}
            className="flex items-center gap-2 rounded-lg border border-purple-500 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
          >
            <Wallet className="h-4 w-4" />
            Mark Redeemed
          </button>
        </div>
      </div>

      {/* Credits Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : credits.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-500">
            <Coins className="h-12 w-12 mb-2 opacity-50" />
            <p>No credits found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCredits.length === credits.length && credits.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCredits(credits.map((c) => c.id));
                      } else {
                        setSelectedCredits([]);
                      }
                    }}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Credit ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Farmer</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {credits.map((credit) => (
                <tr key={credit.id} className={cn(
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  selectedCredits.includes(credit.id) && 'bg-amber-50 dark:bg-amber-900/10'
                )}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCredits.includes(credit.id)}
                      onChange={() => toggleSelect(credit.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white">
                    {credit.creditId.slice(0, 12)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                    {credit.farmer?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-amber-600">
                    {formatNumber(credit.creditAmount, 4)} t
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {credit.creditType.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(credit.status as CreditStatus)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(credit.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
