'use client';

import React, { useEffect, useRef, useState } from 'react';

type Placement = 'top' | 'right';

/**
 * HelpTooltip — lightweight, dependency-free hover/tap popover.
 * - Desktop: hover to show, click to pin, Escape to close.
 * - Mobile/touch: tap the "?" trigger to toggle.
 * Pure React + Tailwind. Additive UI helper; renders nothing but an inline "?".
 */
export default function HelpTooltip({
  content,
  placement = 'top',
}: {
  content: React.ReactNode;
  placement?: Placement;
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setPinned(false);
      }
    };
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open]);

  const cardPos =
    placement === 'right'
      ? 'left-full top-1/2 -translate-y-1/2 ml-2'
      : 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <span ref={wrapRef} className="relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label="Help"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const next = !open;
          setOpen(next);
          setPinned(next);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => {
          if (!pinned) setOpen(false);
        }}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-cyan-400/50 text-[10px] font-bold leading-none text-cyan-300 transition-colors hover:border-cyan-300 hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 ${cardPos} w-64 max-w-[80vw] rounded-md border border-cyan-400/25 bg-slate-900/95 px-3 py-2 text-left text-[11px] font-normal normal-case leading-relaxed tracking-normal text-slate-200 shadow-xl backdrop-blur`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
