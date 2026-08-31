'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { cn } from '@/lib/utils';
import {
  Coins,
  Wallet,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Zap,
} from 'lucide-react';

// Solana Memo Program ID
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export interface AuditProofData {
  userId: string;
  auditType: 'CARBON_CREDIT' | 'LEGACY_AUDIT' | 'RE_HOSPITALITY';
  carbonAmount: number;
  valueUsd: number;
  metadata?: Record<string, any>;
}

interface MintProofButtonProps {
  auditData: AuditProofData;
  onMintSuccess?: (txSignature: string, blockHeight: number) => void;
  onMintError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * MintProofButton Component
 * 
 * Uses @solana/web3.js to construct and submit a transaction
 * that saves the Audit proof on-chain using the Memo program.
 */
export default function MintProofButton({
  auditData,
  onMintSuccess,
  onMintError,
  className,
  disabled = false,
}: MintProofButtonProps) {
  const { publicKey, signTransaction, connected, connecting } = useWallet();
  const { connection } = useConnection();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState('');
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Build the audit proof memo data
   */
  const buildMemoData = useCallback((): string => {
    const proofData = {
      type: 'BEDROCK_ESG_AUDIT_PROOF',
      version: '2.0',
      auditType: auditData.auditType,
      carbonAmount: auditData.carbonAmount,
      valueUsd: auditData.valueUsd,
      timestamp: new Date().toISOString(),
      userId: auditData.userId.substring(0, 8), // Truncated for privacy
      geniusActCompliant: true,
      universalLaw: 'Dynamic BPS (Σ = 10,000)',
      ...(auditData.metadata || {}),
    };
    return JSON.stringify(proofData);
  }, [auditData]);

  /**
   * Construct and send the Solana transaction
   */
  const mintProofOnChain = useCallback(async () => {
    if (!publicKey || !signTransaction || !connected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Build the memo data
      const memoData = buildMemoData();
      console.log('[MintProof] Memo data:', memoData);

      // 2. Create the Memo instruction
      const memoInstruction = new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoData, 'utf-8'),
      });

      // 3. Create transaction
      const transaction = new Transaction();
      transaction.add(memoInstruction);

      // 4. Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('[MintProof] Transaction built, requesting signature...');

      // 5. Sign the transaction
      const signedTransaction = await signTransaction(transaction);

      console.log('[MintProof] Transaction signed, sending...');

      // 6. Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      console.log('[MintProof] Transaction sent:', signature);

      // 7. Confirm the transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      // 8. Get the slot/block height
      const slot = await connection.getSlot('confirmed');

      console.log('[MintProof] Transaction confirmed at slot:', slot);

      // 9. Save to database via API
      const saveResponse = await fetch('/api/solana/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auditData.userId,
          walletAddress: publicKey.toBase58(),
          auditType: auditData.auditType,
          carbonAmount: auditData.carbonAmount,
          valueUsd: auditData.valueUsd,
          metadata: {
            ...auditData.metadata,
            onChainSignature: signature,
            memoData: memoData,
            confirmedSlot: slot,
            mintedAt: new Date().toISOString(),
          },
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        console.warn('[MintProof] Failed to save to database:', saveData.error);
        // Continue anyway - the on-chain proof exists
      }

      // 10. Update state
      setTxSignature(signature);
      setBlockHeight(slot);
      setSuccess(true);
      onMintSuccess?.(signature, slot);

    } catch (err: any) {
      console.error('[MintProof] Error:', err);
      const errorMessage = err.message || 'Failed to mint proof on-chain';
      setError(errorMessage);
      onMintError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, connected, connection, auditData, buildMemoData, onMintSuccess, onMintError]);

  const copySignature = () => {
    navigator.clipboard.writeText(txSignature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateSignature = (sig: string) => {
    return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="animate-pulse bg-slate-700 rounded-xl h-24 w-full" />
    );
  }

  // Success state
  if (success && txSignature) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Proof Minted On-Chain!</h4>
            <p className="text-sm text-emerald-400">Transaction confirmed on Solana Devnet</p>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Signature</span>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-cyan-400">
                {truncateSignature(txSignature)}
              </code>
              <button
                onClick={copySignature}
                className="p-1.5 hover:bg-slate-700 rounded transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {blockHeight && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Slot</span>
              <span className="text-sm font-mono text-slate-300">{blockHeight.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Carbon Amount</span>
            <span className="text-sm font-semibold text-white">
              {auditData.carbonAmount.toFixed(4)} tonnes CO₂
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Value</span>
            <span className="text-sm font-semibold text-emerald-400">
              ${auditData.valueUsd.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Explorer Link */}
        <a
          href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View on Solana Explorer
        </a>
      </div>
    );
  }

  // Wallet not connected
  if (!connected) {
    return (
      <div className={cn(
        "bg-slate-800/50 border border-slate-700 rounded-xl p-5",
        className
      )}>
        <div className="flex items-center gap-3 mb-3">
          <Wallet className="w-5 h-5 text-amber-400" />
          <span className="text-sm text-slate-400">Wallet not connected</span>
        </div>
        <p className="text-sm text-slate-500">
          Connect your Solana wallet above to mint your Proof of Audit on-chain.
        </p>
      </div>
    );
  }

  // Main mint button
  return (
    <div className={cn("space-y-4", className)}>
      {/* Proof Preview */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Proof of Audit Preview</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Type</span>
            <p className="text-white font-medium">{auditData.auditType.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-slate-500">Carbon</span>
            <p className="text-emerald-400 font-medium">{auditData.carbonAmount.toFixed(4)} t</p>
          </div>
          <div>
            <span className="text-slate-500">Value</span>
            <p className="text-cyan-400 font-medium">${auditData.valueUsd.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-slate-500">Network</span>
            <p className="text-amber-400 font-medium">Devnet</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Mint Button */}
      <button
        onClick={mintProofOnChain}
        disabled={loading || disabled || connecting}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold transition-all duration-200",
          loading || disabled
            ? "bg-slate-700 text-slate-500 cursor-not-allowed"
            : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Minting On-Chain...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>Mint Proof of Audit</span>
            <Coins className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Info Text */}
      <p className="text-xs text-slate-500 text-center">
        This will create an immutable on-chain record using the Solana Memo program.
        Transaction fees apply (~0.000005 SOL).
      </p>
    </div>
  );
}
