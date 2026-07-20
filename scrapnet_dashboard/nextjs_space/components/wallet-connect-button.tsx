'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WalletConnectButton() {
  const { publicKey, connected, connecting, disconnecting } = useWallet();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="animate-pulse bg-slate-700 rounded-lg h-12 w-48" />
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Multi Button */}
      <div className="wallet-adapter-button-wrapper">
        <WalletMultiButton className="!bg-gradient-to-r !from-violet-600 !to-purple-600 hover:!from-violet-500 hover:!to-purple-500 !rounded-lg !h-12 !font-semibold !transition-all !duration-200" />
      </div>

      {/* Connection Status & Public Key Display */}
      {connected && publicKey && (
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl p-4 space-y-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-emerald-400">Wallet Connected</span>
          </div>

          {/* Public Key */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Public Key</p>
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-3">
              <Wallet className="h-4 w-4 text-violet-400 flex-shrink-0" />
              <code className="text-sm text-slate-200 font-mono flex-1 truncate">
                {truncateAddress(publicKey.toBase58())}
              </code>
              <button
                onClick={copyAddress}
                className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                title="Copy full address"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400 hover:text-slate-200" />
                )}
              </button>
              <a
                href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                title="View on Solana Explorer"
              >
                <ExternalLink className="h-4 w-4 text-slate-400 hover:text-slate-200" />
              </a>
            </div>
            <p className="text-xs text-slate-500">Network: Devnet</p>
          </div>
        </div>
      )}

      {/* Connecting/Disconnecting States */}
      {connecting && (
        <div className="flex items-center gap-2 text-amber-400">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm">Connecting...</span>
        </div>
      )}
      {disconnecting && (
        <div className="flex items-center gap-2 text-rose-400">
          <div className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-sm">Disconnecting...</span>
        </div>
      )}

      {/* Not Connected State */}
      {!connected && !connecting && (
        <p className="text-sm text-slate-500">
          Connect your Solana wallet to access your Personal Vault
        </p>
      )}
    </div>
  );
}
