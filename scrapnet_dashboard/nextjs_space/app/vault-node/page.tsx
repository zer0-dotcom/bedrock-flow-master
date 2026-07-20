import { Metadata } from 'next';
import VaultNodeDashboard from '@/components/vault-node-dashboard';

export const metadata: Metadata = {
  title: 'Verification Repository | Bedrock ESG',
  description: 'Secure currency and precious metal verification with AI-powered authentication and cryptographic destruction proof.',
};

export default function VaultNodePage() {
  return <VaultNodeDashboard />;
}
