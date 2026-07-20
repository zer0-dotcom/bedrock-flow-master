import { Metadata } from 'next';
import MetalLogsContent from '@/components/metal-logs-content';

export const metadata: Metadata = {
  title: 'Metal Recovery Logs | Bedrock ESG',
  description: 'View and manage metal recovery operation logs.',
};

export default function MetalLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Metal Recovery Logs</h1>
        <p className="text-muted-foreground mt-1">
          Track all metal recovery operations and their associated avoided emissions.
        </p>
      </div>
      <MetalLogsContent />
    </div>
  );
}
