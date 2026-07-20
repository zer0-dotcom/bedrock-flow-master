import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import AnalyticsContent from '@/components/analytics-content';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track carbon savings, RAP usage trends, and fleet-wide performance metrics
        </p>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
