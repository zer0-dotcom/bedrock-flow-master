import BiocharBatchesContent from '@/components/biochar-batches-content';

export const metadata = {
  title: 'Biochar Batches | Bedrock ESG',
  description: 'View and manage biochar production batches',
};

export default function BiocharBatchesPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Biochar Batches
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Track all biochar production batches with CDR credits, stability metrics, and Hedera Guardian compliance.
        </p>
      </div>
      <BiocharBatchesContent />
    </div>
  );
}
