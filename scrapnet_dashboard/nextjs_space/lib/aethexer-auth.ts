/**
 * AETHEXER PROTOCOL AUTH GUARD — Trinity Sentinel Hardened
 *
 * Three-layer authentication:
 *   1. Timing-safe key comparison (x-aethexer-key OR x-aethexer-field-key)
 *   2. Timestamp window validation (x-aethexer-ts) — ±300s tolerance
 *   3. Nonce deduplication (x-aethexer-nonce) — prevents replay attacks
 *
 * Usage:
 *   const authResult = await validateAethexerKey(request);
 *   if (!authResult.valid) return authResult.response;
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

const PROTOCOL_VERSION = 'aethexer-v1';
const TIMESTAMP_WINDOW_SECONDS = 300; // ±5 minutes
const NONCE_TTL_HOURS = 24; // Nonces expire after 24h

export interface AethexerAuthResult {
  valid: boolean;
  response?: NextResponse;
  authMethod?: 'protocol_key' | 'field_key';
}

/**
 * Timing-safe comparison of two strings.
 * Returns false if lengths differ (but still does constant-time work).
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    const dummy = Buffer.alloc(a.length, 0);
    crypto.timingSafeEqual(dummy, Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function authError(error: string, message: string, status: number): AethexerAuthResult {
  return {
    valid: false,
    response: NextResponse.json(
      {
        protocol: PROTOCOL_VERSION,
        error,
        message,
        sentinel: process.env.SOLANA_NOTARY_PUBLIC_KEY || null,
        timestamp: Math.floor(Date.now() / 1000),
      },
      { status }
    ),
  };
}

/**
 * Validates the request using three-layer authentication:
 *   Layer 1: x-aethexer-key (protocol key) OR x-aethexer-field-key (field app key)
 *   Layer 2: x-aethexer-ts (timestamp window — optional but enforced if present)
 *   Layer 3: x-aethexer-nonce (replay protection — optional but enforced if present)
 */
export async function validateAethexerKey(request: NextRequest): Promise<AethexerAuthResult> {
  const protocolKey = process.env.AETHEXER_PROTOCOL_KEY;
  const fieldKey = process.env.AETHEXER_FIELD_KEY;

  if (!protocolKey && !fieldKey) {
    console.error('[Aethexer Auth] No protocol keys configured in .env');
    return authError('SERVICE_UNAVAILABLE', 'Protocol authentication is not configured on this node.', 503);
  }

  // ── Layer 1: Key Validation ─────────────────────────────────────────
  const providedProtocolKey = request.headers.get('x-aethexer-key');
  const providedFieldKey = request.headers.get('x-aethexer-field-key');

  let authMethod: 'protocol_key' | 'field_key' | null = null;

  if (providedProtocolKey && protocolKey && timingSafeCompare(providedProtocolKey, protocolKey)) {
    authMethod = 'protocol_key';
  } else if (providedFieldKey && fieldKey && timingSafeCompare(providedFieldKey, fieldKey)) {
    authMethod = 'field_key';
  }

  if (!authMethod) {
    if (!providedProtocolKey && !providedFieldKey) {
      return authError('UNAUTHORIZED', 'Missing authentication header. Provide x-aethexer-key or x-aethexer-field-key.', 401);
    }
    console.warn('[Aethexer Auth] Invalid key attempt from', request.headers.get('x-forwarded-for') || 'unknown');
    return authError('UNAUTHORIZED', 'Invalid authentication credentials.', 401);
  }

  // ── Layer 2: Timestamp Window ───────────────────────────────────────
  const tsHeader = request.headers.get('x-aethexer-ts');
  if (tsHeader) {
    const requestTs = parseInt(tsHeader, 10);
    if (isNaN(requestTs)) {
      return authError('INVALID_TIMESTAMP', 'x-aethexer-ts must be a Unix epoch timestamp.', 400);
    }
    const now = Math.floor(Date.now() / 1000);
    const drift = Math.abs(now - requestTs);
    if (drift > TIMESTAMP_WINDOW_SECONDS) {
      console.warn(`[Aethexer Auth] Timestamp drift ${drift}s exceeds ${TIMESTAMP_WINDOW_SECONDS}s window`);
      return authError('TIMESTAMP_EXPIRED', `Request timestamp is ${drift}s outside the ±${TIMESTAMP_WINDOW_SECONDS}s window.`, 401);
    }
  }

  // ── Layer 3: Nonce Deduplication ────────────────────────────────────
  const nonce = request.headers.get('x-aethexer-nonce');
  if (nonce) {
    if (nonce.length < 16 || nonce.length > 128) {
      return authError('INVALID_NONCE', 'x-aethexer-nonce must be 16-128 characters.', 400);
    }

    try {
      // Check if nonce already consumed
      const existing = await prisma.ingestNonce.findUnique({ where: { nonce } });
      if (existing) {
        console.warn(`[Aethexer Auth] Replay attempt — nonce "${nonce.substring(0, 8)}..." already consumed`);
        return authError('NONCE_REPLAY', 'This nonce has already been consumed. Replay attack detected.', 409);
      }

      // Consume the nonce
      const walletHeader = request.headers.get('x-aethexer-wallet');
      await prisma.ingestNonce.create({
        data: {
          nonce,
          sourceIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
          walletHint: walletHeader ? walletHeader.substring(0, 8) : null,
          expiresAt: new Date(Date.now() + NONCE_TTL_HOURS * 60 * 60 * 1000),
        },
      });

      // Background cleanup: delete expired nonces (fire-and-forget)
      prisma.ingestNonce.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      }).catch(() => { /* silent cleanup */ });
    } catch (err) {
      console.error('[Aethexer Auth] Nonce check failed:', err);
      // Don't block on nonce DB failures — log and continue
    }
  }

  return { valid: true, authMethod };
}

export { PROTOCOL_VERSION };
