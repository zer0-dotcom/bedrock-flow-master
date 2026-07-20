import { Suspense } from 'react';
import AdminClient from './admin-client';

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    }>
      <AdminClient />
    </Suspense>
  );
}
