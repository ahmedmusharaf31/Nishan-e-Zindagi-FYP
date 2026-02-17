'use client';

import { useState, useMemo } from 'react';
import { Alert, AlertSeverity, AlertStatus, Device } from '@/types';
import { AlertCard } from './alert-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertListProps {
  alerts: Alert[];
  devices: Device[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onViewOnMap?: (alert: Alert) => void;
  maxHeight?: string;
  showFilters?: boolean;
  compact?: boolean;
}

export function AlertList({
  alerts,
  devices,
  onAcknowledge,
  onResolve,
  onViewOnMap,
  maxHeight = '600px',
  showFilters = true,
  compact = false,
}: AlertListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');

  // Create device lookup map
  const deviceMap = useMemo(() => {
    return devices.reduce((acc, device) => {
      acc[device.id] = device;
      return acc;
    }, {} as Record<string, Device>);
  }, [devices]);

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const device = deviceMap[alert.deviceId];
        const matchesTitle = alert.title.toLowerCase().includes(query);
        const matchesDevice = device?.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDevice) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && alert.status !== statusFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && alert.severity !== severityFilter) {
        return false;
      }

      return true;
    });
  }, [alerts, searchQuery, statusFilter, severityFilter, deviceMap]);

  // Count alerts by status
  const alertCounts = useMemo(() => {
    return {
      total: alerts.length,
      active: alerts.filter((a) => a.status === 'active').length,
      acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
      resolved: alerts.filter((a) => a.status === 'resolved').length,
      critical: alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length,
    };
  }, [alerts]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with counts */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">Alerts</h2>
          {alertCounts.active > 0 && (
            <Badge variant="destructive" className="text-xs">
              {alertCounts.active} Active
            </Badge>
          )}
          {alertCounts.critical > 0 && (
            <Badge variant="destructive" className="text-xs bg-red-600">
              {alertCounts.critical} Critical
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={cn("gap-2 mb-4", compact ? "flex flex-col" : "flex flex-col sm:flex-row")}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("pl-9", compact && "h-8 text-sm")}
            />
          </div>
          <div className={cn("flex gap-2", compact && "flex-col")}>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as AlertStatus | 'all')}
            >
              <SelectTrigger className={cn(compact ? "w-full h-8 text-sm" : "w-[140px]")}>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={severityFilter}
              onValueChange={(value) => setSeverityFilter(value as AlertSeverity | 'all')}
            >
              <SelectTrigger className={cn(compact ? "w-full h-8 text-sm" : "w-[140px]")}>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Alert List */}
      <ScrollArea style={{ maxHeight }} className="flex-1">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BellOff className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No alerts found</p>
            {(searchQuery || statusFilter !== 'all' || severityFilter !== 'all') && (
              <p className="text-xs mt-1">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 pr-4">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                deviceName={deviceMap[alert.deviceId]?.name}
                onAcknowledge={onAcknowledge}
                onResolve={onResolve}
                onViewOnMap={onViewOnMap}
                compact={compact}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer with summary */}
      {filteredAlerts.length > 0 && (
        <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>
      )}
    </div>
  );
}
