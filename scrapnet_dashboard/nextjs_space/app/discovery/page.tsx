import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import DiscoveryDashboard from '@/components/discovery-dashboard';

export default function DiscoveryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <DiscoveryDashboard />
    </Suspense>
  );
}
