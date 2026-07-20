'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Coins, Wallet, CheckCircle2, Loader2, AlertCircle,
  ExternalLink, Copy, Check, Shield
} from 'lucide-react';

interface MintProofOfAuditProps {
  userId: string;
  carbonBalance: number;
  carbonValueUsd: number;
  onMintSuccess?: (txHash: string) => void;
}

export default function MintProofOfAudit({
  userId,
  carbonBalance,
  carbonValueUsd,
  onMintSuccess,
}: MintProofOfAuditProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleMint = async () => {
    if (!walletAddress) {
      setError('Please enter your Solana wallet address');
      return;
    }

    // Basic Solana address validation
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(walletAddress)) {
      setError('Invalid Solana wallet address format');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/solana/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          walletAddress,
          auditType: 'CARBON_CREDIT',
          carbonAmount: carbonBalance,
          valueUsd: carbonValueUsd,
          metadata: {
            source: 'sovereign_ledger',
            mintedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTxHash(data.data.transactionHash);
        onMintSuccess?.(data.data.transactionHash);
      } else {
        setError(data.error || 'Failed to mint Proof of Audit');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyTxHash = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (success) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-emerald-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Proof of Audit Minted!</h3>
            <p className="text-sm text-gray-500">Your carbon credits are now on Solana</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
          <div className="flex items-center gap-2">
            <code className="text-sm text-cyan-400 font-mono truncate flex-1">
              {txHash}
            </code>
            <button
              onClick={copyTxHash}
              className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Carbon Minted</p>
            <p className="text-white font-medium">{carbonBalance.toFixed(2)} tCO₂</p>
          </div>
          <div>
            <p className="text-gray-500">Value</p>
            <p className="text-emerald-400 font-medium">${carbonValueUsd.toFixed(2)}</p>
          </div>
        </div>

        <a
          href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full py-2 rounded-lg bg-violet-500/20 text-violet-400 text-sm flex items-center justify-center gap-2 hover:bg-violet-500/30 transition"
        >
          View on Solana Explorer
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
          <Coins className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-white font-medium">Mint Proof of Audit</h3>
          <p className="text-sm text-gray-500">Tokenize your carbon credits on Solana</p>
        </div>
      </div>

      {/* Minting Summary */}
      <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Carbon Balance</p>
            <p className="text-white font-medium">{carbonBalance.toFixed(2)} tCO₂</p>
          </div>
          <div>
            <p className="text-gray-500">Mint Value</p>
            <p className="text-emerald-400 font-medium">${carbonValueUsd.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Wallet Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Solana Wallet Address
        </label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter your Solana wallet address"
          className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-gray-800 text-white placeholder-gray-600 focus:border-violet-500 outline-none font-mono text-sm"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Mint Button */}
      <button
        onClick={handleMint}
        disabled={loading || carbonBalance <= 0}
        className={cn(
          "w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition",
          loading || carbonBalance <= 0
            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Minting on Solana...
          </>
        ) : (
          <>
            <Coins className="w-5 h-5" />
            Mint Proof of Audit
          </>
        )}
      </button>

      {/* Info Banner */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <Shield className="w-3 h-3" />
        <span>Secured by Solana blockchain • Program ID: CArbonCred1t...111</span>
      </div>
    </div>
  );
}
