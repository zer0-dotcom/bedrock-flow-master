'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function Step3Confirm() {
  const router = useRouter();

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: '48px 28px',
        background: 'rgba(15,23,42,.62)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid rgba(16,185,129,.2)',
        borderRadius: 4,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(16,185,129,.12)',
          border: '1px solid rgba(16,185,129,.4)',
        }}
      >
        <i className="fa-solid fa-check" style={{ fontSize: 22, color: '#10b981' }} />
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 16, lineHeight: 1.25 }}>
        Your forensic profile is being compiled.
      </h2>
      <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 32 }}>
        Expect your verified asset report within 24 hours. Our operators review every
        submission under the Bedrock Internal dMRV Standard.
      </p>

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
