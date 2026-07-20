/**
 * BEDROCK ESG — Audit Log Pipeline (v2.4)
 *
 * Captures every:
 *   • Submission status change
 *   • Settlement execution (70/20/10 split)
 *   • Blockchain anchor event
 *   • Role change
 *   • Sovereign verdict override
 *
 * Each log entry includes a SHA-256 audit hash for tamper detection.
 */

import crypto from 'crypto';
import { prisma } from '@/lib/db';

export type AuditEventType =
  | 'SUBMISSION_STATUS_CHANGE'
  | 'SETTLEMENT_EXECUTED'
  | 'BLOCKCHAIN_ANCHOR'
  | 'ROLE_CHANGE'
  | 'VERDICT_OVERRIDE'
  | 'FOUNDER_APPROVAL'
  | 'TELEMETRY_INGEST'
  | 'DISCOVERY_FLAGGED';

export interface AuditLogInput {
  actorId: string;
  actorRole: string;
  eventType: AuditEventType;
  entityType: string;       // e.g. 'Submission', 'Settlement', 'User', 'TelemetryReading'
  entityId: string;
  previousValue?: string;   // JSON stringified
  newValue?: string;        // JSON stringified
  metadata?: Record<string, unknown>;
  backtraceId?: string;
}

/**
 * Compute a deterministic audit hash for tamper detection.
 */
function computeAuditHash(input: AuditLogInput, timestamp: string): string {
  const payload = JSON.stringify({
    actorId: input.actorId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    previousValue: input.previousValue || '',
    newValue: input.newValue || '',
    timestamp,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Write an audit log entry to the database.
 * Fire-and-forget pattern — errors are logged but don’t break the caller.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<string | null> {
  try {
    const now = new Date().toISOString();
    const auditHash = computeAuditHash(input, now);

    // Map actorRole to valid Prisma UserRole enum
    const validRoles = [
      'ADMIN', 'AGENT', 'FARMER', 'REALTOR', 'BUSINESS_OWNER',
      'SOVEREIGN_INDIVIDUAL', 'FOUNDER', 'SOVEREIGN_AGENT', 'CLIENT_OWNER',
    ];
    const safeRole = validRoles.includes(input.actorRole) ? input.actorRole : 'CLIENT_OWNER';

    const entry = await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        actorRole: safeRole as never,
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        previousValue: input.previousValue || null,
        newValue: input.newValue || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        auditHash,
        backtraceId: input.backtraceId || 'BT-C9C4C5',
      },
    });

    return entry.id;
  } catch (error) {
    console.error('[AuditLog] Failed to write audit entry:', error);
    return null;
  }
}

/**
 * Convenience: log a submission status change.
 */
export async function logSubmissionStatusChange(
  actorId: string,
  actorRole: string,
  submissionId: string,
  previousStatus: string,
  newStatus: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog({
    actorId,
    actorRole,
    eventType: 'SUBMISSION_STATUS_CHANGE',
    entityType: 'Submission',
    entityId: submissionId,
    previousValue: JSON.stringify({ status: previousStatus }),
    newValue: JSON.stringify({ status: newStatus }),
    metadata,
  });
}

/**
 * Convenience: log a settlement execution.
 */
export async function logSettlementExecution(
  actorId: string,
  actorRole: string,
  settlementId: string,
  splitData: { totalValueUsd: number; assetOwner: number; treasury: number; publicResilience: number },
  metadata?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog({
    actorId,
    actorRole,
    eventType: 'SETTLEMENT_EXECUTED',
    entityType: 'Settlement',
    entityId: settlementId,
    newValue: JSON.stringify(splitData),
    metadata,
  });
}

/**
 * Convenience: log a blockchain anchor event.
 */
export async function logBlockchainAnchor(
  actorId: string,
  actorRole: string,
  entityType: string,
  entityId: string,
  txHash: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog({
    actorId,
    actorRole,
    eventType: 'BLOCKCHAIN_ANCHOR',
    entityType,
    entityId,
    newValue: JSON.stringify({ txHash }),
    metadata,
  });
}

/**
 * Convenience: log a role change.
 */
export async function logRoleChange(
  actorId: string,
  actorRole: string,
  targetUserId: string,
  previousRole: string,
  newRole: string
): Promise<void> {
  await writeAuditLog({
    actorId,
    actorRole,
    eventType: 'ROLE_CHANGE',
    entityType: 'User',
    entityId: targetUserId,
    previousValue: JSON.stringify({ role: previousRole }),
    newValue: JSON.stringify({ role: newRole }),
  });
}

/**
 * Convenience: log a sovereign verdict override.
 */
export async function logVerdictOverride(
  actorId: string,
  actorRole: string,
  entityType: string,
  entityId: string,
  previousVerdict: string,
  newVerdict: string,
  note?: string
): Promise<void> {
  await writeAuditLog({
    actorId,
    actorRole,
    eventType: 'VERDICT_OVERRIDE',
    entityType,
    entityId,
    previousValue: JSON.stringify({ verdict: previousVerdict }),
    newValue: JSON.stringify({ verdict: newVerdict }),
    metadata: note ? { note } : undefined,
  });
}
