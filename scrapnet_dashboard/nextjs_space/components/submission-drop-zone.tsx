'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Upload,
  FileText,
  Table2,
  FileSpreadsheet,
  Box,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Flame,
  HardHat,
  Zap,
} from 'lucide-react';

type Track = 'TRACK_A_MATERIALS' | 'TRACK_B_ENERGY_179D' | 'TRACK_C_BIOCHAR_CDR';

interface FileWithMeta {
  file: File;
  fileType: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  cloudStoragePath?: string;
  fileHash?: string;
}

const TRACKS = [
  {
    id: 'TRACK_A_MATERIALS' as Track,
    label: 'Track A — Materials',
    desc: 'Asphalt, Concrete, Metal invoices → ICE v4.1 coefficients',
    icon: HardHat,
    color: 'blue',
    accepts: 'PDF, CSV, XLSX, DOCX',
  },
  {
    id: 'TRACK_B_ENERGY_179D' as Track,
    label: 'Track B — 179D Energy',
    desc: 'Building envelopes & energy audits → IRS Form 7205',
    icon: Zap,
    color: 'amber',
    accepts: 'PDF, DOCX, XLSX',
  },
  {
    id: 'TRACK_C_BIOCHAR_CDR' as Track,
    label: 'Track C — Biochar CDR',
    desc: 'Production receipts → Biochar CDR Calculator',
    icon: Flame,
    color: 'green',
    accepts: 'PDF, CSV, XLSX, PLY, Splat',
  },
];

const ACCEPTED_TYPES: Record<string, string[]> = {
  TRACK_A_MATERIALS: ['.pdf', '.csv', '.xlsx', '.xls', '.docx', '.doc'],
  TRACK_B_ENERGY_179D: ['.pdf', '.docx', '.doc', '.xlsx', '.xls'],
  TRACK_C_BIOCHAR_CDR: ['.pdf', '.csv', '.xlsx', '.xls', '.ply', '.splat'],
};

function getFileType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['xls', 'xlsx'].includes(ext)) return 'xlsx';
  if (['doc', 'docx'].includes(ext)) return 'docx';
  return ext;
}

function getMimeType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const mimes: Record<string, string> = {
    pdf: 'application/pdf',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    ply: 'application/octet-stream',
    splat: 'application/octet-stream',
  };
  return mimes[ext] || 'application/octet-stream';
}

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function DropZone({
  walletAddress,
  companyName,
}: {
  walletAddress: string;
  companyName: string;
}) {
  const [selectedTrack, setSelectedTrack] = useState<Track>('TRACK_A_MATERIALS');
  const [files, setFiles] = useState<FileWithMeta[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; submissionId?: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trackConfig = TRACKS.find((t) => t.id === selectedTrack)!;
  const accepted = ACCEPTED_TYPES[selectedTrack];

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const newFiles: FileWithMeta[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
        if (!accepted.includes(ext)) continue;
        newFiles.push({
          file,
          fileType: getFileType(file.name),
          uploading: false,
          uploaded: false,
        });
      }
      setFiles((prev) => [...prev, ...newFiles]);
      setResult(null);
    },
    [accepted]
  );

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadAndSubmit = async () => {
    if (files.length === 0) return;
    setSubmitting(true);
    setResult(null);

    try {
      // Upload each file to S3
      const uploaded: FileWithMeta[] = [...files];
      for (let i = 0; i < uploaded.length; i++) {
        const f = uploaded[i];
        if (f.uploaded) continue;

        uploaded[i] = { ...f, uploading: true };
        setFiles([...uploaded]);

        // Get presigned URL
        const presignRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: f.file.name,
            contentType: getMimeType(f.file.name),
            isPublic: false,
          }),
        });

        if (!presignRes.ok) throw new Error('Failed to get upload URL');
        const { uploadUrl, cloud_storage_path } = await presignRes.json();

        // Check if content-disposition is in signed headers
        const url = new URL(uploadUrl);
        const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders') || '';
        const headers: Record<string, string> = {
          'Content-Type': getMimeType(f.file.name),
        };
        if (signedHeaders.includes('content-disposition')) {
          headers['Content-Disposition'] = 'attachment';
        }

        // Upload directly to S3
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers,
          body: f.file,
        });

        if (!uploadRes.ok) throw new Error(`Upload failed for ${f.file.name}`);

        const fileHash = await hashFile(f.file);

        uploaded[i] = {
          ...f,
          uploading: false,
          uploaded: true,
          cloudStoragePath: cloud_storage_path,
          fileHash,
        };
        setFiles([...uploaded]);
      }

      // Create submission with document references
      const docs = uploaded
        .filter((f) => f.uploaded && f.cloudStoragePath)
        .map((f) => ({
          fileName: f.file.name,
          fileType: f.fileType,
          fileSizeBytes: f.file.size,
          cloudStoragePath: f.cloudStoragePath!,
          fileHash: f.fileHash!,
        }));

      const subRes = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: selectedTrack,
          walletAddress,
          companyName: companyName || undefined,
          documents: docs,
        }),
      });

      if (!subRes.ok) {
        const err = await subRes.json();
        throw new Error(err.error || 'Submission creation failed');
      }

      const { submission } = await subRes.json();
      setResult({
        success: true,
        message: `Submission ${submission.submissionId} created with ${docs.length} document(s). Status: DRAFT`,
        submissionId: submission.id,
      });
      setFiles([]);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Submission failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Track Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TRACKS.map((track) => {
          const Icon = track.icon;
          const isActive = selectedTrack === track.id;
          return (
            <button
              key={track.id}
              onClick={() => {
                setSelectedTrack(track.id);
                setFiles([]);
                setResult(null);
              }}
              className={cn(
                'text-left p-4 rounded-xl border transition-all',
                isActive
                  ? 'border-blue-500 bg-blue-500/5'
                  : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon
                  className={cn(
                    'w-5 h-5',
                    isActive ? 'text-blue-400' : 'text-gray-500'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isActive ? 'text-white' : 'text-gray-400'
                  )}
                >
                  {track.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {track.desc}
              </p>
              <p className="text-[10px] text-gray-600 mt-2">Accepts: {track.accepts}</p>
            </button>
          );
        })}
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          dragOver
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-[#2a2a2a] bg-[#111] hover:border-[#3a3a3a]'
        )}
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
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accepted.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-1">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-600">
          Accepted: {trackConfig.accepts}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-3 font-semibold">QUEUED FILES</div>
          <div className="space-y-2">
            {files.map((f, idx) => {
              const Icon =
                f.fileType === 'pdf'
                  ? FileText
                  : f.fileType === 'csv'
                    ? Table2
                    : f.fileType === 'xlsx'
                      ? FileSpreadsheet
                      : f.fileType === 'ply' || f.fileType === 'splat'
                        ? Box
                        : FileText;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-[#111] rounded-lg px-3 py-2 border border-[#2a2a2a]"
                >
                  <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-300 flex-1 truncate">
                    {f.file.name}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {(f.file.size / 1024).toFixed(0)} KB
                  </span>
                  {f.uploading && (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  )}
                  {f.uploaded && (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  )}
                  {!f.uploading && !f.uploaded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-gray-600 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={uploadAndSubmit}
            disabled={submitting || files.length === 0}
            className={cn(
              'mt-4 w-full py-3 rounded-lg text-sm font-semibold transition-colors',
              submitting
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            )}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading & Creating Submission...
              </span>
            ) : (
              `Submit ${files.length} File(s) to ${trackConfig.label}`
            )}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className={cn(
            'rounded-xl p-4 border',
            result.success
              ? 'bg-green-500/5 border-green-500/30'
              : 'bg-red-500/5 border-red-500/30'
          )}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={cn(
                  'text-sm',
                  result.success ? 'text-green-300' : 'text-red-300'
                )}
              >
                {result.message}
              </p>
              {result.success && (
                <p className="text-xs text-gray-500 mt-1">
                  Run the AI Forensic Parser from the submissions list below to
                  extract data and proceed to settlement.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
