'use client';

import { useState, useEffect } from 'react';

/**
 * Client-side shape of the live, operator-configured BPS allocation table.
 * Mirrors the serialize-safe `BpsTable` exposed by /api/ledger?action=split.
 * Contains ONLY the percentage table + label — never per-settlement leg amounts
 * or vault addresses (those stay backend-silent).
 */
export interface BpsTableView {
  earnerBps: number;
  nodeBps: number;
  depinBps: number;
  totalBps: number;
  earnerPct: number;
  nodePct: number;
  depinPct: number;
  legs: { name: string; bps: number; percent: number }[];
  label: string;
}

/**
 * Reusable hook that fetches the live operator-configured BPS table once on
 * mount. Returns `null` until loaded (callers should render a neutral
 * placeholder). Guarantees zero hardcoded percentage literals in the UI — every
 * displayed split value flows from the runtime config.
 */
export function useBpsTable(): BpsTableView | null {
  const [bpsTable, setBpsTable] = useState<BpsTableView | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/ledger?action=split')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const table = data?.bpsTable ?? data?.contractConfig?.bpsTable;
        if (table && typeof table.earnerPct === 'number') {
          setBpsTable(table as BpsTableView);
        }
      })
      .catch(() => {
        /* keep placeholder on failure */
      });
    return () => {
      active = false;
    };
  }, []);

  return bpsTable;
}
