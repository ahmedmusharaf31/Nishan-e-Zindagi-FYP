'use client';

import { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/auth';
import { DynamicMapView, DeviceMarkers } from '@/components/map';
import { AlertList } from '@/components/alerts';
import { StatsCard } from '@/components/dashboard';
import { CreateCampaignDialog } from '@/components/campaigns';
import { useDeviceStore, useAlertStore, useCampaignStore, useSensorStore } from '@/store';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, Device, SurvivorProbability } from '@/types';
import {
  Radio,
  Bell,
  Megaphone,
  MapPin,
  RefreshCcw,
  Wind,
  Thermometer,
  Droplets,
  Settings2,
  Target,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const probabilityColors: Record<SurvivorProbability, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  moderate: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  low: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  none: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const probabilityLabels: Record<SurvivorProbability, string> = {
  high: 'HIGH',
  moderate: 'MODERATE',
  low: 'LOW',
  none: 'NONE',
};

export default function RescuerDashboardPage() {
  const { userProfile } = useAuth();
  const { devices, fetchDevices } = useDeviceStore();
  const { alerts, fetchAlerts, acknowledgeAlert, resolveAlert } = useAlertStore();
  const { getActiveCampaigns, getCampaignsByRescuer } = useCampaignStore();
  const {
    thresholds,
    setCo2Threshold,
    getAllLatestReadings,
    getSurvivorProbability,
    getDeviceIdsWithHighProbability,
  } = useSensorStore();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.3753, 69.3451]);
  const [isLoading, setIsLoading] = useState(true);
  const [thresholdInput, setThresholdInput] = useState(String(thresholds.co2Threshold));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const isAdmin = userProfile?.role === 'admin';

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
  const latestReadings = getAllLatestReadings();
  const survivorSignalDevices = getDeviceIdsWithHighProbability();

  // Handle threshold change
  const handleThresholdChange = (value: string) => {
    setThresholdInput(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setCo2Threshold(num);
    }
  };

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

  // Handle view on map
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
              Monitor devices, sensor data, and respond to alerts
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Start Campaign
              </Button>
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
          <StatsCard
            title="Survivor Signals"
            value={survivorSignalDevices.length}
            description="Devices with CO2 above threshold"
            icon={Target}
          />
        </div>

        {/* Threshold Settings */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="w-5 h-5" />
              CO2 Threshold Settings
            </CardTitle>
            <CardDescription>
              Enter the ambient CO2 level of the surrounding area. Sensor readings above this threshold
              indicate potential survivor presence. Color coding: Red (&gt;1.5x) = HIGH, Orange (&gt;1.2x) = MODERATE, Yellow (&gt;1x) = LOW, Green = No survivor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="co2-threshold">Ambient CO2 Level (ppm)</Label>
                <Input
                  id="co2-threshold"
                  type="number"
                  min="100"
                  max="5000"
                  value={thresholdInput}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  className="w-[200px]"
                  placeholder="e.g. 800"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-red-500 text-white hover:bg-red-500">Red: &gt;{Math.round(thresholds.co2Threshold * 1.5)} ppm</Badge>
                <Badge className="bg-orange-500 text-white hover:bg-orange-500">Orange: &gt;{Math.round(thresholds.co2Threshold * 1.2)} ppm</Badge>
                <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">Yellow: &gt;{thresholds.co2Threshold} ppm</Badge>
                <Badge className="bg-green-500 text-white hover:bg-green-500">Green: &le;{thresholds.co2Threshold} ppm</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Map, Sensor Readings, and Alerts */}
        <div className="grid gap-6 lg:grid-cols-4">
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

          {/* Live Sensor Readings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Wind className="w-5 h-5" />
                Live Sensor Data
              </CardTitle>
              <CardDescription>
                {latestReadings.length} device{latestReadings.length !== 1 ? 's' : ''} reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                {latestReadings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wind className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No sensor data yet</p>
                    <p className="text-xs mt-1">Waiting for mesh nodes...</p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-4">
                    {latestReadings.map((reading) => {
                      const prob = getSurvivorProbability(reading.deviceId);
                      return (
                        <div
                          key={reading.deviceId}
                          className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{reading.deviceId}</span>
                            <Badge className={probabilityColors[prob]} variant="outline">
                              {probabilityLabels[prob]}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex flex-col items-center p-1.5 rounded bg-muted/50">
                              <Wind className="w-3 h-3 mb-1 text-blue-500" />
                              <span className="font-mono font-bold">{reading.co2}</span>
                              <span className="text-muted-foreground">ppm</span>
                            </div>
                            <div className="flex flex-col items-center p-1.5 rounded bg-muted/50">
                              <Thermometer className="w-3 h-3 mb-1 text-orange-500" />
                              <span className="font-mono">{reading.temperature}</span>
                              <span className="text-muted-foreground">°C</span>
                            </div>
                            <div className="flex flex-col items-center p-1.5 rounded bg-muted/50">
                              <Droplets className="w-3 h-3 mb-1 text-cyan-500" />
                              <span className="font-mono">{reading.humidity}</span>
                              <span className="text-muted-foreground">%</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {reading.latitude.toFixed(4)}, {reading.longitude.toFixed(4)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
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
        {/* Create Campaign Dialog */}
        {isAdmin && (
          <CreateCampaignDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onCreated={() => {}}
          />
        )}
      </div>
    </RoleGuard>
  );
}
