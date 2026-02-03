'use client';

import { Campaign, CampaignStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import {
  PlayCircle,
  UserCheck,
  Car,
  MapPin,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  ChevronRight,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Status configuration with colors and icons
const statusConfig: Record<
  CampaignStatus,
  { color: string; bgColor: string; icon: typeof PlayCircle; label: string }
> = {
  initiated: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: PlayCircle,
    label: 'Initiated',
  },
  assigned: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: UserCheck,
    label: 'Assigned',
  },
  accepted: {
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    icon: CheckCircle,
    label: 'Accepted',
  },
  en_route: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: Car,
    label: 'En Route',
  },
  on_scene: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: MapPin,
    label: 'On Scene',
  },
  in_progress: {
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: Activity,
    label: 'In Progress',
  },
  resolved: {
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircle,
    label: 'Resolved',
  },
  cancelled: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    icon: XCircle,
    label: 'Cancelled',
  },
};

interface CampaignCardProps {
  campaign: Campaign;
  rescuerName?: string;
  onViewDetails?: (campaign: Campaign) => void;
  onStatusChange?: (campaignId: string, newStatus: CampaignStatus) => void;
  onAssign?: (campaign: Campaign) => void;
  showActions?: boolean;
  compact?: boolean;
  isAssignedToMe?: boolean;
}

export function CampaignCard({
  campaign,
  rescuerName,
  onViewDetails,
  onStatusChange,
  onAssign,
  showActions = true,
  compact = false,
  isAssignedToMe = false,
}: CampaignCardProps) {
  const status = statusConfig[campaign.status];
  const StatusIcon = status.icon;
  const isActive = !['resolved', 'cancelled'].includes(campaign.status);

  // Get the next available status transitions
  const getNextStatus = (): CampaignStatus | null => {
    const transitions: Partial<Record<CampaignStatus, CampaignStatus>> = {
      assigned: 'accepted',
      accepted: 'en_route',
      en_route: 'on_scene',
      on_scene: 'in_progress',
      in_progress: 'resolved',
    };
    return transitions[campaign.status] || null;
  };

  const nextStatus = getNextStatus();

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer',
        !isActive && 'opacity-60',
        isAssignedToMe && isActive && 'ring-2 ring-primary/50'
      )}
      onClick={() => onViewDetails?.(campaign)}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className={cn('p-2 rounded-lg', status.bgColor)}>
            <StatusIcon className={cn('w-5 h-5', status.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm">
                Campaign #{campaign.id.slice(-6).toUpperCase()}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant={isActive ? 'default' : 'outline'}
                  className={cn('text-xs', status.color)}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse mr-1" />
                  )}
                  {status.label}
                </Badge>
                {isAssignedToMe && (
                  <Badge variant="secondary" className="text-xs">
                    Mine
                  </Badge>
                )}
              </div>
            </div>

            {/* Location */}
            {!compact && (
              <p className="text-sm text-muted-foreground mb-2">
                <MapPin className="w-3 h-3 inline mr-1" />
                {campaign.location.latitude.toFixed(4)}, {campaign.location.longitude.toFixed(4)}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {rescuerName && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {rescuerName}
                </span>
              )}
              {!rescuerName && campaign.status === 'initiated' && (
                <span className="flex items-center gap-1 text-amber-600">
                  <User className="w-3 h-3" />
                  Unassigned
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(campaign.createdAt)}
              </span>
              {campaign.notes.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {campaign.notes.length} note{campaign.notes.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Actions */}
            {showActions && !compact && isActive && (
              <div
                className="flex items-center gap-2 mt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {campaign.status === 'initiated' && onAssign && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAssign(campaign)}
                  >
                    <UserCheck className="w-3 h-3 mr-1" />
                    Assign
                  </Button>
                )}
                {isAssignedToMe && nextStatus && onStatusChange && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onStatusChange(campaign.id, nextStatus)}
                  >
                    <ChevronRight className="w-3 h-3 mr-1" />
                    {statusConfig[nextStatus].label}
                  </Button>
                )}
                {isActive && onStatusChange && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onStatusChange(campaign.id, 'cancelled')}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export status config for use in other components
export { statusConfig };
