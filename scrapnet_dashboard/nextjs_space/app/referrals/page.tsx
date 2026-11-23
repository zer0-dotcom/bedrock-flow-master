'use client';

// Sprint 5 — Public Referral Partner signup page.

import React, { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ReferralsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareLink = refCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/bedrockfad?ref=${refCode}`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Full name is required.');
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/referrer-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, companyName: company.trim() || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data.refCode) {
        setRefCode(data.refCode);
      } else {
        setError(data?.error || 'Signup failed. Please try again.');
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

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 flex items-center justify-center px-4 py-16 font-sans">
      <div className="w-full max-w-lg">
        {!refCode ? (
          <>
            <div className="mb-8 text-center">
              <div className="text-[11px] tracking-[0.18em] uppercase text-cyan-400 mb-3">Bedrock ESG</div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Become a Bedrock Referral Partner</h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Earn a share of verified settlement revenue — zero upfront cost, payable upon confirmed client settlement only.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900/60 border border-cyan-500/15 backdrop-blur p-8 space-y-5">
              <Field label="Full Name *">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Partner" className={inputCls} />
              </Field>
              <Field label="Email *">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@firm.com" className={inputCls} />
              </Field>
              <Field label="Company Name (optional)">
                <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Partner Advisory LLC" className={inputCls} />
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
                {submitting ? 'Creating account…' : 'Create Partner Account'}
              </button>
            </form>
          </>
        ) : (
          <div className="rounded-2xl bg-slate-900/60 border border-emerald-500/25 backdrop-blur p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/12 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-emerald-400">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You&apos;re a Bedrock Referral Partner</h2>
            <p className="text-sm text-slate-400 mb-6">Your unique referral code has been issued.</p>

            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-2">Your Referral Code</div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-bold text-cyan-300 tracking-wider">{refCode}</span>
                <button onClick={() => copy(refCode)} className="px-3 py-1.5 text-[10px] font-bold uppercase rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors">
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-slate-950/50 border border-slate-700/50 p-4 text-left">
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-2">Share this link</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-slate-300 break-all font-mono">{shareLink}</code>
                <button onClick={() => copy(shareLink)} className="shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase rounded-md bg-slate-800 text-slate-300 border border-slate-600 hover:text-white transition-colors">
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
