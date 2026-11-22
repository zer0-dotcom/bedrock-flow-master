'use client';

import React, { useState } from 'react';

export default function Step2Ingest({ onNext }: { onNext: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // CLIENT-SIDE UI ONLY — no server call, no upload, no Prisma.
  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      setFileName(files[0].name);
    }
  };

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
          {fileName ? `Selected: ${fileName}` : 'Upload your facility data'}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '.06em' }}>
          Accepted formats: PDF, XML, CSV
        </div>
      </label>

      <div style={{ fontSize: 11, color: '#64748b', marginTop: 14, lineHeight: 1.6 }}>
        Server processing and secure storage activate in the next release.
      </div>

      <button
        onClick={onNext}
        style={{
          marginTop: 28,
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
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 0 24px -6px rgba(245,158,11,.6)',
        }}
      >
        Submit for Forensic Review →
      </button>
    </div>
  );
}
