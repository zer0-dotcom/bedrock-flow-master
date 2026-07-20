import { createHash } from 'crypto';

/**
 * Generate a unique consent hash based on user data and timestamp
 * This hash can be attached to token metadata for audit trail
 */
export function generateConsentHash(
  userId: string,
  email: string | null,
  carbonRightsTransfer: boolean,
  aiMonitoring: boolean,
  timestamp: Date
): string {
  const data = JSON.stringify({
    userId,
    email,
    carbonRightsTransfer,
    aiMonitoring,
    timestamp: timestamp.toISOString(),
    nonce: Math.random().toString(36).substring(2),
  });
  
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a log hash for individual consent actions
 */
export function generateLogHash(
  userId: string,
  action: string,
  consentType: string,
  previousValue: boolean,
  newValue: boolean,
  timestamp: Date
): string {
  const data = JSON.stringify({
    userId,
    action,
    consentType,
    previousValue,
    newValue,
    timestamp: timestamp.toISOString(),
  });
  
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Consent check result interface
 */
export interface ConsentCheckResult {
  hasConsent: boolean;
  termsAccepted: boolean;
  carbonRightsTransfer: boolean;
  aiMonitoring: boolean;
  consentHash: string | null;
  message: string;
}

/**
 * Token metadata with consent hash
 */
export interface ConsentMetadata {
  consent_hash: string;
  carbon_rights_transfer: boolean;
  ai_monitoring: boolean;
  terms_version: string;
  consent_timestamp: string;
}

/**
 * Generate consent metadata for token minting
 */
export function generateConsentMetadata(
  consentHash: string,
  carbonRightsTransfer: boolean,
  aiMonitoring: boolean,
  termsVersion: string,
  consentTimestamp: Date
): ConsentMetadata {
  return {
    consent_hash: consentHash,
    carbon_rights_transfer: carbonRightsTransfer,
    ai_monitoring: aiMonitoring,
    terms_version: termsVersion,
    consent_timestamp: consentTimestamp.toISOString(),
  };
}
