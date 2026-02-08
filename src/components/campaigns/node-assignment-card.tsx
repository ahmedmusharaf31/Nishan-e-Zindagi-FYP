'use client';

import { NodeAssignment, User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  UserCheck,
  HeartPulse,
  Radio,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';

const nodeStatusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  pending: { color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30', label: 'Pending' },
  assigned: { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Assigned' },
  in_progress: { color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', label: 'In Progress' },
  rescued: { color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Rescued' },
};

interface NodeAssignmentCardProps {
  node: NodeAssignment;
  deviceName?: string;
  rescuers?: User[];
  onAssignRescuers?: (node: NodeAssignment) => void;
  onMarkRescued?: (node: NodeAssignment) => void;
  showActions?: boolean;
}

export function NodeAssignmentCard({
  node,
  deviceName,
  rescuers = [],
  onAssignRescuers,
  onMarkRescued,
  showActions = true,
}: NodeAssignmentCardProps) {
  const status = nodeStatusConfig[node.status] || nodeStatusConfig.pending;
  const isRescued = node.status === 'rescued';

  return (
    <Card className={cn('transition-all', isRescued && 'opacity-75')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg flex-shrink-0', status.bgColor)}>
            {isRescued ? (
              <CheckCircle className={cn('w-5 h-5', status.color)} />
            ) : (
              <Radio className={cn('w-5 h-5', status.color)} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">
                {deviceName || node.deviceId}
              </h4>
              <Badge variant="outline" className={cn('text-xs flex-shrink-0', status.color)}>
                {status.label}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {node.location.latitude.toFixed(4)}, {node.location.longitude.toFixed(4)}
            </p>

            {/* Assigned rescuers */}
            {node.assignedRescuerIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {node.assignedRescuerIds.map(rid => {
                  const rescuer = rescuers.find(r => r.id === rid);
                  return (
                    <Badge key={rid} variant="secondary" className="text-xs">
                      {rescuer?.displayName || rid}
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Rescued info */}
            {isRescued && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded text-xs space-y-1">
                {node.survivorsFound !== undefined && (
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {node.survivorsFound} survivor{node.survivorsFound !== 1 ? 's' : ''} found
                  </p>
                )}
                {node.rescuedAt && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(node.rescuedAt)}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            {showActions && !isRescued && (
              <div className="flex gap-2 mt-3">
                {onAssignRescuers && (
                  <Button size="sm" variant="outline" onClick={() => onAssignRescuers(node)}>
                    <UserCheck className="w-3 h-3 mr-1" />
                    Assign
                  </Button>
                )}
                {onMarkRescued && (
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => onMarkRescued(node)}>
                    <HeartPulse className="w-3 h-3 mr-1" />
                    Mark Rescued
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
