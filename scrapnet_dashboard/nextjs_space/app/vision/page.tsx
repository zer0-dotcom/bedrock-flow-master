'use client';

// Sprint 5 — Public editorial vision page. No auth. Zero-pitch copy.

import React from 'react';
import Link from 'next/link';
import { Upload, ShieldCheck, Coins, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function VisionPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans">
      {/* Hero */}
      <section className="px-6 py-28 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-[11px] tracking-[0.2em] uppercase text-cyan-400 mb-5">Bedrock ESG</div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-[1.08] mb-7">
            The Bedrock Standard
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
            A verified pipeline between corporate environmental liability and institutional-grade settlement infrastructure.
          </p>
        </div>
      </section>

      {/* Section 1 */}
      <section className="px-6 py-24 border-b border-slate-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-6">
            Unverified Claims. Unmonetized Assets.
          </h2>
          <div className="space-y-5 text-base text-slate-400 leading-relaxed">
            <p>
              Across industry, enormous environmental value sits stranded — contamination records, remediation
              liabilities, mineral assays, and carbon-accounting data that never pass through a credible verification
              path. Without forensic intake, these assets remain unproven and, therefore, unmonetizable.
            </p>
            <p>
              The gap is not data. It is <span className="text-slate-200">chain-of-custody</span>. A claim is only as
              strong as the trail behind it: who submitted it, whether the file arrived unmodified, and how its decision
              was recorded. Absent that trail, even legitimate assets lack credible settlement rails.
            </p>
            <p>
              Bedrock exists to close that gap — turning unverified documentation into an auditable record that
              downstream settlement can rely on.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 — step strip */}
      <section className="px-6 py-24 border-b border-slate-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3 text-center">
            Forensic Intake → Verified Settlement → On-Chain Attestation
          </h2>
          <p className="text-sm text-slate-500 text-center mb-14 max-w-2xl mx-auto">
            One continuous, status-tracked path from document to confirmed settlement.
          </p>

          <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-4">
            <Step
              icon={<Upload className="h-6 w-6" />}
              n="01"
              title="Submit"
              body="Document upload with magic-byte and SHA-256 validation and isolated storage. Every file is fingerprinted on receipt and held in a vault that is never publicly accessible."
            />
            <Connector />
            <Step
              icon={<ShieldCheck className="h-6 w-6" />}
              n="02"
              title="Review"
              body="Forensic analyst review with a status-tracked decision trail. Each submission advances through a recorded sequence of states — nothing is approved without an auditable path."
            />
            <Connector />
            <Step
              icon={<Coins className="h-6 w-6" />}
              n="03"
              title="Settle"
              body="Revenue distributed via executeDynamicSplit() at 10,000 BPS, from realized settlement only. Nothing is owed upfront — distribution happens strictly from confirmed revenue."
            />
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="px-6 py-24 border-b border-slate-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-6">
            Zero Upfront. Payable on Verified Settlement.
          </h2>
          <div className="space-y-5 text-base text-slate-400 leading-relaxed">
            <p>
              There is no retainer. No success fee is due before settlement funds clear. The model is deliberately
              simple: compensation flows only after a verified settlement event, from the revenue that event realizes.
            </p>
            <p>
              Distribution is governed by a <span className="text-slate-200">10,000-BPS split</span> applied to confirmed
              revenue — never to projections, never to unrealized value. The same verified event that compensates
              Bedrock is the single source from which referral partners and specialists are compensated.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — two columns */}
      <section className="px-6 py-24 border-b border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-12 text-center">
            Referral Partners &amp; Specialists
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-8">
              <h3 className="text-xl font-bold text-white mb-3">Referral Partners</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Introduce corporate submissions to the Bedrock pipeline and earn a share of verified settlement
                revenue — attributed through a unique REF- code, payable upon confirmed client settlement only.
              </p>
              <Link href="/referrals" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200 transition-colors">
                Become a Referral Partner <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-8">
              <h3 className="text-xl font-bold text-white mb-3">Specialists</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Vetted independent advisors access the Bedrock deal flow directly. Each verified specialist receives a
                unique SPEC- code linked to the client submissions they refer.
              </p>
              <Link href="/specialists" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200 transition-colors">
                Join the Specialist Network <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-8">
            Ready to verify an asset?
          </h2>
          <Link
            href="/bedrockfad"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-cyan-500 text-[#030712] text-xs font-bold uppercase tracking-[0.1em] hover:bg-cyan-400 transition-colors"
          >
            Start a Submission <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Step({ icon, n, title, body }: { icon: React.ReactNode; n: string; title: string; body: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-slate-900/50 border border-slate-800 p-7">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-300">
          {icon}
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-600 tracking-wider">{n}</span>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="hidden md:flex items-center justify-center text-slate-700 px-1">
      <ArrowRight className="h-5 w-5" />
    </div>
  );
}
