export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { validateAethexerKey } from '@/lib/aethexer-auth';
import { protocolSuccess, protocolError, generateBacktrace } from '@/lib/aethexer-protocol';
import {
  validateMagicBytes,
  validateSpatialMagicBytes,
  runSentinelScoring,
  type DocumentIntegrityInput,
  type LLMConfidenceInput,
  type SpatialCorrelationInput,
  type SentinelScore,
} from '@/lib/sentinel-engine';
import { calculateDistance, type LogisticsCoordinates } from '@/lib/logistics-auditor';
import crypto from 'crypto';

/**
 * AETHEXER PROTOCOL v1 — UNIFIED FORENSIC INGEST
 *
 * POST /api/v1/forensic-ingest
 *
 * Accepts a multipart payload from the EXITZ field app:
 *   - spatialScan      (optional)  .ply/.splat file
 *   - documents[]      (required)  PDF, CSV, XLSX, DOCX
 *   - groundPhotos[]   (optional)  JPG/PNG site verification
 *   - track            (required)  TRACK_A_MATERIALS | TRACK_B_ENERGY_179D | TRACK_C_BIOCHAR_CDR
 *   - walletAddress    (required)  Asset owner wallet
 *   - companyName      (optional)
 *   - assetMetadata    (optional)  JSON string with VIN, coordinates, etc.
 *
 * Auth: x-aethexer-key header (timing-safe validated) + timestamp window + nonce dedup
 *
 * Flow:
 *   1. Authenticate via Trinity Sentinel (3-layer)
 *   2. Parse multipart, validate magic bytes per file buffer
 *   3. Upload all files to cloud storage via presigned URLs
 *   4. Run Sentinel Engine scoring (95/75/75)
 *   5. Create Submission record with DRAFT status
 *   6. Return submission ID + upload URLs + Sentinel score
 */

const VALID_TRACKS = ['TRACK_A_MATERIALS', 'TRACK_B_ENERGY_179D', 'TRACK_C_BIOCHAR_CDR'] as const;
type TrackType = typeof VALID_TRACKS[number];

/** Maximum allowed distance (km) between client GPS and facility zone center */
const MAX_FACILITY_RADIUS_KM = 50;

/**
 * KNOWN FACILITY ZONE REGISTRY
 *
 * Maps facilityId prefixes to registered physical coordinates.
 * Used by the Haversine verifier to enforce the 50km capture-zone boundary.
 * Mirrors the telemetry-ingest KNOWN_GEOGRAPHIC_ZONES structure.
 */
const FACILITY_ZONE_REGISTRY: Record<string, {
  label: string;
  centerLat: number;
  centerLon: number;
  radiusKm: number;
}> = {
  'DC-SOVEREIGN': {
    label: 'Sovereign Primary — Las Vegas NV',
    centerLat: 36.1699,
    centerLon: -115.1398,
    radiusKm: 50,
  },
  'DC-PROPERTY': {
    label: 'Property Industrial — Houston TX',
    centerLat: 29.7604,
    centerLon: -95.3698,
    radiusKm: 75,
  },
  'DC-PALLETS': {
    label: 'Logistics Hub — Ontario CA',
    centerLat: 34.0633,
    centerLon: -117.6509,
    radiusKm: 40,
  },
  'DC-METALS': {
    label: 'Metals Recovery — Pittsburgh PA',
    centerLat: 40.4406,
    centerLon: -79.9959,
    radiusKm: 60,
  },
};

/**
 * Resolve a facilityId to its registered zone.
 * Matches on longest prefix (e.g. DC-SOVEREIGN-F1 → DC-SOVEREIGN).
 */
function resolveFacilityZone(facilityId: string): (typeof FACILITY_ZONE_REGISTRY)[string] | null {
  const sortedKeys = Object.keys(FACILITY_ZONE_REGISTRY).sort((a, b) => b.length - a.length);
  for (const prefix of sortedKeys) {
    if (facilityId.toUpperCase().startsWith(prefix)) {
      return FACILITY_ZONE_REGISTRY[prefix];
    }
  }
  return null;
}

/** Sensor snapshot structure accepted from SPEXTER array */
interface SensorSnapshot {
  sensorId: string;
  type: string;
  value: number;
  unit: string;
  capturedAt?: string;
  [key: string]: unknown;
}

const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_SPATIAL_TYPES = ['application/octet-stream', 'model/ply'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface FileUploadResult {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  cloudStoragePath: string;
  fileHash: string;
  uploadUrl: string;
  category: 'spatial' | 'document' | 'ground_photo';
  magicBytesValid: boolean;
}

async function processFile(
  file: File,
  category: 'spatial' | 'document' | 'ground_photo'
): Promise<FileUploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
  const fileType = file.type || 'application/octet-stream';

  // ── Magic byte validation ──────────────────────────────────────────
  let magicBytesValid: boolean;
  if (category === 'spatial') {
    magicBytesValid = validateSpatialMagicBytes(buffer, file.name);
  } else {
    magicBytesValid = validateMagicBytes(buffer, fileType);
  }

  const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
    file.name,
    fileType,
    false
  );

  return {
    fileName: file.name,
    fileType,
    fileSizeBytes: buffer.length,
    cloudStoragePath: cloud_storage_path,
    fileHash,
    uploadUrl,
    category,
    magicBytesValid,
  };
}

export async function POST(request: NextRequest) {
  const backtrace = generateBacktrace();

  // ── Step 1: Auth Gate (Trinity Sentinel — 3-layer) ──────────────────
  const auth = await validateAethexerKey(request);
  if (!auth.valid) return auth.response!;

  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return protocolError(
        'INVALID_CONTENT_TYPE',
        'Expected multipart/form-data. Send files as form-data fields.',
        400,
        backtrace
      );
    }

    const formData = await request.formData();

    // ── Step 2: Extract & Validate Fields ─────────────────────────────
    const track = formData.get('track') as string;
    const walletAddress = formData.get('walletAddress') as string;
    const companyName = formData.get('companyName') as string | null;
    const assetMetadataRaw = formData.get('assetMetadata') as string | null;

    if (!track || !VALID_TRACKS.includes(track as TrackType)) {
      return protocolError(
        'INVALID_TRACK',
        `track is required. Must be one of: ${VALID_TRACKS.join(', ')}`,
        400,
        backtrace
      );
    }

    if (!walletAddress) {
      return protocolError(
        'MISSING_WALLET',
        'walletAddress is required.',
        400,
        backtrace
      );
    }

    // ── SPEXTER Extension Fields ─────────────────────────────────────
    const operatorId = formData.get('operatorId') as string | null;
    const facilityId = formData.get('facilityId') as string | null;
    const clientTimestampRaw = formData.get('clientTimestamp') as string | null;
    const sensorSnapshotsRaw = formData.get('sensorSnapshots') as string | null;

    // Parse optional asset metadata
    let assetMetadata: Record<string, unknown> | null = null;
    if (assetMetadataRaw) {
      try {
        assetMetadata = JSON.parse(assetMetadataRaw);
      } catch {
        return protocolError(
          'INVALID_METADATA',
          'assetMetadata must be valid JSON.',
          400,
          backtrace
        );
      }
    }

    // Parse sensorSnapshots JSON array if provided
    let sensorSnapshots: SensorSnapshot[] | null = null;
    if (sensorSnapshotsRaw) {
      try {
        const parsed = JSON.parse(sensorSnapshotsRaw);
        if (!Array.isArray(parsed)) {
          return protocolError('INVALID_SENSOR_DATA', 'sensorSnapshots must be a JSON array.', 400, backtrace);
        }
        sensorSnapshots = parsed as SensorSnapshot[];
      } catch {
        return protocolError('INVALID_SENSOR_DATA', 'sensorSnapshots must be valid JSON.', 400, backtrace);
      }
    }

    // Parse and validate clientTimestamp for temporal spoofing detection
    let clientTimestamp: Date | null = null;
    let timestampDriftMs = 0;
    let timestampConsistent = true;
    if (clientTimestampRaw) {
      const parsed = typeof clientTimestampRaw === 'string' && /^\d+$/.test(clientTimestampRaw)
        ? new Date(parseInt(clientTimestampRaw, 10))
        : new Date(clientTimestampRaw);
      if (isNaN(parsed.getTime())) {
        return protocolError('INVALID_TIMESTAMP', 'clientTimestamp must be a valid ISO-8601 string or Unix epoch ms.', 400, backtrace);
      }
      clientTimestamp = parsed;
      const serverNow = Date.now();
      timestampDriftMs = Math.abs(serverNow - clientTimestamp.getTime());
      // Flag as inconsistent if drift exceeds 15 minutes (potential spoofing)
      const MAX_DRIFT_MS = 15 * 60 * 1000;
      timestampConsistent = timestampDriftMs <= MAX_DRIFT_MS;
      if (!timestampConsistent) {
        console.warn(`[Aethexer Sentinel] Temporal drift detected: ${Math.round(timestampDriftMs / 1000)}s — possible spoofing on ${backtrace}`);
      }
    }

    // ── Elevate coordinates as top-level required spatial params ────────
    const geoLatDirect = assetMetadata?.latitude as number | undefined;
    const geoLngDirect = assetMetadata?.longitude as number | undefined;

    // ── Step 3: Process Files + Magic Byte Validation ──────────────────
    const fileResults: FileUploadResult[] = [];
    const magicByteFailures: string[] = [];
    let hasDocument = false;
    let hasSpatialScan = false;

    // Spatial scan (single file)
    const spatialScan = formData.get('spatialScan') as File | null;
    if (spatialScan && spatialScan.size > 0) {
      if (spatialScan.size > MAX_FILE_SIZE) {
        return protocolError('FILE_TOO_LARGE', `spatialScan exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`, 400, backtrace);
      }
      const result = await processFile(spatialScan, 'spatial');
      if (!result.magicBytesValid) {
        magicByteFailures.push(`spatialScan: "${result.fileName}" — magic bytes mismatch`);
      }
      fileResults.push(result);
      hasSpatialScan = true;
    }

    // Documents (multiple)
    const documents = formData.getAll('documents[]') as File[];
    const singleDoc = formData.get('documents') as File | null;
    const allDocs = singleDoc ? [...documents, singleDoc] : documents;

    for (const doc of allDocs) {
      if (doc && doc.size > 0) {
        if (doc.size > MAX_FILE_SIZE) {
          return protocolError('FILE_TOO_LARGE', `Document "${doc.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`, 400, backtrace);
        }
        const result = await processFile(doc, 'document');
        if (!result.magicBytesValid) {
          magicByteFailures.push(`document: "${result.fileName}" — magic bytes mismatch for declared type ${result.fileType}`);
        }
        fileResults.push(result);
        hasDocument = true;
      }
    }

    // Ground photos (multiple)
    const photos = formData.getAll('groundPhotos[]') as File[];
    const singlePhoto = formData.get('groundPhotos') as File | null;
    const allPhotos = singlePhoto ? [...photos, singlePhoto] : photos;
    let hasGroundPhotos = false;

    for (const photo of allPhotos) {
      if (photo && photo.size > 0) {
        if (photo.size > MAX_FILE_SIZE) {
          return protocolError('FILE_TOO_LARGE', `Photo "${photo.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`, 400, backtrace);
        }
        const result = await processFile(photo, 'ground_photo');
        if (!result.magicBytesValid) {
          magicByteFailures.push(`ground_photo: "${result.fileName}" — magic bytes mismatch for declared type ${result.fileType}`);
        }
        fileResults.push(result);
        hasGroundPhotos = true;
      }
    }

    if (!hasDocument && !spatialScan) {
      return protocolError(
        'NO_FILES',
        'At least one document or spatial scan is required.',
        400,
        backtrace
      );
    }

    // Hard reject if ANY magic byte validation failed
    if (magicByteFailures.length > 0) {
      console.warn(`[Aethexer Sentinel] Magic byte failures on ${backtrace}:`, magicByteFailures);
      return protocolError(
        'MAGIC_BYTE_MISMATCH',
        `File integrity check failed. ${magicByteFailures.length} file(s) have contents that do not match their declared type: ${magicByteFailures.join('; ')}`,
        422,
        backtrace
      );
    }

    // ── Step 3.5: HAVERSINE BOUNDARY ENFORCEMENT ─────────────────────────
    //
    // If facilityId and coordinates are both provided, verify the client
    // GPS falls within the facility's registered capture zone (strict 50km default).
    //
    let haversineDistanceKm: number | null = null;
    let facilityZoneLabel: string | null = null;
    let facilityZoneRadiusKm: number = MAX_FACILITY_RADIUS_KM;

    if (facilityId && geoLatDirect !== undefined && geoLngDirect !== undefined) {
      const zone = resolveFacilityZone(facilityId);
      if (zone) {
        facilityZoneLabel = zone.label;
        facilityZoneRadiusKm = zone.radiusKm;

        const clientCoords: LogisticsCoordinates = { lat: geoLatDirect, lng: geoLngDirect };
        const facilityCoords: LogisticsCoordinates = { lat: zone.centerLat, lng: zone.centerLon };

        // calculateDistance applies a 1.2× route factor; use raw Haversine for boundary check
        const rawDistance = calculateDistance(clientCoords, facilityCoords) / 1.2;
        haversineDistanceKm = Math.round(rawDistance * 100) / 100;

        console.log(
          `[Aethexer Sentinel] Haversine check: facility=${facilityId} zone="${zone.label}" ` +
          `distance=${haversineDistanceKm}km limit=${facilityZoneRadiusKm}km`
        );

        if (haversineDistanceKm > facilityZoneRadiusKm) {
          return protocolError(
            'GPS_OUT_OF_RANGE',
            'GPS ACCURACY DEGRADED — PLEASE RE-ENTER THE ACTIVE CAPTURE ZONE',
            400,
            backtrace
          );
        }
      } else {
        console.warn(`[Aethexer Sentinel] Unregistered facilityId: ${facilityId} — skipping Haversine boundary check`);
      }
    }

    // ── Step 4: Sentinel Engine Scoring ────────────────────────────────
    const documentIntegrityInputs: DocumentIntegrityInput[] = fileResults.map((f) => ({
      fileName: f.fileName,
      fileHash: f.fileHash,
      fileSizeBytes: f.fileSizeBytes,
      fileType: f.fileType,
      magicBytesValid: f.magicBytesValid,
      headerStructureValid: true, // Magic bytes passed → header is valid
    }));

    // LLM confidence — placeholder until parse step runs; default to 0.80 baseline
    const llmInput: LLMConfidenceInput = {
      parserConfidence: 0.80, // Baseline pre-parse confidence
      fieldsExtracted: sensorSnapshots ? sensorSnapshots.length : 0,
      fieldsExpected: sensorSnapshots ? Math.max(sensorSnapshots.length, 1) : 0,
      hasAnomalies: !timestampConsistent, // Temporal drift → anomaly flag
    };

    // Spatial correlation — enriched with Haversine distance + sensor data + timestamp validation
    const metaFieldCount = assetMetadata ? Object.keys(assetMetadata).length : 0;
    const sensorFieldBonus = sensorSnapshots ? sensorSnapshots.length : 0;
    const expectedMetaFields = track === 'TRACK_A_MATERIALS' ? 4 : track === 'TRACK_C_BIOCHAR_CDR' ? 5 : 3;

    const spatialInput: SpatialCorrelationInput = {
      hasGeolocation: geoLatDirect !== undefined && geoLngDirect !== undefined,
      geoLatitude: geoLatDirect,
      geoLongitude: geoLngDirect,
      hasTimestamp: clientTimestamp !== null || true, // Server always has timestamp; client timestamp is bonus
      timestampConsistent,
      metadataFieldsPresent: metaFieldCount + sensorFieldBonus,
      metadataFieldsExpected: expectedMetaFields,
      spatialScanPresent: hasSpatialScan,
      groundPhotosPresent: hasGroundPhotos,
    };

    const sentinelScore: SentinelScore = runSentinelScoring(documentIntegrityInputs, llmInput, spatialInput);

    console.log(
      `[Aethexer Sentinel] ${backtrace} — verdict: ${sentinelScore.sentinelVerdict}` +
      ` (doc=${sentinelScore.documentIntegrity}, llm=${sentinelScore.llmConfidence}, spatial=${sentinelScore.spatialCorrelation})`
    );

    // ── Step 5: Create Submission + Documents ──────────────────────────
    const submissionId = `SUB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const submission = await prisma.submission.create({
      data: {
        submissionId,
        track: track as TrackType,
        walletAddress,
        companyName: companyName || null,
        status: 'DRAFT',
        backtraceId: backtrace,
        ingestProtocol: 'aethexer-v1',
        ingestTimestamp: new Date(),
        parserResultJson: JSON.stringify({
          ...(assetMetadata && { assetMetadata }),
          ...(operatorId && { operatorId }),
          ...(facilityId && { facilityId }),
          ...(clientTimestamp && { clientTimestamp: clientTimestamp.toISOString(), timestampDriftMs }),
          ...(sensorSnapshots && { sensorSnapshots }),
          ...(haversineDistanceKm !== null && {
            haversineCheck: {
              distanceKm: haversineDistanceKm,
              facilityZone: facilityZoneLabel,
              radiusLimitKm: facilityZoneRadiusKm,
              withinBoundary: true,
            },
          }),
          sentinelScore: {
            verdict: sentinelScore.sentinelVerdict,
            composite: sentinelScore.compositeScore,
            documentIntegrity: sentinelScore.documentIntegrity,
            llmConfidence: sentinelScore.llmConfidence,
            spatialCorrelation: sentinelScore.spatialCorrelation,
            failedChecks: sentinelScore.failedChecks,
            scoreHash: sentinelScore.scoreHash,
            scoredAt: sentinelScore.scoredAt,
          },
        }),
        documents: {
          create: fileResults.map((f) => ({
            fileName: f.fileName,
            fileType: f.fileType,
            fileSizeBytes: f.fileSizeBytes,
            cloudStoragePath: f.cloudStoragePath,
            fileHash: f.fileHash,
          })),
        },
      },
      include: {
        documents: true,
      },
    });

    // ── Step 6: Return Protocol Response ────────────────────────────────
    return protocolSuccess(
      {
        submissionId: submission.submissionId,
        id: submission.id,
        status: submission.status,
        track: submission.track,
        backtrace,
        ingestProtocol: 'aethexer-v1',
        filesReceived: fileResults.length,
        files: fileResults.map((f) => ({
          fileName: f.fileName,
          category: f.category,
          fileHash: f.fileHash,
          cloudStoragePath: f.cloudStoragePath,
          uploadUrl: f.uploadUrl,
          fileSizeBytes: f.fileSizeBytes,
          magicBytesValid: f.magicBytesValid,
        })),
        sentinel: {
          verdict: sentinelScore.sentinelVerdict,
          compositeScore: sentinelScore.compositeScore,
          documentIntegrity: sentinelScore.documentIntegrity,
          llmConfidence: sentinelScore.llmConfidence,
          spatialCorrelation: sentinelScore.spatialCorrelation,
          passesThreshold: sentinelScore.passesThreshold,
          failedChecks: sentinelScore.failedChecks,
          node: sentinelScore.sentinelNode,
          version: sentinelScore.sentinelVersion,
          scoreHash: sentinelScore.scoreHash,
        },
        nextSteps: {
          uploadFiles: 'PUT each file to its uploadUrl with the correct Content-Type header.',
          triggerParse: `POST /api/submissions/${submission.id}/parse to invoke AI forensic extraction.`,
          founderApproval: `PATCH /api/v1/submissions/${submission.id}/approve to set founder approval.`,
          settle: `POST /api/submissions/${submission.id}/settle after founder approval and forensic verification.`,
        },
        walletAddress: submission.walletAddress,
        companyName: submission.companyName,
        assetMetadata: assetMetadata || null,
        spexterExtensions: {
          operatorId: operatorId || null,
          facilityId: facilityId || null,
          clientTimestamp: clientTimestamp?.toISOString() || null,
          timestampDriftMs: clientTimestamp ? timestampDriftMs : null,
          timestampConsistent,
          sensorSnapshotCount: sensorSnapshots?.length || 0,
          haversineCheck: haversineDistanceKm !== null ? {
            distanceKm: haversineDistanceKm,
            facilityZone: facilityZoneLabel,
            radiusLimitKm: facilityZoneRadiusKm,
            withinBoundary: true,
          } : null,
        },
      },
      backtrace,
      201
    );
  } catch (error) {
    console.error('[Aethexer Ingest] Error:', error);
    return protocolError(
      'INGEST_FAILED',
      error instanceof Error ? error.message : 'Forensic ingest failed.',
      500,
      backtrace
    );
  }
}

/**
 * GET /api/v1/forensic-ingest
 *
 * Returns protocol status and accepted file types.
 */
export async function GET(request: NextRequest) {
  const auth = await validateAethexerKey(request);
  if (!auth.valid) return auth.response!;

  return protocolSuccess({
    endpoint: '/api/v1/forensic-ingest',
    method: 'POST',
    contentType: 'multipart/form-data',
    status: 'ONLINE',
    acceptedFields: {
      spatialScan: { type: 'file', required: false, accepts: ['.ply', '.splat'], maxSize: '100MB' },
      'documents[]': { type: 'file[]', required: true, accepts: ['.pdf', '.csv', '.xlsx', '.docx'], maxSize: '100MB' },
      'groundPhotos[]': { type: 'file[]', required: false, accepts: ['.jpg', '.png', '.webp'], maxSize: '100MB' },
      track: { type: 'string', required: true, values: VALID_TRACKS },
      walletAddress: { type: 'string', required: true },
      companyName: { type: 'string', required: false },
      assetMetadata: { type: 'json', required: false, description: 'VIN, coordinates (latitude/longitude), custom fields' },
      operatorId: { type: 'string', required: false, description: 'SPEXTER operator identifier' },
      facilityId: { type: 'string', required: false, description: 'Facility zone ID (e.g. DC-SOVEREIGN-F1). Triggers Haversine boundary check when coordinates present.' },
      clientTimestamp: { type: 'string|int', required: false, description: 'Client-supplied ISO-8601 or Unix epoch ms. Validated against server time (15min drift tolerance).' },
      sensorSnapshots: { type: 'json', required: false, description: 'JSON array of SPEXTER sensor readings [{sensorId, type, value, unit, capturedAt}]' },
    },
    stateFlow: 'DRAFT → PENDING_FORENSIC_VERIFICATION → FORENSIC_VERIFIED → [founderApproved] → SETTLEMENT_COMPLETE',
  });
}
