import { Metadata } from 'next';
import VaultSettingsContent from '@/components/vault-settings-content';

export const metadata: Metadata = {
  title: 'Settings | Bedrock ESG Sovereign Ledger',
  description: 'Manage your profile and preferences.',
};

export default function VaultSettingsPage() {
  return <VaultSettingsContent />;
}
