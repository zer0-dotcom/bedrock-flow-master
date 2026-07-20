import { Metadata } from 'next';
import PublicCalculator from '@/components/public-calculator';

export const metadata: Metadata = {
  title: 'Bedrock ESG Public Impact Calculator',
  description: 'Calculate your carbon impact from recycling materials. See avoided emissions in real-time.',
};

export default function PublicCalculatorPage() {
  return <PublicCalculator />;
}
