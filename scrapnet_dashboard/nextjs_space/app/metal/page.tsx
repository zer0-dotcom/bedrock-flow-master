import { Metadata } from 'next';
import MetalDashboard from '@/components/metal-dashboard';

export const metadata: Metadata = {
  title: 'Metal Recovery Dashboard | Bedrock ESG',
  description: 'Track avoided CO2 emissions from metal recycling and recovery operations.',
};

export default function MetalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Metal Recovery Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track avoided CO₂ emissions from recycling metals instead of virgin production.
          Each tonne of steel recycled avoids 1.89 tonnes of CO₂ emissions.
        </p>
      </div>
      <MetalDashboard />
    </div>
  );
}
