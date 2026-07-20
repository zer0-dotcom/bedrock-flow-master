import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import DashboardContent from '@/components/dashboard-content';
import TotalCarbonImpact from '@/components/total-carbon-impact';
import CockpitTicker from '@/components/cockpit-ticker';
import ImpactCalculationEngine from '@/components/impact-calculation-engine';

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* v2.3 — Unified Live Asset Matrix Ticker */}
      <CockpitTicker />

      {/* Hero Section - Bedrock ESG Manifesto */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-zinc-800 to-stone-900 p-8 border border-zinc-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDMwaC0ydjJoMnYtMnptLTEwIDBoLTJ2Mmgydi0yem0yMCAwaC0ydjJoMnYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-2xl font-black text-white">B</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Bedrock ESG</h1>
              <p className="text-sm text-zinc-400 font-medium">The Circular Trifecta</p>
            </div>
          </div>
          <p className="text-lg text-zinc-300 font-medium max-w-2xl">
            The era of greenwashing is over. PDF reports and manual audits aren&apos;t sustainability—they&apos;re just guesswork.
          </p>
          <p className="mt-2 text-emerald-400 font-semibold">
            Stop guessing. Start verifying.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="rounded-lg bg-zinc-800/80 px-4 py-3 backdrop-blur-sm border border-emerald-500/30">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Asphalt</p>
              <p className="text-lg font-bold text-white">RAP Verification</p>
            </div>
            <div className="rounded-lg bg-zinc-800/80 px-4 py-3 backdrop-blur-sm border border-amber-500/30">
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Biochar</p>
              <p className="text-lg font-bold text-white">CDR Certification</p>
            </div>
            <div className="rounded-lg bg-zinc-800/80 px-4 py-3 backdrop-blur-sm border border-cyan-500/30">
              <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Metal</p>
              <p className="text-lg font-bold text-white">Recovery Attestation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Master Counter - Total Carbon Impact */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <TotalCarbonImpact />
      </Suspense>

      {/* Impact Calculation Engine — Asphalt RAP Dashboard Panel */}
      <ImpactCalculationEngine />

      {/* Dashboard Content */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
