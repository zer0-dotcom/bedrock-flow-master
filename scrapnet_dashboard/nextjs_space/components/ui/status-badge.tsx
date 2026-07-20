import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error';
  label: string;
}

const statusConfig = {
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    icon: AlertCircle,
  },
  error: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    icon: XCircle,
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status ?? 'success'] ?? statusConfig.success;
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
      config.bg,
      config.text
    )}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
