import { Metadata } from 'next';
import PersonalVaultContent from '@/components/personal-vault-content';

export const metadata: Metadata = {
  title: 'Personal Repository | Bedrock ESG Sovereign Ledger',
  description: 'Your sovereign frequency dashboard - view your vibrational carbon balance, historical audit progress, and ledger equity.',
};

export default function VaultPage() {
  return <PersonalVaultContent />;
}
