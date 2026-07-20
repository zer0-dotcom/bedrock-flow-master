'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  FileCheck2, ExternalLink, Copy, Check, Loader2, Clock, CheckCircle2
} from 'lucide-react';

interface SolanaProof {
  id: string;
  transactionHash: string;
  programId: string;
  walletAddress: string;
  auditType: string;
  carbonAmount: number;
  valueUsd: number;
  status: string;
  blockHeight: number | null;
  confirmedAt: string | null;
  createdAt: string;
}

interface SolanaProofsListProps {
  userId: string;
}

export default function SolanaProofsList({ userId }: SolanaProofsListProps) {
  const [proofs, setProofs] = useState<SolanaProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProofs = async () => {
      try {
        const response = await fetch(`/api/solana/proofs?userId=${userId}`);
        const data = await response.json();
        if (data.success) {
          setProofs(data.data.proofs);
        }
      } catch (error) {
        console.error('Failed to fetch proofs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProofs();
  }, [userId]);

  const copyTxHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (proofs.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 text-center">
        <FileCheck2 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500">No Solana proofs yet</p>
        <p className="text-xs text-gray-600 mt-1">Mint your first Proof of Audit above</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-white font-medium flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-violet-400" />
          Solana Audit Proofs
        </h3>
        <span className="text-xs text-gray-500">{proofs.length} minted</span>
      </div>

      <div className="divide-y divide-gray-800/50">
        {proofs.map((proof) => (
          <div key={proof.id} className="px-6 py-4 hover:bg-[#0a0a0a] transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  proof.status === 'CONFIRMED' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                )}>
                  {proof.status === 'CONFIRMED' 
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <Clock className="w-4 h-4 text-amber-400" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{proof.auditType.replace('_', ' ')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs text-cyan-400 font-mono">
                      {proof.transactionHash.substring(0, 20)}...
                    </code>
                    <button
                      onClick={() => copyTxHash(proof.id, proof.transactionHash)}
                      className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition"
                    >
                      {copiedId === proof.id 
                        ? <Check className="w-3 h-3 text-emerald-400" />
                        : <Copy className="w-3 h-3" />
                      }
                    </button>
                    <a
                      href={`https://explorer.solana.com/tx/${proof.transactionHash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-violet-400 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{formatDate(proof.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{proof.carbonAmount.toFixed(2)} tCO₂</p>
                <p className="text-xs text-emerald-400">${proof.valueUsd.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
