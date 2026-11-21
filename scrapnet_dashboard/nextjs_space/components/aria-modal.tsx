'use client';

import Link from 'next/link';
import { X } from 'lucide-react';

interface AriaModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AriaModal({ open, onClose }: AriaModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aria-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#0a0f14]/95 shadow-[0_0_40px_-8px_rgba(34,211,238,0.35)]">
        {/* Accent top line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-cyan-300/70 hover:bg-cyan-500/10 hover:text-cyan-200 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-7 py-8">
          {/* Brand mark */}
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-cyan-400 to-emerald-500">
              <span className="text-sm font-black text-black">B</span>
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
              Bedrock ESG
            </span>
          </div>

          <h2
            id="aria-modal-title"
            className="text-xl font-semibold text-white"
          >
            ARIA — Intelligent Verification System
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-slate-300/90">
            Full AI interface activating Sprint 4. Carbon verification and
            forensic intake now available on this platform.
          </p>

          <Link
            href="/discover"
            onClick={onClose}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-cyan-500/15 px-4 py-2.5 text-sm font-medium text-cyan-200 ring-1 ring-inset ring-cyan-400/40 hover:bg-cyan-500/25 transition-colors"
          >
            Explore the Platform
          </Link>
        </div>
      </div>
    </div>
  );
}
