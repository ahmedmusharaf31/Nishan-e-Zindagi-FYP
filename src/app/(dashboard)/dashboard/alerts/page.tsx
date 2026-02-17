'use client';

import { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/auth';
import { AlertList } from '@/components/alerts';
import { useAlertStore, useDeviceStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RefreshCcw, Bell, ShieldAlert, AlertTriangle, CheckCircle, HeartPulse } from 'lucide-react';
import { Alert } from '@/types';

export default function DashboardAlertsPage() {
  const { alerts, fetchAlerts, acknowledgeAlert, resolveAlert } = useAlertStore();
  const { devices, fetchDevices } = useDeviceStore();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingResolve, setPendingResolve] = useState<Alert | null>(null);
  const [survivorCount, setSurvivorCount] = useState('1');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchAlerts(), fetchDevices()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchAlerts, fetchDevices]);

  const handleResolve = (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (alert?.type === 'manual_report') {
      setSurvivorCount('1');
      setPendingResolve(alert);
    } else {
      resolveAlert(id);
    }
  };

  const handleConfirmResolve = async () => {
    if (!pendingResolve) return;
    const count = parseInt(survivorCount, 10);
    await resolveAlert(pendingResolve.id, isNaN(count) || count < 0 ? 0 : count);
    setPendingResolve(null);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchAlerts(), fetchDevices()]);
    setIsLoading(false);
  };

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;

  return (
    <RoleGuard allowedRoles={['admin', 'rescuer']} fallbackUrl="/public">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Alert Management
            </h1>
            <p className="text-muted-foreground">
              Monitor, acknowledge, and resolve alerts across all devices
            </p>
          </div>
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

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                  <p className="text-sm text-muted-foreground">Critical Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">{activeCount}</div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{acknowledgedCount}</div>
                  <p className="text-sm text-muted-foreground">Acknowledged Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
                  <p className="text-sm text-muted-foreground">Resolved Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Alerts</CardTitle>
              <Badge variant="secondary">{alerts.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(100vh-360px)]">
            <AlertList
              alerts={alerts}
              devices={devices}
              onAcknowledge={(id) => acknowledgeAlert(id, 'current-user')}
              onResolve={handleResolve}
              maxHeight="9999px"
            />
          </CardContent>
        </Card>
      </div>
      {/* Survivors rescued dialog for manual_report alerts */}
      <Dialog open={!!pendingResolve} onOpenChange={(open) => { if (!open) setPendingResolve(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-purple-600" />
              Rescue Confirmed
            </DialogTitle>
            <DialogDescription>
              {pendingResolve?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="survivor-count">How many people were rescued at this location?</Label>
            <Input
              id="survivor-count"
              type="number"
              min="0"
              value={survivorCount}
              onChange={(e) => setSurvivorCount(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingResolve(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmResolve} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Confirm &amp; Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
