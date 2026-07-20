import { Metadata } from 'next';
import VaultHistoryContent from '@/components/vault-history-content';

export const metadata: Metadata = {
  title: 'Ledger History | Bedrock ESG Sovereign Ledger',
  description: 'View your complete transaction history and carbon settlements.',
};

export default function VaultHistoryPage() {
  return <VaultHistoryContent />;
}
