"use client";

import { useDeviceStore } from '@/store/device-store';
import { DeviceStatusCard } from './device-status-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Radio } from 'lucide-react';

export function DeviceGrid() {
  const { devices, isLoading } = useDeviceStore();

  const onlineDevices = devices.filter(d => d.status === 'online');
  const offlineDevices = devices.filter(d => d.status === 'offline');
  const warningDevices = devices.filter(d => d.status === 'warning' || d.status === 'critical');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <Radio className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Devices Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Devices will appear here once connected to the system.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          Device Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All ({devices.length})
            </TabsTrigger>
            <TabsTrigger value="online">
              Online ({onlineDevices.length})
            </TabsTrigger>
            <TabsTrigger value="offline">
              Offline ({offlineDevices.length})
            </TabsTrigger>
            <TabsTrigger value="warning">
              Alerts ({warningDevices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map(device => (
                <DeviceStatusCard key={device.id} device={device} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="online">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineDevices.map(device => (
                <DeviceStatusCard key={device.id} device={device} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="offline">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offlineDevices.map(device => (
                <DeviceStatusCard key={device.id} device={device} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="warning">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warningDevices.map(device => (
                <DeviceStatusCard key={device.id} device={device} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
