import BiocharCalculatorForm from '@/components/biochar-calculator-form';

export const metadata = {
  title: 'Biochar CDR Calculator | Bedrock ESG',
  description: 'Calculate Carbon Dioxide Removal credits for biochar production',
};

export default function BiocharCalculatorPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Biochar CDR Calculator
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Calculate Carbon Dioxide Removal credits based on biomass feedstock and biochar stability.
          Compliant with Hedera Guardian Framework for permanence and traceability.
        </p>
      </div>
      <BiocharCalculatorForm />
    </div>
  );
}
