import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Device, DeviceStatus, SurvivorProbability } from '@/types';
import { Battery, MapPin, Clock, Wifi, WifiOff, AlertTriangle, Wind, Thermometer, Droplets } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useSensorStore } from '@/store';

interface DeviceStatusCardProps {
  device: Device;
  onClick?: () => void;
}

const statusConfig: Record<DeviceStatus, { color: string; icon: React.ElementType; label: string }> = {
  online: { color: 'bg-green-500', icon: Wifi, label: 'Online' },
  offline: { color: 'bg-gray-500', icon: WifiOff, label: 'Offline' },
  warning: { color: 'bg-yellow-500', icon: AlertTriangle, label: 'Warning' },
  critical: { color: 'bg-red-500', icon: AlertTriangle, label: 'Critical' },
};

const probabilityConfig: Record<SurvivorProbability, { color: string; bgColor: string; label: string }> = {
  high: { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'HIGH Survivor' },
  moderate: { color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30', label: 'MODERATE' },
  low: { color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'LOW' },
  none: { color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'No Survivor' },
};

export function DeviceStatusCard({ device, onClick }: DeviceStatusCardProps) {
  const status = statusConfig[device.status];
  const { getLatestReading, getSurvivorProbability } = useSensorStore();
  const reading = getLatestReading(device.id);
  const probability = reading ? getSurvivorProbability(device.id) : undefined;
  const probConfig = probability ? probabilityConfig[probability] : undefined;

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        device.status === 'critical' && 'border-red-500 border-2',
        probability === 'high' && 'border-red-500 border-2 shadow-red-100'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{device.name}</CardTitle>
          <Badge
            variant={device.status === 'online' ? 'success' : device.status === 'critical' ? 'critical' : 'secondary'}
            className="flex items-center gap-1"
          >
            <span className={cn('h-2 w-2 rounded-full', status.color)} />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Survivor Probability */}
        {reading && probConfig && (
          <div className={cn('rounded-md px-3 py-2 text-center', probConfig.bgColor)}>
            <span className={cn('text-xs font-bold', probConfig.color)}>
              {probConfig.label}
            </span>
          </div>
        )}

        {/* Sensor Readings */}
        {reading && (
          <div className="space-y-2 p-2 rounded-md bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wind className="h-4 w-4 text-blue-500" />
                <span>CO2</span>
              </div>
              <span className="font-mono font-bold">{reading.co2} ppm</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span>Temp</span>
              </div>
              <span className="font-mono">{reading.temperature}°C</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Droplets className="h-4 w-4 text-cyan-500" />
                <span>Humidity</span>
              </div>
              <span className="font-mono">{reading.humidity}%</span>
            </div>
          </div>
        )}

        {/* Battery Level */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Battery className={cn('h-4 w-4', getBatteryColor(device.batteryLevel))} />
            <span>Battery</span>
          </div>
          <span className={cn('font-medium', getBatteryColor(device.batteryLevel))}>
            {device.batteryLevel}%
          </span>
        </div>

        {/* Battery Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              device.batteryLevel > 50
                ? 'bg-green-500'
                : device.batteryLevel > 20
                ? 'bg-yellow-500'
                : 'bg-red-500'
            )}
            style={{ width: `${device.batteryLevel}%` }}
          />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="truncate">
            {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
          </span>
        </div>

        {/* Last Seen */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatRelativeTime(device.lastSeenAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
