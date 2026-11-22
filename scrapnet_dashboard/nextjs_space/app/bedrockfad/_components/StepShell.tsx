'use client';

import React from 'react';

const STEPS: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: '1 · Contact Info' },
  { n: 2, label: '2 · Upload Data' },
  { n: 3, label: '3 · Confirmation' },
];

export default function StepShell({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(3,7,18,.9)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(6,182,212,.14)',
        padding: '16px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        {STEPS.map((step, i) => {
          const active = step.n === activeStep;
          return (
            <React.Fragment key={step.n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: active ? '#030712' : '#64748b',
                    background: active ? '#06b6d4' : 'transparent',
                    border: active ? 'none' : '1px solid #334155',
                    boxShadow: active ? '0 0 14px -2px rgba(6,182,212,.7)' : 'none',
                  }}
                >
                  {step.n}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: '.04em',
                    fontWeight: active ? 700 : 400,
                    color: active ? '#06b6d4' : '#64748b',
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 28, height: 1, background: '#334155' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
