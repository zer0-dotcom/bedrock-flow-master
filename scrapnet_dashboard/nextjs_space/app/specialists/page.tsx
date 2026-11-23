'use client';

// Sprint 5 — Public Specialist Network signup page (two sections).

import React, { useState, useRef } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SpecialistsPage() {
  const formRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specCode, setSpecCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Full name is required.');
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/specialist-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          specialty: specialty.trim() || undefined,
          companyName: company.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data.specCode) {
        setSpecCode(data.specCode);
      } else {
        setError(data?.error || 'Application failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  const aethexerLink = specCode ? `https://aethexer.com/EXITZ?spec=${specCode}` : '';

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans">
      {/* Section 1 — above fold */}
      <section className="min-h-[70vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl text-center">
          <div className="text-[11px] tracking-[0.18em] uppercase text-cyan-400 mb-4">Bedrock ESG</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6">Bedrock Specialist Network</h1>
          <p className="text-base text-slate-400 leading-relaxed mb-10 max-w-xl mx-auto">
            Specialists access the Bedrock ESG deal flow as vetted independent advisors. Each verified specialist
            receives a unique SPEC- code linked to client submissions they refer.
          </p>
          <button
            onClick={scrollToForm}
            className="px-8 py-4 rounded-lg bg-cyan-500 text-[#030712] text-xs font-bold uppercase tracking-[0.1em] hover:bg-cyan-400 transition-colors"
          >
            Apply to Join
          </button>
        </div>
      </section>

      {/* Section 2 — form */}
      <section ref={formRef} className="px-4 py-20 border-t border-slate-800">
        <div className="max-w-lg mx-auto">
          {!specCode ? (
            <>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-6 text-center">Specialist Application</h2>
              <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900/60 border border-cyan-500/15 backdrop-blur p-8 space-y-5">
                <Field label="Full Name *">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Alex Specialist" className={inputCls} />
                </Field>
                <Field label="Email *">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@practice.com" className={inputCls} />
                </Field>
                <Field label="Specialty / Discipline *">
                  <input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Environmental remediation, mineral assay…" className={inputCls} />
                </Field>
                <Field label="Company / Practice Name (optional)">
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Specialist Practice LLC" className={inputCls} />
                </Field>
                <Field label="Password *">
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputCls} />
                </Field>
                <Field label="Confirm Password *">
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" className={inputCls} />
                </Field>

                {error && <div className="text-xs text-red-400">{error}</div>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-lg bg-cyan-500 text-[#030712] text-xs font-bold uppercase tracking-[0.1em] hover:bg-cyan-400 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </form>
            </>
          ) : (
            <div className="rounded-2xl bg-slate-900/60 border border-emerald-500/25 backdrop-blur p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/12 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-emerald-400">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Specialist Network</h2>
              <p className="text-sm text-slate-400 mb-6">Your unique specialist code has been issued.</p>

              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-2">Your Specialist Code</div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-cyan-300 tracking-wider">{specCode}</span>
                  <button onClick={() => copy(specCode)} className="px-3 py-1.5 text-[10px] font-bold uppercase rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors">
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <a
                href={aethexerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 rounded-lg bg-cyan-500 text-[#030712] text-xs font-bold uppercase tracking-[0.1em] hover:bg-cyan-400 transition-colors"
              >
                Explore opportunities on Aethexer →
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 text-sm text-slate-200 bg-slate-950/60 border border-slate-700 rounded-lg outline-none focus:border-cyan-500/50 transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
