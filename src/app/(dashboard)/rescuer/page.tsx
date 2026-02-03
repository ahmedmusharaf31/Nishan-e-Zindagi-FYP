'use client';

import { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/auth';
import { DynamicMapView, DeviceMarkers } from '@/components/map';
import { AlertList } from '@/components/alerts';
import { StatsCard } from '@/components/dashboard';
import { useDeviceStore, useAlertStore, useCampaignStore } from '@/store';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, Device } from '@/types';
import {
  Radio,
  Bell,
  Megaphone,
  MapPin,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RescuerDashboardPage() {
  const { userProfile } = useAuth();
  const { devices, fetchDevices } = useDeviceStore();
  const { alerts, fetchAlerts, acknowledgeAlert, resolveAlert } = useAlertStore();
  const { getActiveCampaigns, getCampaignsByRescuer } = useCampaignStore();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.3753, 69.3451]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDevices(), fetchAlerts()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchDevices, fetchAlerts]);

  // Calculate stats
  const onlineDevices = devices.filter((d) => d.status === 'online');
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const activeCampaigns = getActiveCampaigns();
  const myCampaigns = getCampaignsByRescuer(userProfile?.id || '');

  // Handle alert acknowledgment
  const handleAcknowledge = async (alertId: string) => {
    if (userProfile) {
      await acknowledgeAlert(alertId, userProfile.displayName);
    }
  };

  // Handle alert resolution
  const handleResolve = async (alertId: string) => {
    await resolveAlert(alertId);
  };

  // Handle view on map - center map on the device's location
  const handleViewOnMap = (alert: Alert) => {
    const device = devices.find((d) => d.id === alert.deviceId);
    if (device) {
      setMapCenter([device.location.latitude, device.location.longitude]);
      setSelectedDevice(device);
    }
  };

  // Handle device click on map
  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchDevices(), fetchAlerts()]);
    setIsLoading(false);
  };

  return (
    <RoleGuard allowedRoles={['rescuer', 'admin']} fallbackUrl="/public">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Rescuer Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor devices and respond to alerts
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Online Devices"
            value={onlineDevices.length}
            description={`${devices.length} total devices`}
            icon={Radio}
          />
          <StatsCard
            title="Active Alerts"
            value={activeAlerts.length}
            description={`${activeAlerts.filter((a) => a.severity === 'critical').length} critical`}
            icon={Bell}
          />
          <StatsCard
            title="Active Campaigns"
            value={activeCampaigns.length}
            description="Ongoing rescue operations"
            icon={Megaphone}
          />
          <StatsCard
            title="My Campaigns"
            value={myCampaigns.length}
            description="Assigned to you"
            icon={MapPin}
          />
        </div>

        {/* Main Content - Map and Alerts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map Section */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Device Locations
                </CardTitle>
                {selectedDevice && (
                  <Badge variant="secondary" className="text-xs">
                    Selected: {selectedDevice.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DynamicMapView
                center={mapCenter}
                zoom={7}
                className="h-[500px] w-full rounded-lg overflow-hidden"
              >
                <DeviceMarkers
                  devices={devices}
                  onDeviceClick={handleDeviceClick}
                />
              </DynamicMapView>
            </CardContent>
          </Card>

          {/* Alerts Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertList
                alerts={alerts}
                devices={devices}
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
                onViewOnMap={handleViewOnMap}
                maxHeight="450px"
                showFilters={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
