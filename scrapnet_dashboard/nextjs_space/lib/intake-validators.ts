// lib/intake-validators.ts
// Zero-dependency corporate-intake file validation.
// Three independent gates — ALL must pass:
//   (1) lowercase extension in allowlist
//   (2) declared MIME in allowlist
//   (3) magic-byte / structural inspection of the actual bytes
// Rejection reasons are operator-safe: they never expose internal paths,
// storage locations, or stack detail.

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/xml',
  'application/xml',
  'text/csv',
  'application/csv',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.xml', '.csv'];

export interface FileValidationResult {
  valid: boolean;
  reason?: string;
}

// ---- helpers ---------------------------------------------------------------

function lowerExt(name: string): string {
  const i = name.lastIndexOf('.');
  if (i < 0) return '';
  return name.slice(i).toLowerCase();
}

// Decode up to the first `n` bytes as UTF-8 with fatal checking.
// Returns null when the slice is not valid UTF-8 (i.e. binary content).
function decodeUtf8Head(buffer: Buffer, n = 512): string | null {
  const slice = buffer.subarray(0, Math.min(n, buffer.length));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(slice);
  } catch {
    return null;
  }
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

// ---- structural inspectors -------------------------------------------------

function inspectPdf(buffer: Buffer): FileValidationResult {
  // %PDF = 0x25 0x50 0x44 0x46
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: true };
  }
  return { valid: false, reason: 'File content does not match a valid PDF.' };
}

function inspectXml(buffer: Buffer): FileValidationResult {
  const head = decodeUtf8Head(buffer, 512);
  if (head === null) {
    return { valid: false, reason: 'File content is not valid text/XML.' };
  }
  const trimmed = stripBom(head).trimStart();
  const lower = trimmed.toLowerCase();

  // Reject active/markup payloads masquerading as XML data.
  if (
    lower.includes('<script') ||
    lower.includes('javascript:') ||
    lower.includes('<!doctype html')
  ) {
    return { valid: false, reason: 'File content is not valid XML.' };
  }

  // Must open as XML: a declaration, or a valid element start.
  const startsWithDecl = trimmed.startsWith('<?xml');
  const startsWithElement = /^<[A-Za-z_]/.test(trimmed);
  if (!startsWithDecl && !startsWithElement) {
    return { valid: false, reason: 'File content is not valid XML.' };
  }
  return { valid: true };
}

function inspectCsv(buffer: Buffer): FileValidationResult {
  // Raw-byte magic prefixes (checked before text decode).
  const b = buffer;
  if (b.length >= 2 && b[0] === 0x4d && b[1] === 0x5a) {
    return { valid: false, reason: 'File content is not valid CSV.' }; // MZ (PE/EXE)
  }
  if (b.length >= 2 && b[0] === 0xd0 && b[1] === 0xcf) {
    return { valid: false, reason: 'File content is not valid CSV.' }; // OLE compound
  }
  if (
    b.length >= 4 &&
    b[0] === 0x25 &&
    b[1] === 0x50 &&
    b[2] === 0x44 &&
    b[3] === 0x46
  ) {
    return { valid: false, reason: 'File content is not valid CSV.' }; // %PDF
  }

  const head = decodeUtf8Head(buffer, 512);
  if (head === null) {
    return { valid: false, reason: 'File content is not valid CSV.' };
  }
  const trimmed = stripBom(head).trimStart();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('<?xml') ||
    lower.startsWith('<html') ||
    lower.startsWith('%pdf')
  ) {
    return { valid: false, reason: 'File content is not valid CSV.' };
  }

  // A CSV must contain a delimiter in its first 512 bytes.
  if (!/[,;\t]/.test(head)) {
    return { valid: false, reason: 'File content is not valid CSV.' };
  }
  return { valid: true };
}

// ---- public API ------------------------------------------------------------

export function validateFile(
  buffer: Buffer,
  originalName: string,
  declaredMime: string,
): FileValidationResult {
  // Gate 1 — extension allowlist
  const ext = lowerExt(originalName);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      reason: 'File type not accepted. Use PDF, XML, or CSV.',
    };
  }

  // Gate 2 — declared MIME allowlist
  if (!ALLOWED_MIME_TYPES.includes((declaredMime || '').toLowerCase())) {
    return {
      valid: false,
      reason: 'File type not accepted. Use PDF, XML, or CSV.',
    };
  }

  if (buffer.length === 0) {
    return { valid: false, reason: 'File is empty.' };
  }

  // Gate 3 — magic / structural inspection, keyed on the validated extension
  switch (ext) {
    case '.pdf':
      return inspectPdf(buffer);
    case '.xml':
      return inspectXml(buffer);
    case '.csv':
      return inspectCsv(buffer);
    default:
      return {
        valid: false,
        reason: 'File type not accepted. Use PDF, XML, or CSV.',
      };
  }
}
