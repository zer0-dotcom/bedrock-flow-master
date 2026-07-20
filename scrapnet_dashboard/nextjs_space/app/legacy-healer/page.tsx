import { Metadata } from 'next';
import LegacyHealerContent from '@/components/legacy-healer-content';

export const metadata: Metadata = {
  title: 'Legacy Healer | Temporal Carbon Auditor',
  description: 'Reclaim your stolen frequency. Convert historical low-carbon living into Legacy Carbon Equity through the Sovereign Frequency Ledger.',
};

export default function LegacyHealerPage() {
  return <LegacyHealerContent />;
}
