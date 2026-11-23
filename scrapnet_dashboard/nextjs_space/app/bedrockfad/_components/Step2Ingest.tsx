'use client';

import React, { useState } from 'react';
import HelpTooltip from '@/components/ui/HelpTooltip';

interface ContactPayload {
  companyName: string;
  contactName: string;
  contactEmail: string;
}

export default function Step2Ingest({
  contactPayload,
  onNext,
  referralCode,
}: {
  contactPayload: ContactPayload | null;
  onNext: (submissionRef: string) => void;
  referralCode?: string | null;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const errorForStatus = (status: number): string => {
    if (status === 400) return 'Please check your contact details.';
    if (status === 413) return 'File exceeds the 10 MB limit.';
    if (status === 415) return 'File type not accepted. Use PDF, XML, or CSV.';
    if (status === 429) return 'Too many submissions. Please wait.';
    return 'Submission failed. Please try again.';
  };

  const handleSubmit = async () => {
    if (!selectedFile || submitting) return;
    if (!contactPayload) {
      setError('Please check your contact details.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('companyName', contactPayload.companyName);
      fd.append('contactName', contactPayload.contactName);
      fd.append('contactEmail', contactPayload.contactEmail);
      if (referralCode) fd.append('referralCode', referralCode);
      fd.append('file', selectedFile);

      const res = await fetch('/api/bedrockfad/intake', {
        method: 'POST',
        body: fd,
      });

      if (res.status === 201) {
        const data = await res.json().catch(() => null);
        const ref: string | undefined = data?.submissionRef;
        if (data?.ok && ref) {
          onNext(ref);
          return;
        }
        setError('Submission failed. Please try again.');
        return;
      }

      setError(errorForStatus(res.status));
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fileSizeKb = selectedFile ? (selectedFile.size / 1024).toFixed(1) : null;
  const ctaDisabled = !selectedFile || submitting;

  return (
    <div
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '40px 28px',
        background: 'rgba(15,23,42,.62)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid rgba(245,158,11,.18)',
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '.18em',
          color: '#f59e0b',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Step 2 · Upload Data
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 24 }}>
        Upload your facility data
        <HelpTooltip content="Accepted: PDF, DOCX, XLSX, images. Max 50 MB. Files are SHA-256 verified on receipt and stored in an isolated vault — never publicly accessible." />
      </h2>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          display: 'block',
          border: `1px dashed ${dragOver ? 'rgba(245,158,11,.9)' : 'rgba(245,158,11,.4)'}`,
          borderRadius: 3,
          padding: '44px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(245,158,11,.06)' : 'transparent',
        }}
      >
        <input
          type="file"
          accept=".pdf,.xml,.csv"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <i
          className="fa-solid fa-file-waveform"
          style={{ fontSize: 30, color: '#94a3b8', marginBottom: 14, display: 'block' }}
        />
        <div style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 6 }}>
          {selectedFile ? `Selected: ${selectedFile.name}` : 'Upload your facility data'}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '.06em' }}>
          Accepted formats: PDF, XML, CSV · Max 50 MB
        </div>
      </label>

      <details style={{ marginTop: 14 }}>
        <summary
          style={{
            fontSize: 11,
            color: '#94a3b8',
            letterSpacing: '.04em',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          What can I upload?
        </summary>
        <ul
          style={{
            marginTop: 10,
            padding: '12px 14px 12px 28px',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 3,
            fontSize: 11,
            color: '#cbd5e1',
            lineHeight: 1.9,
            listStyle: 'disc',
          }}
        >
          <li>Phase I / Phase II Environmental Site Assessments (PDF)</li>
          <li>Contamination remediation cost reports</li>
          <li>Mineral assay certificates (PDF, XLSX)</li>
          <li>Biochar production &amp; verification records</li>
          <li>Legacy industrial liability documentation</li>
          <li>Corporate carbon accounting worksheets (XLSX)</li>
        </ul>
      </details>

      {selectedFile && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#cbd5e1',
            borderTop: '1px solid rgba(255,255,255,.06)',
            paddingTop: 12,
          }}
        >
          <span style={{ fontFamily: 'monospace', letterSpacing: '.04em' }}>{selectedFile.name}</span>
          <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
            {fileSizeKb} KB
            <HelpTooltip content="This SHA-256 fingerprint confirms your file arrived unmodified. It is recorded on the submission ledger." />
          </span>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 14, fontSize: 11, color: '#ef4444', letterSpacing: '.02em' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={ctaDisabled}
        style={{
          marginTop: 24,
          width: '100%',
          padding: '14px 24px',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: '#030712',
          background: '#f59e0b',
          border: 'none',
          borderRadius: 3,
          cursor: ctaDisabled ? 'not-allowed' : 'pointer',
          opacity: ctaDisabled ? 0.5 : 1,
          fontFamily: 'inherit',
          boxShadow: ctaDisabled ? 'none' : '0 0 24px -6px rgba(245,158,11,.6)',
        }}
      >
        {submitting ? 'Submitting…' : 'Submit for Forensic Review →'}
      </button>
    </div>
  );
}
