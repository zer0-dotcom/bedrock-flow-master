import { Metadata } from 'next';
import VaultCommunityContent from '@/components/vault-community-content';

export const metadata: Metadata = {
  title: 'Community Credits | Bedrock ESG Sovereign Ledger',
  description: 'View the 10% public overflow distribution to communities in need.',
};

export default function VaultCommunityPage() {
  return <VaultCommunityContent />;
}
