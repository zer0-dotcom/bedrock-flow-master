'use client';

import React, { useRef, useState } from 'react';
import HelpTooltip from '@/components/ui/HelpTooltip';
import type { IntakeTrack } from './Step1Gate';

// Per-track client-side allowlists. Server-side (lib/intake-validators.ts) is the
// authoritative gate; this is a fast-fail UX layer so bad files never stage.
const RESIDENTIAL_EXT = ['.pdf', '.png', '.jpg', '.jpeg'];
const COMMERCIAL_EXT = ['.pdf', '.png', '.jpg', '.jpeg', '.xml', '.csv'];
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB / file

interface RejectedFile {
  name: string;
  reason: string;
}

const extOf = (name: string): string => {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
};

const iconFor = (name: string): string => {
  const e = extOf(name);
  if (e === '.pdf') return 'fa-file-pdf';
  if (e === '.png' || e === '.jpg' || e === '.jpeg') return 'fa-file-image';
  if (e === '.xml') return 'fa-file-code';
  if (e === '.csv') return 'fa-file-csv';
  return 'fa-file';
};

const humanSize = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

export default function Step2Ingest({
  track,
  initialFiles = [],
  onNext,
  onBack,
}: {
  track: IntakeTrack;
  initialFiles?: File[];
  onNext: (files: File[]) => void;
  onBack?: () => void;
}) {
  const residential = track === 'residential';
  const accent = residential ? '#06b6d4' : '#f59e0b';
  const allowedExt = residential ? RESIDENTIAL_EXT : COMMERCIAL_EXT;
  const acceptAttr = allowedExt.join(',');
  const maxFiles = residential ? 2 : Infinity;

  const [files, setFiles] = useState<File[]>(initialFiles);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const list = Array.from(incoming);
    const nextRejected: RejectedFile[] = [];

    setFiles((prev) => {
      const accepted = [...prev];
      for (const f of list) {
        const e = extOf(f.name);
        if (!allowedExt.includes(e)) {
          nextRejected.push({
            name: f.name,
            reason: `Unsupported type — accepts ${allowedExt.join(', ')}.`,
          });
          continue;
        }
        if (f.size > MAX_BYTES) {
          nextRejected.push({ name: f.name, reason: 'Exceeds 20 MB per-file limit.' });
          continue;
        }
        // Dedupe by name + size.
        if (accepted.some((a) => a.name === f.name && a.size === f.size)) continue;
        if (accepted.length >= maxFiles) {
          nextRejected.push({
            name: f.name,
            reason: `Limit of ${maxFiles} file${maxFiles === 1 ? '' : 's'} reached.`,
          });
          continue;
        }
        accepted.push(f);
      }
      return accepted;
    });

    setRejected(nextRejected);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const atCapacity = files.length >= maxFiles;
  const confirmDisabled = files.length === 0;

  return (
    <div
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '40px 28px',
        background: 'rgba(15,23,42,.62)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: `1px solid ${residential ? 'rgba(6,182,212,.18)' : 'rgba(245,158,11,.18)'}`,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '.18em',
          color: accent,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Step 2 · Drop &amp; Submit Your Files
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
        {residential ? 'Attach your utility bills' : 'Attach your facility data'}
        <HelpTooltip content="Files are SHA-256 verified on receipt and stored in an isolated vault — never publicly accessible." />
      </h2>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 22 }}>
        {residential
          ? 'Drop up to 2 files. Accepts PDF, PNG, JPG · Max 20 MB each.'
          : 'Drop one or more files. Accepts PDF, PNG, JPG, XML, CSV · Max 20 MB each.'}
      </p>

      {/* DROPZONE — label wraps a hidden multi-file input */}
      <label
        htmlFor="s2-file-input"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        style={{
          display: 'block',
          border: `1px dashed ${dragOver ? accent : residential ? 'rgba(6,182,212,.4)' : 'rgba(245,158,11,.4)'}`,
          borderRadius: 3,
          padding: files.length ? '24px 20px' : '44px 20px',
          textAlign: 'center',
          cursor: atCapacity ? 'not-allowed' : 'pointer',
          background: dragOver ? `${residential ? 'rgba(6,182,212,.06)' : 'rgba(245,158,11,.06)'}` : 'transparent',
          opacity: atCapacity ? 0.55 : 1,
          transition: 'all .2s ease',
        }}
      >
        <input
          id="s2-file-input"
          ref={inputRef}
          type="file"
          multiple
          accept={acceptAttr}
          disabled={atCapacity}
          style={{ display: 'none' }}
          onChange={(e) => addFiles(e.target.files)}
        />
        <i
          className="fa-solid fa-cloud-arrow-up"
          style={{ fontSize: 28, color: '#94a3b8', marginBottom: 12, display: 'block' }}
        />
        <div style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 4 }}>
          Drop Utility Bills Here or{' '}
          <span style={{ color: accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Browse Files
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '.08em' }}>
          {atCapacity
            ? `Maximum of ${maxFiles} files attached`
            : allowedExt.map((x) => x.replace('.', '').toUpperCase()).join(' · ')}
        </div>

        {/* LIVE STACKED FILE CARDS — inside the dropzone */}
        {files.length > 0 && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
            {files.map((f, idx) => (
              <div
                key={`${f.name}-${f.size}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  border: '1px solid rgba(16,185,129,.3)',
                  background: 'rgba(16,185,129,.05)',
                  borderRadius: 3,
                }}
              >
                <i className={`fa-solid ${iconFor(f.name)}`} style={{ fontSize: 18, color: accent, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#f1f5f9',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {f.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                    {humanSize(f.size)} · <span style={{ color: '#10b981' }}>✅ Ready to Submit</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  aria-label={`Remove ${f.name}`}
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    border: '1px solid #334155',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </label>

      {/* REJECTED FILES — inline red cards, never staged */}
      {rejected.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rejected.map((r, i) => (
            <div
              key={`${r.name}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                border: '1px solid rgba(239,68,68,.4)',
                background: 'rgba(239,68,68,.06)',
                borderRadius: 3,
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 13, color: '#ef4444', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: '#fca5a5',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.name}
                </div>
                <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>{r.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NAVIGATION */}
      <div style={{ marginTop: 26, display: 'flex', gap: 12, alignItems: 'center' }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '14px 20px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: '#94a3b8',
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ← Back
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (confirmDisabled) return;
            onNext(files);
          }}
          disabled={confirmDisabled}
          style={{
            flex: 1,
            padding: '14px 24px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: '#030712',
            background: accent,
            border: 'none',
            borderRadius: 3,
            cursor: confirmDisabled ? 'not-allowed' : 'pointer',
            opacity: confirmDisabled ? 0.5 : 1,
            fontFamily: 'inherit',
            boxShadow: confirmDisabled
              ? 'none'
              : `0 0 24px -6px ${residential ? 'rgba(6,182,212,.6)' : 'rgba(245,158,11,.6)'}`,
          }}
        >
          {confirmDisabled
            ? 'Confirm Files'
            : `Confirm ${files.length} File${files.length === 1 ? '' : 's'} →`}
        </button>
      </div>
    </div>
  );
}
