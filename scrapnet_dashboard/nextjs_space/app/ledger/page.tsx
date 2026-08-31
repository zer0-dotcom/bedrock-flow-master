import { Metadata } from 'next';
import LedgerContent from '@/components/ledger-content';

export const metadata: Metadata = {
  title: 'Universal Ledger | Bedrock ESG Global Ledger',
  description: 'Lead Actuary & Liquidity Architect. Transform Invisible Debt into Liquid Overflow with the Dynamic BPS Universal Law.',
};

export default function LedgerPage() {
  return <LedgerContent />;
}
