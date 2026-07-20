import { Metadata } from 'next';
import ImpactEngineContent from '@/components/impact-engine-content';

export const metadata: Metadata = {
  title: 'Financed Emissions Impact Engine | Bedrock ESG',
  description: 'Track digital trade footprints, portfolio carbon intensity, and neutralize emissions with the ZerO Offset Protocol.',
};

export default function ImpactPage() {
  return <ImpactEngineContent />;
}
