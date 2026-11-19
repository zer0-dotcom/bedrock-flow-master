'use client';

import { useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
// Import directly from individual adapter packages to avoid WalletConnect dependencies
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaProviderProps {
  children: ReactNode;
}

export default function SolanaProvider({ children }: SolanaProviderProps) {
  // Network resolved from env; defaults to Mainnet unless explicitly 'devnet'
  const network =
    process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet'
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet;

  // Prefer an explicit RPC endpoint; fall back to the public cluster URL
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_RPC_ENDPOINT || clusterApiUrl(network),
    [network]
  );
  
  // Initialize wallet adapters (Phantom and Solflare are the most common)
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
