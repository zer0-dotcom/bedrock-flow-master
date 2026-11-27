'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import HelpTooltip from '@/components/ui/HelpTooltip';
import type { IntakePayload, IntakeTrack } from './Step1Gate';

const humanSize = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

// Client-side fallback reference, used only if the backend 201 omits submissionRef.
const genFallbackRef = (): string => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FAD-${ymd}-${rand}`;
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#64748b',
};

export default function Step3Confirm({
  track,
  payload,
  files,
  referralCode,
  onEditInfo,
  onEditFiles,
}: {
  track: IntakeTrack;
  payload: IntakePayload;
  files: File[];
  referralCode?: string | null;
  onEditInfo: () => void;
  onEditFiles: () => void;
}) {
  const router = useRouter();
  const residential = track === 'residential';
  const accent = residential ? '#06b6d4' : '#f59e0b';

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [notify, setNotify] = useState(false);

  const handleSubmit = async () => {
    if (submitting || files.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('companyName', payload.companyName);
      fd.append('contactName', payload.contactName);
      fd.append('contactEmail', payload.contactEmail);
      if (referralCode) fd.append('referralCode', referralCode);
      // Extended context — backend zod ignores unknown keys (Sprint-8 persistence).
      fd.append('intakeTrack', payload.track);
      fd.append('zip', payload.zip);
      if (payload.facilityType) fd.append('facilityType', payload.facilityType);
      if (payload.sqFt) fd.append('sqFt', payload.sqFt);
      if (payload.equipment) fd.append('equipment', payload.equipment);
      // Multi-file: route reads getAll('file'); single file stays byte-identical.
      for (const f of files) fd.append('file', f);

      const res = await fetch('/api/bedrockfad/intake', { method: 'POST', body: fd });

      if (res.status === 201) {
        const data = await res.json().catch(() => null);
        const ref: string =
          (data && data.ok && typeof data.submissionRef === 'string' && data.submissionRef) ||
          genFallbackRef();
        setConfirmedRef(ref);
        return;
      }

      setError(
        'Submission failed — please try again. If the issue persists, email ops@bedrockesg.com.',
      );
    } catch {
      setError(
        'Submission failed — please try again. If the issue persists, email ops@bedrockesg.com.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ───────────────────────── CONFIRMATION VIEW ─────────────────────────
  if (confirmedRef) {
    return (
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: '48px 28px',
          background: 'rgba(15,23,42,.62)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(16,185,129,.22)',
          borderRadius: 4,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(16,185,129,.14)',
            border: '1px solid rgba(16,185,129,.45)',
            boxShadow: '0 0 28px -4px rgba(16,185,129,.5)',
          }}
        >
          <i className="fa-solid fa-check" style={{ fontSize: 26, color: '#10b981' }} />
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#f8fafc', marginBottom: 14 }}>
          Submission Received!
        </h2>
        <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 28 }}>
          Expect your verified asset report within <strong style={{ color: '#f8fafc' }}>24 hours</strong>.
          Our operators review every submission under the Bedrock Internal dMRV Standard. A
          confirmation has been routed to{' '}
          <strong style={{ color: '#f8fafc' }}>{payload.contactEmail}</strong>.
        </p>

        <div
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            borderRadius: 3,
            background: 'rgba(6,182,212,.06)',
            border: '1px solid rgba(6,182,212,.22)',
            marginBottom: 32,
          }}
        >
          <div style={{ ...labelStyle, marginBottom: 6 }}>Confirmation Reference</div>
          <div
            style={{
              fontSize: 15,
              fontFamily: 'monospace',
              letterSpacing: '.14em',
              color: '#22d3ee',
            }}
          >
            REF: {confirmedRef}
            <HelpTooltip content="A unique forensic reference ID assigned to your submission. Keep this for your records." />
          </div>
        </div>

        {/* PHASE 2 — COMING SOON WAITLIST (opt-in UI only; no payload re-submit) */}
        <div
          style={{
            marginBottom: 28,
            padding: '20px 22px',
            borderRadius: 4,
            textAlign: 'left',
            background: 'rgba(139,92,246,.05)',
            border: '1px solid rgba(139,92,246,.26)',
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: '#a78bfa',
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Coming Soon — Phase 2: Aethexer Sovereign Skin
          </div>
          <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.65, marginBottom: 16 }}>
            The next evolution of the Bedrock protocol — a sovereign thermal cooling skin that turns
            your facility&apos;s waste heat into a verifiable, self-custodied asset layer. Be first
            to know when it launches.
          </p>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: notify ? 'default' : 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={notify}
              disabled={notify}
              onChange={(e) => {
                if (e.target.checked && !notify) {
                  setNotify(true);
                  // GATE S7-04-A: schema change deferred to Sprint 8 — no-op opt-in.
                  console.log('[Phase2Waitlist] opted-in:', confirmedRef);
                }
              }}
              style={{ width: 16, height: 16, accentColor: '#8b5cf6', cursor: 'inherit' }}
            />
            <span style={{ fontSize: 12, color: notify ? '#10b981' : '#e2e8f0', fontWeight: 600 }}>
              {notify ? "✅ You're on the list!" : 'Notify Me When Phase 2 Launches'}
            </span>
          </label>
        </div>

        <button
          onClick={() => router.push('/discover')}
          style={{
            padding: '14px 28px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: '#030712',
            background: '#06b6d4',
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 0 24px -6px rgba(6,182,212,.6)',
          }}
        >
          View Your Carbon Verification Dashboard
        </button>
      </div>
    );
  }

  // ───────────────────────── REVIEW VIEW ─────────────────────────
  const infoRows: { k: string; v: string }[] = residential
    ? [
        { k: 'Name', v: payload.contactName },
        { k: 'Email', v: payload.contactEmail },
        { k: 'ZIP Code', v: payload.zip },
      ]
    : [
        { k: 'Company', v: payload.companyName },
        { k: 'Contact', v: payload.contactName },
        { k: 'Email', v: payload.contactEmail },
        { k: 'Facility Type', v: payload.facilityType ?? '—' },
        { k: 'ZIP Code', v: payload.zip },
        { k: 'Square Footage', v: payload.sqFt ?? '—' },
        ...(payload.equipment ? [{ k: 'Equipment', v: payload.equipment }] : []),
      ];

  return (
    <div
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '40px 28px',
        background: 'rgba(15,23,42,.62)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: `1px solid ${residential ? 'rgba(6,182,212,.18)' : 'rgba(245,158,11,.18)'}`,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '.18em',
          color: accent,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Step 3 · Review &amp; Submit
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 24 }}>
        Review your submission
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
        {/* INFO RECAP */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,.08)',
            background: 'rgba(2,6,23,.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={labelStyle}>Your Information</span>
            <button
              type="button"
              onClick={onEditInfo}
              style={{
                fontSize: 10,
                color: accent,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            >
              Edit
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {infoRows.map((r) => (
              <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>{r.k}</span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#e2e8f0',
                    textAlign: 'right',
                    wordBreak: 'break-word',
                  }}
                >
                  {r.v}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FILES RECAP */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,.08)',
            background: 'rgba(2,6,23,.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={labelStyle}>Attached Files ({files.length})</span>
            <button
              type="button"
              onClick={onEditFiles}
              style={{
                fontSize: 10,
                color: accent,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            >
              Edit
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: '#e2e8f0',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {f.name}
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {humanSize(f.size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {referralCode && (
        <div style={{ marginTop: 16, fontSize: 11, color: '#22d3ee', fontFamily: 'monospace', letterSpacing: '.06em' }}>
          Partner Code: {referralCode}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 20,
            padding: '12px 16px',
            borderRadius: 3,
            border: '1px solid rgba(239,68,68,.4)',
            background: 'rgba(239,68,68,.06)',
            fontSize: 12,
            color: '#fca5a5',
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || files.length === 0}
        style={{
          marginTop: 28,
          width: '100%',
          padding: '15px 24px',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: '#030712',
          background: accent,
          border: 'none',
          borderRadius: 3,
          cursor: submitting || files.length === 0 ? 'not-allowed' : 'pointer',
          opacity: submitting || files.length === 0 ? 0.6 : 1,
          fontFamily: 'inherit',
          boxShadow:
            submitting || files.length === 0
              ? 'none'
              : `0 0 24px -6px ${residential ? 'rgba(6,182,212,.6)' : 'rgba(245,158,11,.6)'}`,
        }}
      >
        {submitting ? 'Submitting…' : 'Submit & Start Discovery →'}
      </button>
    </div>
  );
}
