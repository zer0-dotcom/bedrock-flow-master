// app/api/bedrockfad/intake/route.ts
// Hardened corporate-intake ingest endpoint.
// Pipeline: IP rate-limit -> parse -> contact validation -> email rate-limit ->
// file presence -> 10MB cap -> magic-byte validation -> UUID-sanitized storage
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
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

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

  // (4) Email rate-limit.
  const emailLimit = checkRateLimit(`email:${contactEmail}`);
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many submissions. Please wait.' },
      { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSeconds ?? 60) } },
    );
  }

  // (5) File presence.
  const fileEntry = formData.get('file');
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return NextResponse.json(
      { ok: false, error: 'A file is required.' },
      { status: 400 },
    );
  }
  const file = fileEntry;

  // (6) 10MB cap (check cheap size before buffering).
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'File exceeds the 10 MB limit.' },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'File exceeds the 10 MB limit.' },
      { status: 413 },
    );
  }

  // (7) Magic-byte / structural validation.
  const verdict = validateFile(buffer, file.name, file.type);
  if (!verdict.valid) {
    return NextResponse.json(
      { ok: false, error: verdict.reason || 'File type not accepted. Use PDF, XML, or CSV.' },
      { status: 415 },
    );
  }

  // (8) Sanitize filename -> UUID + cleaned extension.
  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, '');
  const storedName = `${randomUUID()}${ext}`;
  const storagePath = path.join(UPLOAD_DIR, storedName);

  // (9) SHA-256 of the exact bytes stored.
  const fileHash = createHash('sha256').update(buffer).digest('hex');

  // (10) Persist to disk, owner read/write only.
  try {
    await writeFile(storagePath, buffer, { mode: 0o600 });
  } catch (err) {
    console.error('[intake] storage write failed:', err);
    return NextResponse.json(
      { ok: false, error: 'Submission failed. Please try again.' },
      { status: 500 },
    );
  }

  // (11) Deterministic reference.
  const submissionRef = `FAD-${dateStampUTC(new Date())}-${randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;

  // (12) Record intake.
  try {
    await prisma.corporateIntake.create({
      data: {
        submissionRef,
        companyName,
        contactName,
        contactEmail,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: buffer.length,
        fileHash,
        storagePath,
      },
    });
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
      const sizeKb = (buffer.length / 1024).toFixed(1);
      const html = `
        <h2>Corporate Intake Received</h2>
        <p><strong>Reference:</strong> ${submissionRef}</p>
        <p><strong>Status:</strong> PENDING_FORENSIC_REVIEW</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:2px 12px 2px 0">Company</td><td>${companyName}</td></tr>
          <tr><td style="padding:2px 12px 2px 0">Contact</td><td>${contactName}</td></tr>
          <tr><td style="padding:2px 12px 2px 0">Email</td><td>${contactEmail}</td></tr>
          <tr><td style="padding:2px 12px 2px 0">File</td><td>${file.name}</td></tr>
          <tr><td style="padding:2px 12px 2px 0">MIME</td><td>${file.type}</td></tr>
          <tr><td style="padding:2px 12px 2px 0">Size</td><td>${sizeKb} KB</td></tr>
          <tr><td style="padding:2px 12px 2px 0">SHA-256</td><td style="font-family:monospace">${fileHash}</td></tr>
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
