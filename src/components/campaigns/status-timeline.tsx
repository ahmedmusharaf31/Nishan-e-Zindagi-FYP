'use client';

import { CampaignStatusHistoryEntry, CampaignStatus } from '@/types';
import { formatDateTime } from '@/lib/utils';
import {
  PlayCircle,
  UserCheck,
  Car,
  MapPin,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Status configuration matching campaign-card
const statusConfig: Record<
  CampaignStatus,
  { color: string; bgColor: string; borderColor: string; icon: typeof PlayCircle; label: string }
> = {
  initiated: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-500',
    icon: PlayCircle,
    label: 'Initiated',
  },
  assigned: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-500',
    icon: UserCheck,
    label: 'Assigned',
  },
  accepted: {
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    borderColor: 'border-indigo-500',
    icon: CheckCircle,
    label: 'Accepted',
  },
  en_route: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-500',
    icon: Car,
    label: 'En Route',
  },
  on_scene: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-500',
    icon: MapPin,
    label: 'On Scene',
  },
  in_progress: {
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-500',
    icon: Activity,
    label: 'In Progress',
  },
  resolved: {
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-500',
    icon: CheckCircle,
    label: 'Resolved',
  },
  cancelled: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-500',
    icon: XCircle,
    label: 'Cancelled',
  },
};

interface StatusTimelineProps {
  history: CampaignStatusHistoryEntry[];
  className?: string;
}

export function StatusTimeline({ history, className }: StatusTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No status history available
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {history.map((entry, index) => {
        const config = statusConfig[entry.status];
        const StatusIcon = config.icon;
        const isLast = index === history.length - 1;

        return (
          <div key={`${entry.status}-${entry.timestamp}`} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[15px] top-8 w-0.5 h-full -translate-x-1/2',
                  config.bgColor
                )}
              />
            )}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2',
                config.bgColor,
                config.borderColor
              )}
            >
              <StatusIcon className={cn('w-4 h-4', config.color)} />
            </div>

            {/* Content */}
            <div className={cn('pb-6 flex-1', isLast && 'pb-0')}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('font-medium text-sm', config.color)}>
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>
              {entry.note && (
                <p className="text-sm text-muted-foreground">{entry.note}</p>
              )}
              {entry.updatedBy && (
                <p className="text-xs text-muted-foreground mt-1">
                  by {entry.updatedBy}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
