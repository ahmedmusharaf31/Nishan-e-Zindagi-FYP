'use client';

import { Alert, AlertSeverity, AlertStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  CheckCircle,
  Clock,
  MapPin,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Severity configuration
const severityConfig: Record<
  AlertSeverity,
  { color: string; bgColor: string; icon: typeof AlertTriangle; label: string }
> = {
  low: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: Info,
    label: 'Low',
  },
  medium: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: AlertCircle,
    label: 'Medium',
  },
  high: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: AlertTriangle,
    label: 'High',
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertOctagon,
    label: 'Critical',
  },
};

// Status configuration
const statusConfig: Record<AlertStatus, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
  active: { variant: 'default', label: 'Active' },
  acknowledged: { variant: 'secondary', label: 'Acknowledged' },
  resolved: { variant: 'outline', label: 'Resolved' },
};

interface AlertCardProps {
  alert: Alert;
  deviceName?: string;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onViewOnMap?: (alert: Alert) => void;
  compact?: boolean;
}

export function AlertCard({
  alert,
  deviceName,
  onAcknowledge,
  onResolve,
  onViewOnMap,
  compact = false,
}: AlertCardProps) {
  const severity = severityConfig[alert.severity];
  const status = statusConfig[alert.status];
  const SeverityIcon = severity.icon;

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        alert.status === 'resolved' && 'opacity-60',
        alert.severity === 'critical' && alert.status === 'active' && 'ring-2 ring-red-500/50'
      )}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start gap-3">
          {/* Severity Icon */}
          <div className={cn('p-2 rounded-lg', severity.bgColor)}>
            <SeverityIcon className={cn('w-5 h-5', severity.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{alert.title}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant={status.variant}
                  className="text-xs"
                >
                  {alert.status === 'active' ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                      {status.label}
                    </span>
                  ) : alert.status === 'acknowledged' ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {status.label}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {status.label}
                    </span>
                  )}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-xs', severity.color)}
                >
                  {severity.label}
                </Badge>
              </div>
            </div>

            {/* Description */}
            {alert.description && !compact && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {alert.description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {deviceName && (
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  {deviceName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(alert.triggeredAt)}
              </span>
            </div>

            {/* Actions */}
            {!compact && alert.status !== 'resolved' && (
              <div className="flex items-center gap-2 mt-3">
                {alert.status === 'active' && onAcknowledge && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAcknowledge(alert.id)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Acknowledge
                  </Button>
                )}
                {alert.status === 'acknowledged' && onResolve && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onResolve(alert.id)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolve
                  </Button>
                )}
                {onViewOnMap && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewOnMap(alert)}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    View on Map
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
