import FarmersContent from '@/components/farmers-content';

export const metadata = {
  title: 'Farmers | Bedrock ESG',
  description: 'Manage farmers providing feedstock for biochar production',
};

export default function FarmersPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Farmer Management
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Register and manage farmers who provide feedstock for soil sterilization and biochar production.
          Track their contributions and green credit earnings.
        </p>
      </div>
      <FarmersContent />
    </div>
  );
}
