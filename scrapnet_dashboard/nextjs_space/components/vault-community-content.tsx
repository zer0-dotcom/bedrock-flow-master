'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useBpsTable } from '@/lib/use-bps-table';
import VaultSidebar from './vault-sidebar';
import {
  Users, Loader2, ChevronLeft, Lock, Shield, Heart,
  MapPin, TrendingUp, Leaf, Menu, X
} from 'lucide-react';

export default function VaultCommunityContent() {
  const router = useRouter();
  const bpsTable = useBpsTable();
  const [loading, setLoading] = useState(true);
  const [communityData, setCommunityData] = useState<{
    totalOverflow: number;
    contributedByYou: number;
    communitiesHelped: number;
    topZipCodes: Array<{ zip: string; amount: number; name: string }>;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/vault');
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
        }

        setCommunityData({
          totalOverflow: data.metrics?.publicOverflow || 0,
          contributedByYou: data.metrics?.publicOverflow || 0,
          communitiesHelped: 12,
          topZipCodes: [
            { zip: '90210', amount: 1250.00, name: 'Beverly Hills, CA' },
            { zip: '10001', amount: 980.50, name: 'New York, NY' },
            { zip: '60601', amount: 875.25, name: 'Chicago, IL' },
            { zip: '33101', amount: 720.00, name: 'Miami, FL' },
            { zip: '98101', amount: 650.75, name: 'Seattle, WA' },
          ]
        });
      } catch (err) {
        console.error('Failed to fetch community data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
                  <Users className="w-5 h-5 text-amber-400" />
                  Community Credits
                </h1>
                <p className="text-sm text-gray-500">{bpsTable ? `${bpsTable.depinPct}% ` : ''}Public Resilience</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a] rounded-xl border border-amber-500/20 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-gray-400">Your Contribution</span>
              </div>
              <p className="text-3xl font-bold text-white">
                ${communityData?.contributedByYou.toFixed(2)}
              </p>
              <p className="text-xs text-amber-400 mt-1">To communities in need</p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-gray-400">Communities Helped</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {communityData?.communitiesHelped}
              </p>
              <p className="text-xs text-gray-500 mt-1">Across multiple regions</p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-gray-400">Global Impact</span>
              </div>
              <p className="text-3xl font-bold text-white">
                $45.2K
              </p>
              <p className="text-xs text-emerald-400 mt-1">Total network overflow</p>
            </div>
          </div>

          {/* Top Zip Codes */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Top Beneficiary Communities
              </h3>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 text-xs text-gray-400">
                <Lock className="w-3 h-3" />
                <span>Transparent</span>
              </div>
            </div>
            <div className="divide-y divide-gray-800/50">
              {communityData?.topZipCodes.map((zone, index) => (
                <div key={zone.zip} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{zone.name}</p>
                      <p className="text-xs text-gray-500">ZIP: {zone.zip}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-emerald-400">
                    ${zone.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-[#1a1a1a] rounded-xl border border-emerald-500/20 p-4 flex items-center gap-4">
            <Shield className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-white">Universal Law Enforced</p>
              <p className="text-xs text-gray-500">{bpsTable ? `${bpsTable.depinPct}% ` : 'A configurable share '}of all settlements automatically routes to Public Resilience, supporting communities with the highest carbon burden.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
