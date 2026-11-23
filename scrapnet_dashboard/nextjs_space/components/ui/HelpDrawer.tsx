'use client';

import React, { useEffect, useState } from 'react';

const QA: { q: string; a: string }[] = [
  {
    q: 'What happens after I submit?',
    a: 'Your submission enters PENDING_FORENSIC_REVIEW. Our team reviews the documentation for validity and completeness. You will be contacted at your submission email.',
  },
  {
    q: 'Is there a cost to submit?',
    a: 'No. Bedrock ESG operates on a zero-upfront model. Fees apply only upon verified settlement, distributed via our 10,000-BPS split from realized revenue.',
  },
  {
    q: 'What file types are accepted?',
    a: 'PDF, DOCX, XLSX, JPG, PNG up to 50 MB. Files are SHA-256 verified on receipt.',
  },
  {
    q: 'How long does review take?',
    a: 'Forensic review timelines vary by submission complexity. Most initial reviews complete within 5–10 business days.',
  },
  {
    q: 'What is a referral code?',
    a: 'If a Bedrock partner referred you, their REF- or SPEC- code links your submission to their account for attribution — it does not affect your submission or any fees.',
  },
];

/**
 * HelpDrawer — fixed bottom-right floating "? Need Help?" button.
 * Opens a slide-in drawer (bottom sheet on mobile, right panel on desktop ≥768px).
 * Pure React + Tailwind, no external deps. Close via × or Escape.
 */
export default function HelpDrawer() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Need Help?"
          className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-300 shadow-lg backdrop-blur transition-colors hover:border-cyan-300 hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        >
          <span aria-hidden className="text-sm leading-none">?</span>
          Need Help?
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Submission Support">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* panel */}
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl border-t border-cyan-400/20 bg-slate-950/95 p-5 shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[400px] md:max-w-[90vw] md:rounded-none md:border-l md:border-t-0"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100">Submission Support</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              >
                ×
              </button>
            </div>

            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-cyan-400">
              Common Questions
            </div>
            <div className="divide-y divide-white/10 rounded-md border border-white/10">
              {QA.map((item, i) => {
                const isOpen = expanded === i;
                return (
                  <div key={i}>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-[13px] font-medium text-slate-200 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                    >
                      <span>{item.q}</span>
                      <span aria-hidden className="shrink-0 text-cyan-400">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-[12px] leading-relaxed text-slate-400">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
