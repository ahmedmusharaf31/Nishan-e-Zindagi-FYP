'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { RoleGuard } from '@/components/auth';
import { AlertCard } from '@/components/alerts';
import { useAlertStore, useDeviceStore } from '@/store';
import { useWebSocket } from '@/providers/websocket-provider';
import { AlertSeverity, AlertStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Search,
  RefreshCcw,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function PublicAlertsPage() {
  const { alerts, fetchAlerts } = useAlertStore();
  const { devices, fetchDevices } = useDeviceStore();
  const { isConnected } = useWebSocket();

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('active');

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchAlerts(), fetchDevices()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchAlerts, fetchDevices]);

  // Get device name helper
  const getDeviceName = useCallback((deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    return device?.name;
  }, [devices]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter((a) => a.severity === severityFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query) ||
          getDeviceName(a.deviceId)?.toLowerCase().includes(query)
      );
    }

    // Sort by triggered date (newest first)
    return [...filtered].sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }, [alerts, statusFilter, severityFilter, searchQuery, getDeviceName]);

  // Stats
  const stats = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter((a) => a.status === 'active').length,
    critical: alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length,
    high: alerts.filter((a) => a.severity === 'high' && a.status === 'active').length,
  }), [alerts]);

  // Refresh data
  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchAlerts(), fetchDevices()]);
    setIsLoading(false);
  };

  return (
    <RoleGuard allowedRoles={['public', 'rescuer', 'admin']} fallbackUrl="/login">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Public Alerts
            </h1>
            <p className="text-muted-foreground">
              View active alerts and emergency notifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5" />
                Live Updates
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Public View
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  You are viewing alerts in read-only mode. Contact a rescuer or administrator to respond to alerts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">{stats.active}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-sm text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as AlertStatus | 'all')}
                >
                  <SelectTrigger className="w-[130px]">
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
                  onValueChange={(v) => setSeverityFilter(v as AlertSeverity | 'all')}
                >
                  <SelectTrigger className="w-[130px]">
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
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alerts
              </CardTitle>
              <Badge variant="secondary">{filteredAlerts.length} alerts</Badge>
            </div>
            <CardDescription>
              Showing {filteredAlerts.length} of {alerts.length} total alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-550px)] min-h-[300px]">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-1">No alerts found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' || severityFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'There are no alerts at this time'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {filteredAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      deviceName={getDeviceName(alert.deviceId)}
                      compact={false}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
