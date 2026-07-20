'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';
import DropZone from '@/components/submission-drop-zone';
import SubmissionsList from '@/components/submissions-list';
import {
  Shield,
  Wallet,
  Building2,
  Zap,
  FileCheck,
  Lock,
  Fingerprint,
} from 'lucide-react';

export default function SubmissionPortalPage() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading Secure Portal...</div>
      </div>
    );
  }

  // GATEHOUSE: Wallet not connected
  if (!connected || !publicKey) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="border border-[#2a2a2a] rounded-xl bg-[#1a1a1a] p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Corporate Onboarding
            </h1>
            <p className="text-gray-400 text-sm mb-2">
              Bedrock ESG — Business Submission Portal
            </p>
            <p className="text-gray-500 text-xs mb-8">
              Connect your Solana wallet to access the secure submission portal.
              All submissions are tethered to the Aethexer Sentinel for
              institutional-grade verification.
            </p>

            <div className="flex flex-col items-center gap-4">
              <WalletMultiButton
                style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: '8px',
                  height: '48px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="bg-[#111] rounded-lg p-3 border border-[#2a2a2a]">
                <Shield className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <div className="text-[10px] text-gray-500 text-center">Wallet-Gated</div>
              </div>
              <div className="bg-[#111] rounded-lg p-3 border border-[#2a2a2a]">
                <Fingerprint className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <div className="text-[10px] text-gray-500 text-center">Sentinel Node-01</div>
              </div>
              <div className="bg-[#111] rounded-lg p-3 border border-[#2a2a2a]">
                <FileCheck className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <div className="text-[10px] text-gray-500 text-center">On-Chain Proof</div>
              </div>
            </div>

            <div className="mt-6 text-[10px] text-gray-600 font-mono">
              Aethexer Sentinel: 9tsq8q...AJRAQ3
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ONBOARDING: Company name
  if (!onboarded) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="border border-[#2a2a2a] rounded-xl bg-[#1a1a1a] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Welcome, Corporate Entity</h2>
                <p className="text-xs text-gray-500 font-mono">
                  {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-6)}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Company / Entity Name (optional)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Bedrock Infrastructure LLC"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setOnboarded(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-3 text-sm font-semibold transition-colors"
            >
              Enter Submission Portal
            </button>

            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-600">
              <Zap className="w-3 h-3" />
              <span>All submissions tethered to Aethexer Sentinel (Node-01) for forensic verification</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN PORTAL: Drop Zone + Submissions
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Business Submission Portal
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {companyName && <span className="text-gray-400">{companyName} · </span>}
              <span className="font-mono">
                {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-6)}
              </span>
            </p>
          </div>
          <WalletMultiButton
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              height: '36px',
              fontSize: '12px',
            }}
          />
        </div>

        {/* Drop Zone */}
        <DropZone
          walletAddress={publicKey.toBase58()}
          companyName={companyName}
        />

        {/* Submissions List */}
        <div className="mt-8">
          <SubmissionsList walletAddress={publicKey.toBase58()} />
        </div>
      </div>
    </div>
  );
}
