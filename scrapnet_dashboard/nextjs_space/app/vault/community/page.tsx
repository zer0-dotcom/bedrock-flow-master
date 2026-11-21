import { Metadata } from 'next';
import VaultCommunityContent from '@/components/vault-community-content';

export const metadata: Metadata = {
  title: 'Community Credits | Bedrock ESG Sovereign Ledger',
  description: 'View community credit activity on the Bedrock ESG Sovereign Ledger.',
};

export default function VaultCommunityPage() {
  return <VaultCommunityContent />;
}
