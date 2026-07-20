import { NextRequest, NextResponse } from 'next/server';
import {
  anchorToChain,
  hashForAnchor,
  getNotaryStatus,
  getNotaryBalance,
  NOTARY_ENGINE,
  NotaryAnchorPayload,
} from '@/lib/solana-notary';

export const dynamic = 'force-dynamic';

/**
 * SOVEREIGN NOTARY API
 *
 * GET  → Status, balance, and configuration check
 * POST → Anchor forensic data to Solana Devnet via Memo program
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      const status = getNotaryStatus();
      const balance = await getNotaryBalance();

      return NextResponse.json({
        engine: NOTARY_ENGINE,
        status: status.configured ? 'ONLINE' : 'AWAITING_SECRET_KEY',
        configuration: {
          ...status,
          // Never expose secret key
          secretKeyConfigured: status.configured,
        },
        balance: {
          ...balance,
          solFormatted: `${balance.sol.toFixed(6)} SOL`,
        },
        instructions: !status.configured
          ? 'Set SOLANA_NOTARY_SECRET_KEY in .env with the base58-encoded secret key for wallet ' +
            status.expectedKey
          : undefined,
      });
    }

    if (action === 'balance') {
      const balance = await getNotaryBalance();
      return NextResponse.json({ balance });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Notary API] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'anchor') {
      const { type, entityId, data, carbonTonnes, valuationUsd, metadata } = body;

      if (!type || !entityId) {
        return NextResponse.json(
          { error: 'Missing required fields: type, entityId' },
          { status: 400 }
        );
      }

      const validTypes: NotaryAnchorPayload['type'][] = [
        'CARBON_AUDIT',
        'TRADE_SETTLEMENT',
        'HUM_FREQUENCY_SHIFT',
        'SPATIAL_ATTESTATION',
        'BIOCHAR_CDR',
        'METAL_RECOVERY',
      ];

      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }

      const dataHash = hashForAnchor(data || { entityId, timestamp: Date.now() });

      const result = await anchorToChain({
        type,
        entityId,
        dataHash,
        carbonTonnes,
        valuationUsd,
        metadata,
      });

      return NextResponse.json({
        success: result.success,
        anchor: {
          transactionSignature: result.transactionSignature,
          explorerUrl: result.explorerUrl,
          slot: result.slot,
          blockTime: result.blockTime,
          memoContent: result.memoContent,
          signerPublicKey: result.signerPublicKey,
        },
        error: result.error,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Notary API] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
