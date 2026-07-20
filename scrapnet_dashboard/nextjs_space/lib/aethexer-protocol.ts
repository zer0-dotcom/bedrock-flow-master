/**
 * AETHEXER PROTOCOL ENVELOPE
 *
 * Standard response wrapper for all /api/v1/* endpoints.
 * Every response self-identifies with protocol version, backtrace, sentinel, and timestamp.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PROTOCOL_VERSION = 'aethexer-v1';
const SENTINEL_KEY = process.env.SOLANA_NOTARY_PUBLIC_KEY || '9tsq8qB4P9uPRSHrjXLaDQJd93nuo4wEEtkR1tAJRAQ3';

export interface ProtocolEnvelope {
  protocol: string;
  backtrace: string;
  timestamp: number;
  sentinel: string;
  data: Record<string, unknown>;
  error?: string;
}

/**
 * Generate a backtrace ID for this request.
 */
export function generateBacktrace(): string {
  const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `BT-${hash.slice(0, 4)}${hash.slice(4, 8)}`;
}

/**
 * Wrap a successful response in the protocol envelope.
 */
export function protocolSuccess(
  data: Record<string, unknown>,
  backtrace?: string,
  status = 200
): NextResponse {
  const envelope: ProtocolEnvelope = {
    protocol: PROTOCOL_VERSION,
    backtrace: backtrace || generateBacktrace(),
    timestamp: Math.floor(Date.now() / 1000),
    sentinel: SENTINEL_KEY,
    data,
  };
  return NextResponse.json(envelope, { status });
}

/**
 * Wrap an error response in the protocol envelope.
 */
export function protocolError(
  error: string,
  message: string,
  status = 400,
  backtrace?: string,
  data?: Record<string, unknown>
): NextResponse {
  const envelope: ProtocolEnvelope = {
    protocol: PROTOCOL_VERSION,
    backtrace: backtrace || generateBacktrace(),
    timestamp: Math.floor(Date.now() / 1000),
    sentinel: SENTINEL_KEY,
    data: {
      ...data,
      error,
      message,
    },
    error,
  };
  return NextResponse.json(envelope, { status });
}

export { PROTOCOL_VERSION, SENTINEL_KEY };
