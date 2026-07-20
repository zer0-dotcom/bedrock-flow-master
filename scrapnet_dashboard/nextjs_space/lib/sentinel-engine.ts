/**
 * SENTINEL ENGINE — Forensic Confidence Scoring
 *
 * Implements the 95/75/75 threshold logic for the Aethexer Protocol:
 *   - Document Integrity Score:  ≥95% required (SHA-256 hash + magic byte validation)
 *   - LLM Parser Confidence:     ≥75% required (AI extraction quality)
 *   - Spatial Correlation Score:  ≥75% required (geolocation + metadata coherence)
 *
 * All three thresholds must be met for a submission to pass Sentinel review.
 * Submissions below threshold are flagged for human-in-the-loop review.
 *
 * Used by: /api/v1/forensic-ingest (post-upload validation)
 */

import crypto from 'crypto';

// ─── Threshold Constants ────────────────────────────────────────────────────

export const SENTINEL_THRESHOLDS = {
  DOCUMENT_INTEGRITY: 0.95,  // 95% — SHA-256 + magic byte + file structure
  LLM_CONFIDENCE: 0.75,      // 75% — Parser extraction confidence
  SPATIAL_CORRELATION: 0.75, // 75% — Geolocation + metadata coherence
} as const;

export const SENTINEL_VERSION = '1.0.0';
export const SENTINEL_NODE = 'Sentinel Node-01';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface DocumentIntegrityInput {
  fileName: string;
  fileHash: string;          // SHA-256 hex
  fileSizeBytes: number;
  fileType: string;          // MIME type
  magicBytesValid: boolean;  // From magic byte check
  headerStructureValid?: boolean; // Optional: PDF header, PLY header check
}

export interface LLMConfidenceInput {
  parserConfidence: number;  // 0-1 from LLM parser
  fieldsExtracted: number;   // Number of fields successfully extracted
  fieldsExpected: number;    // Number of fields expected for this track
  hasAnomalies: boolean;     // Parser flagged inconsistencies
}

export interface SpatialCorrelationInput {
  hasGeolocation: boolean;
  geoLatitude?: number;
  geoLongitude?: number;
  hasTimestamp: boolean;
  timestampConsistent?: boolean;  // Within expected range
  metadataFieldsPresent: number;
  metadataFieldsExpected: number;
  spatialScanPresent: boolean;
  groundPhotosPresent: boolean;
}

export interface SentinelScore {
  documentIntegrity: number;     // 0-1
  llmConfidence: number;         // 0-1
  spatialCorrelation: number;    // 0-1
  compositeScore: number;        // Weighted average
  passesThreshold: boolean;      // All three ≥ thresholds
  failedChecks: string[];        // Which checks failed
  sentinelVerdict: 'AUTO_APPROVED' | 'PENDING_SOVEREIGN_REVIEW' | 'SOVEREIGN_HOLD' | 'PENDING_AUTHORIZATION' | 'ESCROW_REVIEW' | 'PENDING_PLATFORM_REVIEW' | 'REJECTED';
  sentinelNode: string;
  sentinelVersion: string;
  scoredAt: number;              // Unix timestamp
  scoreHash: string;             // SHA-256 of score data for audit
}

// ─── Magic Byte Validation ──────────────────────────────────────────────────

/**
 * Known file magic bytes for accepted document types.
 * Used to validate that file contents match declared MIME type.
 */
export const MAGIC_BYTES: Record<string, { bytes: number[]; offset: number; description: string }> = {
  'application/pdf': {
    bytes: [0x25, 0x50, 0x44, 0x46],  // %PDF
    offset: 0,
    description: 'PDF document',
  },
  'image/jpeg': {
    bytes: [0xFF, 0xD8, 0xFF],
    offset: 0,
    description: 'JPEG image',
  },
  'image/png': {
    bytes: [0x89, 0x50, 0x4E, 0x47],  // .PNG
    offset: 0,
    description: 'PNG image',
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    bytes: [0x50, 0x4B, 0x03, 0x04],  // PK (ZIP container)
    offset: 0,
    description: 'XLSX spreadsheet',
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    bytes: [0x50, 0x4B, 0x03, 0x04],  // PK (ZIP container)
    offset: 0,
    description: 'DOCX document',
  },
  'text/csv': {
    bytes: [],  // CSV has no magic bytes — validated by content structure
    offset: 0,
    description: 'CSV file',
  },
};

/**
 * Validate file magic bytes against declared MIME type.
 * Returns true if bytes match or file type has no defined magic bytes.
 */
export function validateMagicBytes(buffer: Buffer, declaredType: string): boolean {
  const spec = MAGIC_BYTES[declaredType];
  if (!spec || spec.bytes.length === 0) return true; // No magic bytes defined → pass

  if (buffer.length < spec.offset + spec.bytes.length) return false;

  for (let i = 0; i < spec.bytes.length; i++) {
    if (buffer[spec.offset + i] !== spec.bytes[i]) return false;
  }
  return true;
}

/**
 * Validate PLY/Splat spatial scan files.
 * PLY files start with "ply\n" ASCII header.
 */
export function validateSpatialMagicBytes(buffer: Buffer, fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'ply') {
    // PLY ASCII header: "ply\n" or "ply\r\n"
    const header = buffer.subarray(0, 4).toString('ascii');
    return header.startsWith('ply');
  }
  if (ext === 'splat') {
    // Gaussian splat files — binary format, check minimum size
    return buffer.length >= 32;
  }
  return true;
}

// ─── Scoring Functions ──────────────────────────────────────────────────────

/**
 * Score document integrity (target: ≥95%)
 */
export function scoreDocumentIntegrity(inputs: DocumentIntegrityInput[]): number {
  if (inputs.length === 0) return 0;

  let totalScore = 0;

  for (const doc of inputs) {
    let score = 0;

    // Hash present and valid format (32 bytes hex = 64 chars)
    if (doc.fileHash && doc.fileHash.length === 64) score += 0.35;

    // File size > 0 and reasonable
    if (doc.fileSizeBytes > 0 && doc.fileSizeBytes < 100 * 1024 * 1024) score += 0.15;

    // Magic bytes validated
    if (doc.magicBytesValid) score += 0.35;

    // Header structure valid (bonus)
    if (doc.headerStructureValid !== false) score += 0.15;

    totalScore += Math.min(score, 1.0);
  }

  return totalScore / inputs.length;
}

/**
 * Score LLM parser confidence (target: ≥75%)
 */
export function scoreLLMConfidence(input: LLMConfidenceInput): number {
  let score = 0;

  // Base confidence from parser (weighted 60%)
  score += input.parserConfidence * 0.60;

  // Field extraction completeness (weighted 25%)
  const extractionRate = input.fieldsExpected > 0
    ? input.fieldsExtracted / input.fieldsExpected
    : 0;
  score += extractionRate * 0.25;

  // Anomaly penalty (weighted 15%)
  score += (input.hasAnomalies ? 0 : 0.15);

  return Math.min(score, 1.0);
}

/**
 * Score spatial/metadata correlation (target: ≥75%)
 */
export function scoreSpatialCorrelation(input: SpatialCorrelationInput): number {
  let score = 0;
  let maxScore = 0;

  // Geolocation present (25%)
  maxScore += 0.25;
  if (input.hasGeolocation && input.geoLatitude !== undefined && input.geoLongitude !== undefined) {
    // Validate coordinates are in reasonable range
    if (Math.abs(input.geoLatitude) <= 90 && Math.abs(input.geoLongitude) <= 180) {
      score += 0.25;
    }
  }

  // Timestamp present and consistent (20%)
  maxScore += 0.20;
  if (input.hasTimestamp) {
    score += input.timestampConsistent !== false ? 0.20 : 0.10;
  }

  // Metadata completeness (25%)
  maxScore += 0.25;
  const metaRate = input.metadataFieldsExpected > 0
    ? input.metadataFieldsPresent / input.metadataFieldsExpected
    : 0;
  score += metaRate * 0.25;

  // Spatial scan bonus (15%)
  maxScore += 0.15;
  if (input.spatialScanPresent) score += 0.15;

  // Ground photos bonus (15%)
  maxScore += 0.15;
  if (input.groundPhotosPresent) score += 0.15;

  return maxScore > 0 ? Math.min(score / maxScore, 1.0) * maxScore / 1.0 : 0;
}

// ─── Composite Sentinel Scoring ─────────────────────────────────────────────

/**
 * Run the full Sentinel scoring pipeline.
 * Returns composite score and verdict.
 */
export function runSentinelScoring(
  documentInputs: DocumentIntegrityInput[],
  llmInput: LLMConfidenceInput,
  spatialInput: SpatialCorrelationInput
): SentinelScore {
  const docScore = scoreDocumentIntegrity(documentInputs);
  const llmScore = scoreLLMConfidence(llmInput);
  const spatialScore = scoreSpatialCorrelation(spatialInput);

  // Weighted composite: 40% doc integrity, 35% LLM, 25% spatial
  const compositeScore = (docScore * 0.40) + (llmScore * 0.35) + (spatialScore * 0.25);

  const failedChecks: string[] = [];
  if (docScore < SENTINEL_THRESHOLDS.DOCUMENT_INTEGRITY) {
    failedChecks.push(`DOCUMENT_INTEGRITY: ${(docScore * 100).toFixed(1)}% < ${SENTINEL_THRESHOLDS.DOCUMENT_INTEGRITY * 100}%`);
  }
  if (llmScore < SENTINEL_THRESHOLDS.LLM_CONFIDENCE) {
    failedChecks.push(`LLM_CONFIDENCE: ${(llmScore * 100).toFixed(1)}% < ${SENTINEL_THRESHOLDS.LLM_CONFIDENCE * 100}%`);
  }
  if (spatialScore < SENTINEL_THRESHOLDS.SPATIAL_CORRELATION) {
    failedChecks.push(`SPATIAL_CORRELATION: ${(spatialScore * 100).toFixed(1)}% < ${SENTINEL_THRESHOLDS.SPATIAL_CORRELATION * 100}%`);
  }

  const passesThreshold = failedChecks.length === 0;

  // Verdict logic
  type SentinelVerdictType = 'AUTO_APPROVED' | 'PENDING_SOVEREIGN_REVIEW' | 'SOVEREIGN_HOLD' | 'PENDING_AUTHORIZATION' | 'ESCROW_REVIEW' | 'PENDING_PLATFORM_REVIEW' | 'REJECTED';
  let sentinelVerdict: SentinelVerdictType;
  if (passesThreshold) {
    sentinelVerdict = 'AUTO_APPROVED';
  } else if (failedChecks.length <= 1 && compositeScore >= 0.75) {
    // Score 75-94% band — routed to sovereign review queue
    sentinelVerdict = 'PENDING_SOVEREIGN_REVIEW';
  } else if (failedChecks.length <= 1 && compositeScore >= 0.65) {
    // Score 65-74% band — general authorization required
    sentinelVerdict = 'PENDING_AUTHORIZATION';
  } else {
    sentinelVerdict = 'REJECTED';
  }

  const scoredAt = Math.floor(Date.now() / 1000);

  // Audit hash of the scoring data
  const scoreHash = crypto.createHash('sha256').update(
    JSON.stringify({ docScore, llmScore, spatialScore, compositeScore, scoredAt })
  ).digest('hex');

  return {
    documentIntegrity: Math.round(docScore * 1000) / 1000,
    llmConfidence: Math.round(llmScore * 1000) / 1000,
    spatialCorrelation: Math.round(spatialScore * 1000) / 1000,
    compositeScore: Math.round(compositeScore * 1000) / 1000,
    passesThreshold,
    failedChecks,
    sentinelVerdict,
    sentinelNode: SENTINEL_NODE,
    sentinelVersion: SENTINEL_VERSION,
    scoredAt,
    scoreHash,
  };
}
