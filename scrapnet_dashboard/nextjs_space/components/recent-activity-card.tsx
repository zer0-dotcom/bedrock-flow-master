'use client';

import { cn } from '@/lib/utils';
import { Activity, CheckCircle2, Clock, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import Link from 'next/link';

interface ActivityEntry {
  id: string;
  type: string;
  description: string;
  value: number;
  carbonSaved: number;
  status: 'verified' | 'pending' | 'processing';
  timestamp: string;
}

interface RecentActivityCardProps {
  activities: ActivityEntry[];
  showAll?: boolean;
}

const statusConfig = {
  verified: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    label: 'Verified'
  },
  pending: {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    label: 'Pending'
  },
  processing: {
    icon: Activity,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    label: 'Processing'
  }
};

export default function RecentActivityCard({ activities, showAll = false }: RecentActivityCardProps) {
  const displayActivities = showAll ? activities : activities.slice(0, 5);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-medium text-white">Recent Activity</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            <span>Private</span>
          </div>
          {!showAll && activities.length > 5 && (
            <Link 
              href="/vault/history"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              View All
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-800/50">
        {displayActivities.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Activity className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No activity yet</p>
            <p className="text-xs text-gray-600 mt-1">Start a Legacy Audit to begin</p>
          </div>
        ) : (
          displayActivities.map((activity) => {
            const status = statusConfig[activity.status];
            const StatusIcon = status.icon;
            
            return (
              <div 
                key={activity.id}
                className="px-6 py-4 hover:bg-[#0a0a0a] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                      status.bg
                    )}>
                      <StatusIcon className={cn("w-4 h-4", status.color)} />
                    </div>
                    
                    {/* Content */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {activity.type}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-600">
                          {activity.carbonSaved.toFixed(2)} tCO₂
                        </span>
                        <span className="text-xs text-gray-700">•</span>
                        <span className="text-xs text-gray-600">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Value */}
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      "text-sm font-medium",
                      activity.value >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {activity.value >= 0 ? '+' : ''}${Math.abs(activity.value).toFixed(2)}
                    </p>
                    <p className={cn("text-xs mt-0.5", status.color)}>
                      {status.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-800 bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              Showing {displayActivities.length} of {activities.length} entries
            </span>
            <span className="text-gray-600 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              End-to-End Encrypted
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
