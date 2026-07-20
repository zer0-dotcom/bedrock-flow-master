import CreditsContent from '@/components/credits-content';

export const metadata = {
  title: 'Farmer Credits | Bedrock ESG',
  description: 'Manage and issue green credits to farmers',
};

export default function CreditsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Farmer Credits
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Track, issue, and manage green credits earned by farmers for their feedstock contributions.
          Credits can be tokenized on Polygon blockchain.
        </p>
      </div>
      <CreditsContent />
    </div>
  );
}
