import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Device, DeviceStatus } from '@/types';
import { Battery, MapPin, Clock, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

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

export function DeviceStatusCard({ device, onClick }: DeviceStatusCardProps) {
  const status = statusConfig[device.status];

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        device.status === 'critical' && 'border-red-500 border-2'
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
