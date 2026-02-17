'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertSeverity, Device, DeviceStatus, SurvivorProbability } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Battery, Wifi, WifiOff, AlertTriangle, Wind, Thermometer, Droplets } from 'lucide-react';
import { useSensorStore } from '@/store';

// Status color mapping (fallback when no sensor data)
const statusColors: Record<DeviceStatus, string> = {
  online: '#22c55e',    // green-500
  offline: '#6b7280',   // grey-500
  warning: '#f59e0b',   // amber-500
  critical: '#dc2626',  // red-600
};

// Survivor probability color mapping
const probabilityColors: Record<SurvivorProbability, string> = {
  high: '#ef4444',      // red-500
  moderate: '#f97316',  // orange-500
  low: '#eab308',       // yellow-500
  none: '#22c55e',      // green-500
};

const probabilityLabels: Record<SurvivorProbability, string> = {
  high: 'HIGH Survivor Probability',
  moderate: 'MODERATE Probability',
  low: 'LOW Probability',
  none: 'No Likely Survivor',
};

// Create custom marker icon based on survivor probability or device status
function createMarkerIcon(status: DeviceStatus, probability?: SurvivorProbability): L.DivIcon {
  const hasSensor = probability && probability !== undefined;
  const color = hasSensor ? probabilityColors[probability] : statusColors[status];
  const isPulsing = probability === 'high' || probability === 'moderate';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isPulsing ? 'animation: pulse 1.5s ease-in-out infinite;' : ''}
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
      ${isPulsing ? `
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.8; }
          }
        </style>
      ` : ''}
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

interface DeviceMarkerProps {
  device: Device;
  onClick?: (device: Device) => void;
}

export function DeviceMarker({ device, onClick }: DeviceMarkerProps) {
  const { getLatestReading, getSurvivorProbability } = useSensorStore();
  const reading = getLatestReading(device.id);
  const probability = getSurvivorProbability(device.id);

  const icon = createMarkerIcon(device.status, device.status !== 'offline' && reading ? probability : undefined);
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
        <div className="min-w-[220px] p-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">{device.name}</h3>
            <Badge variant={statusVariant[device.status]} className="text-xs">
              <StatusIcon className="w-3 h-3 mr-1" />
              {device.status}
            </Badge>
          </div>

          {/* Survivor Probability Badge */}
          {reading && (
            <div className="mb-2">
              <div
                className="text-xs font-bold px-2 py-1 rounded text-white text-center"
                style={{ backgroundColor: probabilityColors[probability] }}
              >
                {probabilityLabels[probability]}
              </div>
            </div>
          )}

          {/* Sensor Readings */}
          {reading && (
            <div className="space-y-1 text-xs mb-2 p-2 bg-muted/50 rounded">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3" /> CO2
                </span>
                <span className="font-mono font-bold">{reading.co2} ppm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3" /> Temp
                </span>
                <span className="font-mono">{reading.temperature}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> Humidity
                </span>
                <span className="font-mono">{reading.humidity}%</span>
              </div>
            </div>
          )}

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

function createManualReportIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: #7c3aed;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: manualPulse 1.5s ease-in-out infinite;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
      <style>
        @keyframes manualPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
      </style>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

interface ManualReportMarkerProps {
  position: [number, number];
  reportedBy: string;
  severity: AlertSeverity;
}

export function ManualReportMarker({ position, reportedBy, severity }: ManualReportMarkerProps) {
  const icon = createManualReportIcon();

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="min-w-[200px] p-1">
          <h3 className="font-semibold text-sm mb-2" style={{ color: '#7c3aed' }}>
            Potential Survivor Location
          </h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div><span className="font-medium">Reported by:</span> {reportedBy}</div>
            <div><span className="font-medium">Severity:</span> {severity}</div>
            <div><span className="font-medium">Coordinates:</span> {position[0].toFixed(5)}, {position[1].toFixed(5)}</div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
