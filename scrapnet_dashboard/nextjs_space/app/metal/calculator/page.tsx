import { Metadata } from 'next';
import MetalCalculatorForm from '@/components/metal-calculator-form';

export const metadata: Metadata = {
  title: 'Metal Carbon Calculator | Bedrock ESG',
  description: 'Calculate avoided CO2 emissions from metal recycling operations.',
};

export default function MetalCalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Metal Avoided Emissions Calculator</h1>
        <p className="text-muted-foreground mt-1">
          Calculate the CO₂ emissions avoided by recycling metal instead of using virgin material.
          Based on World Steel Association and IAI emission factors.
        </p>
      </div>
      <MetalCalculatorForm />
    </div>
  );
}
