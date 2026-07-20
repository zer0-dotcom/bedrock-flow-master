import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ProjectsContent from '@/components/projects-content';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projects Dashboard</h1>
        <p className="text-muted-foreground">
          View and manage all saved carbon footprint calculations
        </p>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <ProjectsContent />
      </Suspense>
    </div>
  );
}
