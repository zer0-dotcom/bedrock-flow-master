import CalculatorForm from '@/components/calculator-form';

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Carbon Calculator</h1>
        <p className="text-muted-foreground">
          Calculate carbon footprint for your asphalt projects using our AI-powered workflow
        </p>
      </div>
      <CalculatorForm />
    </div>
  );
}
