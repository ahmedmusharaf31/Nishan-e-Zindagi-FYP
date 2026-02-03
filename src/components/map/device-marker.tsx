'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Device, DeviceStatus } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Battery, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

// Status color mapping
const statusColors: Record<DeviceStatus, string> = {
  online: '#22c55e',    // green-500
  offline: '#ef4444',   // red-500
  warning: '#f59e0b',   // amber-500
  critical: '#dc2626',  // red-600
};

// Create custom marker icon based on status
function createMarkerIcon(status: DeviceStatus): L.DivIcon {
  const color = statusColors[status];

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

interface DeviceMarkerProps {
  device: Device;
  onClick?: (device: Device) => void;
}

export function DeviceMarker({ device, onClick }: DeviceMarkerProps) {
  const icon = createMarkerIcon(device.status);
  const position: [number, number] = [device.location.latitude, device.location.longitude];

  const statusVariant = {
    online: 'default' as const,
    offline: 'destructive' as const,
    warning: 'secondary' as const,
    critical: 'destructive' as const,
  };

  const StatusIcon = device.status === 'online' ? Wifi :
                     device.status === 'offline' ? WifiOff : AlertTriangle;

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(device),
      }}
    >
      <Popup>
        <div className="min-w-[200px] p-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">{device.name}</h3>
            <Badge variant={statusVariant[device.status]} className="text-xs">
              <StatusIcon className="w-3 h-3 mr-1" />
              {device.status}
            </Badge>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Battery className="w-3 h-3" />
              <span>Battery: {device.batteryLevel}%</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    device.batteryLevel > 50
                      ? 'bg-green-500'
                      : device.batteryLevel > 20
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${device.batteryLevel}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Last seen: {formatDateTime(device.lastSeenAt)}
              </span>
            </div>

            <div className="text-muted-foreground">
              Location: {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

interface DeviceMarkersProps {
  devices: Device[];
  onDeviceClick?: (device: Device) => void;
}

export function DeviceMarkers({ devices, onDeviceClick }: DeviceMarkersProps) {
  return (
    <>
      {devices.map((device) => (
        <DeviceMarker
          key={device.id}
          device={device}
          onClick={onDeviceClick}
        />
      ))}
    </>
  );
}
