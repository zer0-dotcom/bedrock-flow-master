import { Metadata } from 'next';
import GlobalLedgerContent from '@/components/global-ledger-content';

export const metadata: Metadata = {
  title: 'Global Impact Ledger | Bedrock ESG',
  description: 'Real-time transparency into global currency digitization, CO2 avoided, and verified destruction proofs.',
};

export default function GlobalLedgerPage() {
  return <GlobalLedgerContent />;
}
