export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import {
  getEnrichedScanTargets,
  AETHEXER_CATALOG,
} from '@/lib/energy-ghost-targets';

/**
 * GET /api/v1/discovery/scan-targets
 *
 * Returns the full list of Aethexer Energy Ghost scan PROSPECTS with product
 * recommendations computed SERVER-SIDE.
 *
 * FRAMING (NON-NEGOTIABLE): Every target is a third-party landmark shown STRICTLY
 * as an Aethexer thermal-scan prospect. MEDIFLO LLC asserts NO ownership, equity,
 * or valuation. There are NO dollar valuations and NO "Sovereign Share" figures.
 * thermalWasteKw / carbonGhostMargin are prospecting scan projections, not
 * verified measured telemetry.
 */
export async function GET() {
  const targets = getEnrichedScanTargets();

  return NextResponse.json({
    status: 'OK',
    disclaimer:
      'Aethexer scan PROSPECTS only. MEDIFLO LLC claims no ownership, equity, or valuation in any listed third-party facility. Figures are prospecting scan projections, not verified telemetry.',
    catalog: AETHEXER_CATALOG,
    count: targets.length,
    targets,
  });
}
