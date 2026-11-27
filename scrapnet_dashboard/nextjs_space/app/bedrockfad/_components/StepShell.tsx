'use client';

import React from 'react';

const STEPS: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: 'Submit Your Information' },
  { n: 2, label: 'Drop & Submit Your Files' },
  { n: 3, label: 'Review & Submit' },
];

export default function StepShell({
  activeStep,
  completedSteps = [],
}: {
  activeStep: 1 | 2 | 3;
  completedSteps?: number[];
}) {
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
          maxWidth: 760,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        {STEPS.map((step, i) => {
          const active = step.n === activeStep;
          const done = completedSteps.includes(step.n) && !active;
          const circleBg = done ? '#10b981' : active ? '#06b6d4' : 'transparent';
          const circleColor = done || active ? '#030712' : '#64748b';
          const circleBorder =
            done || active ? 'none' : '1px solid #334155';
          const circleGlow = done
            ? '0 0 14px -2px rgba(16,185,129,.7)'
            : active
            ? '0 0 14px -2px rgba(6,182,212,.7)'
            : 'none';
          const labelColor = done
            ? '#10b981'
            : active
            ? '#06b6d4'
            : '#64748b';
          return (
            <React.Fragment key={step.n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: circleColor,
                    background: circleBg,
                    border: circleBorder,
                    boxShadow: circleGlow,
                    transition: 'all .25s ease',
                  }}
                >
                  {done ? (
                    <i className="fa-solid fa-check" style={{ fontSize: 12 }} />
                  ) : (
                    step.n
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: '.03em',
                    fontWeight: active || done ? 700 : 400,
                    color: labelColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    width: 28,
                    height: 1,
                    background: completedSteps.includes(step.n)
                      ? 'rgba(16,185,129,.5)'
                      : '#334155',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
