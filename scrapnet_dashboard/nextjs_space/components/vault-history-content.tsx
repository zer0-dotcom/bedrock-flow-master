'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import VaultSidebar from './vault-sidebar';
import {
  History, Loader2, AlertCircle, CheckCircle2, Clock,
  Activity, ChevronLeft, Filter, Download, Lock,
  ArrowUpRight, ArrowDownLeft, Menu, X
} from 'lucide-react';

interface HistoryEntry {
  id: string;
  type: string;
  description: string;
  value: number;
  carbonSaved: number;
  status: 'verified' | 'pending' | 'processing';
  timestamp: string;
  category: 'carbon_entry' | 'legacy_audit' | 'community_credit';
}

export default function VaultHistoryContent() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/vault');
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error(data.error || 'Failed to fetch history');
        }

        // Transform data to history entries
        const historyEntries: HistoryEntry[] = [
          ...(data.recentEntries || []).map((entry: any) => ({
            id: entry.id,
            type: entry.type,
            description: `Carbon Entry - ${entry.entryId}`,
            value: entry.founderYield,
            carbonSaved: entry.carbonSaved,
            status: entry.verified ? 'verified' as const : 'pending' as const,
            timestamp: entry.createdAt,
            category: 'carbon_entry' as const
          })),
          ...(data.recentAudits || []).map((audit: any) => ({
            id: audit.id,
            type: 'Legacy Audit',
            description: `${audit.yearsAnalyzed.toFixed(1)} years analyzed`,
            value: audit.legacyYield,
            carbonSaved: audit.carbonAvoided,
            status: audit.compliant ? 'verified' as const : 'processing' as const,
            timestamp: audit.createdAt,
            category: 'legacy_audit' as const
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setEntries(historyEntries);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'verified') return entry.status === 'verified';
    return entry.status === 'pending' || entry.status === 'processing';
  });

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-[#0a0a0a] border-r border-gray-800/50 z-40 transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:w-16 lg:w-64"
      )}>
        <VaultSidebar />
      </div>

      {/* Main Content */}
      <main className="md:ml-16 lg:ml-64 min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/vault"
                className="p-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  Ledger History
                </h1>
                <p className="text-sm text-gray-500">{entries.length} transactions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 text-xs text-gray-400">
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Encrypted</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {['all', 'verified', 'pending'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition",
                  filter === f
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-700"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Entries List */}
          {error ? (
            <div className="bg-[#1a1a1a] rounded-xl border border-red-500/30 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-400">{error}</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-12 text-center">
              <History className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 divide-y divide-gray-800">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-[#0a0a0a] transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        entry.status === 'verified' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                      )}>
                        {entry.status === 'verified' 
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          : <Clock className="w-5 h-5 text-amber-400" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{entry.type}</p>
                        <p className="text-xs text-gray-500">{entry.description}</p>
                        <p className="text-xs text-gray-600 mt-1">{formatDate(entry.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-medium",
                        entry.value >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {entry.value >= 0 ? '+' : ''}${Math.abs(entry.value).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600">{entry.carbonSaved.toFixed(2)} tCO₂</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
