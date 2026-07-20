import { NextRequest, NextResponse } from 'next/server';
import {
  computeHumTelemetry,
  getHumState,
  getLiveLoadMw,
  HUM_ENGINE,
  HUM_BASELINE_MW,
  SHIFT_THRESHOLD_PERCENT,
  EXCHANGE_WINDOWS,
} from '@/services/hum-listener';

export const dynamic = 'force-dynamic';

/**
 * DYNAMIC HUM TELEMETRY API
 *
 * GET  → Current HUM state, live MW reading, exchange status
 * POST → Trigger a telemetry reading (computes from ledger + triggers anchor if threshold shift detected)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'state';

    if (action === 'state') {
      const state = getHumState();
      const nowUtc = new Date();
      const utcHour = nowUtc.getUTCHours() + nowUtc.getUTCMinutes() / 60;

      const exchangeStatus = Object.entries(EXCHANGE_WINDOWS).map(([key, win]) => ({
        exchange: win.label,
        isOpen: utcHour >= win.openUtc && utcHour < win.closeUtc,
        openUtc: `${Math.floor(win.openUtc)}:${String(Math.round((win.openUtc % 1) * 60)).padStart(2, '0')}`,
        closeUtc: `${Math.floor(win.closeUtc)}:${String(Math.round((win.closeUtc % 1) * 60)).padStart(2, '0')}`,
      }));

      return NextResponse.json({
        engine: HUM_ENGINE,
        status: 'ONLINE',
        currentState: {
          liveMw: getLiveLoadMw(),
          baselineMw: HUM_BASELINE_MW,
          shiftThreshold: SHIFT_THRESHOLD_PERCENT,
          ...state,
        },
        exchanges: exchangeStatus,
        utcTime: nowUtc.toISOString(),
      });
    }

    if (action === 'live-mw') {
      return NextResponse.json({
        currentMw: getLiveLoadMw(),
        baselineMw: HUM_BASELINE_MW,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[HUM API] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'read') {
      const reading = await computeHumTelemetry();

      return NextResponse.json({
        success: true,
        reading,
        summary: {
          currentMw: reading.currentMw,
          shiftPercent: reading.shiftPercent,
          shiftTriggered: reading.shiftTriggered,
          anchorResult: reading.anchorResult || null,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use: read' }, { status: 400 });
  } catch (error: any) {
    console.error('[HUM API] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
