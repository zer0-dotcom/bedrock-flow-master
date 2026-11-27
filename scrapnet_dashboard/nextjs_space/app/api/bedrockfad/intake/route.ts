// app/api/bedrockfad/intake/route.ts
// Hardened corporate-intake ingest endpoint.
// Pipeline: IP rate-limit -> parse -> contact validation -> email rate-limit ->
// file presence -> 50MB cap -> magic-byte validation -> UUID-sanitized storage
// (0600, outside public/) -> SHA-256 -> CorporateIntake persist ->
// best-effort operator email -> 201 { ok, submissionRef }.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID, randomBytes, createHash } from 'crypto';
import { writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/resend';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateFile } from '@/lib/intake-validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Operator-specified absolute storage path — outside public/, mode-700 directory.
const UPLOAD_DIR = '/home/ubuntu/bedrock-flow-master/.uploads/corporate-intake';
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

const ContactSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email().max(320),
});

function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0].trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function dateStampUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export async function POST(request: Request) {
  // (1) IP rate-limit BEFORE any parsing.
  const clientIp = getClientIp(request);
  const ipLimit = checkRateLimit(`ip:${clientIp}`);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many submissions. Please wait.' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds ?? 60) } },
    );
  }

  // (2) Parse multipart body.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Please check your submission.' },
      { status: 400 },
    );
  }

  // (3) Contact validation.
  const parsed = ContactSchema.safeParse({
    companyName: String(formData.get('companyName') ?? ''),
    contactName: String(formData.get('contactName') ?? ''),
    contactEmail: String(formData.get('contactEmail') ?? ''),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Please check your contact details.' },
      { status: 400 },
    );
  }
  const { companyName, contactName, contactEmail } = parsed.data;

  // Optional referral code — validate shape; ignore silently if malformed (never fail submission).
  const REF_RE = /^(REF|SPEC)-[A-Z0-9]{6}$/;
  const rawRef = String(formData.get('referralCode') ?? '').trim().toUpperCase();
  const referralCode = REF_RE.test(rawRef) ? rawRef : null;

  // (4) Email rate-limit.
  const emailLimit = checkRateLimit(`email:${contactEmail}`);
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many submissions. Please wait.' },
      { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSeconds ?? 60) } },
    );
  }

  // (5) File presence — accept one OR many files under the key 'file'.
  // Single-file requests behave exactly as before (one validated entry).
  const fileEntries = formData
    .getAll('file')
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (fileEntries.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'A file is required.' },
      { status: 400 },
    );
  }

  // (6-9) Validate + buffer + hash EVERY file BEFORE any disk write, so a bad
  // file in the batch never leaves orphaned bytes on disk.
  interface PreparedFile {
    file: File;
    buffer: Buffer;
    storagePath: string;
    fileHash: string;
  }
  const prepared: PreparedFile[] = [];
  for (const file of fileEntries) {
    // (6) 50MB cap (cheap size check before buffering).
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'File exceeds the 50 MB limit.' },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'File exceeds the 50 MB limit.' },
        { status: 413 },
      );
    }

    // (7) Magic-byte / structural validation.
    const verdict = validateFile(buffer, file.name, file.type);
    if (!verdict.valid) {
      return NextResponse.json(
        {
          ok: false,
          error:
            verdict.reason ||
            'File type not accepted. Use PDF, PNG, JPG, XML, or CSV.',
        },
        { status: 415 },
      );
    }

    // (8) Sanitize filename -> UUID + cleaned extension.
    const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const storedName = `${randomUUID()}${ext}`;
    const storagePath = path.join(UPLOAD_DIR, storedName);

    // (9) SHA-256 of the exact bytes stored.
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    prepared.push({ file, buffer, storagePath, fileHash });
  }

  // (10) Persist every validated file to disk, owner read/write only.
  for (const p of prepared) {
    try {
      await writeFile(p.storagePath, p.buffer, { mode: 0o600 });
    } catch (err) {
      console.error('[intake] storage write failed:', err);
      return NextResponse.json(
        { ok: false, error: 'Submission failed. Please try again.' },
        { status: 500 },
      );
    }
  }

  // (11) Deterministic reference for the submission (shared root).
  const submissionRef = `FAD-${dateStampUTC(new Date())}-${randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;

  // (12) Record intake — one row per file. First file keeps the canonical ref
  // (byte-for-byte identical to the legacy single-file contract); additional
  // files in the same batch are suffixed `-2`, `-3`, ... to satisfy @unique.
  try {
    for (let i = 0; i < prepared.length; i++) {
      const p = prepared[i];
      const rowRef = i === 0 ? submissionRef : `${submissionRef}-${i + 1}`;
      await prisma.corporateIntake.create({
        data: {
          submissionRef: rowRef,
          companyName,
          contactName,
          contactEmail,
          fileName: p.file.name,
          mimeType: p.file.type,
          fileSizeBytes: p.buffer.length,
          fileHash: p.fileHash,
          storagePath: p.storagePath,
          referralCode,
        },
      });
    }
  } catch (err) {
    console.error('[intake] persist failed:', err);
    return NextResponse.json(
      { ok: false, error: 'Submission failed. Please try again.' },
      { status: 500 },
    );
  }

  // (13) Best-effort operator notification — never fatal.
  if (process.env.ADMIN_MASTER_EMAIL && process.env.RESEND_API_KEY) {
    try {
      const fileRows = prepared
        .map((p) => {
          const sizeKb = (p.buffer.length / 1024).toFixed(1);
          return `
          <tr><td style="padding:2px 12px 2px 0">File</td><td>${p.file.name}</td></tr>
          <tr><td style="padding:2px 12px 2px 0">MIME</td><td>${p.file.type}</td></tr>
          <tr><td style="padding:2px 12px 2px 0">Size</td><td>${sizeKb} KB</td></tr>
          <tr><td style="padding:2px 12px 2px 0">SHA-256</td><td style="font-family:monospace">${p.fileHash}</td></tr>
          <tr><td colspan="2" style="padding:4px 0"><hr style="border:none;border-top:1px solid #ccc"/></td></tr>`;
        })
        .join('');
      const html = `
        <h2>Corporate Intake Received</h2>
        <p><strong>Reference:</strong> ${submissionRef}</p>
        <p><strong>Status:</strong> PENDING_FORENSIC_REVIEW</p>
        <p><strong>Files:</strong> ${prepared.length}</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:2px 12px 2px 0">Company</td><td>${companyName}</td></tr>
          <tr><td style="padding:2px 12px 2px 0">Contact</td><td>${contactName}</td></tr>
          <tr><td style="padding:2px 12px 2px 0">Email</td><td>${contactEmail}</td></tr>
          <tr><td colspan="2" style="padding:4px 0"><hr style="border:none;border-top:1px solid #ccc"/></td></tr>
          ${fileRows}
        </table>
      `;
      await sendEmail({
        to: process.env.ADMIN_MASTER_EMAIL,
        subject: `New Corporate Intake — ${submissionRef}`,
        html,
      });
    } catch (err) {
      console.warn('[intake] operator email failed (non-fatal):', err);
    }
  }

  // (14) Done.
  return NextResponse.json({ ok: true, submissionRef }, { status: 201 });
}
