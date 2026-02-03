'use client';

import { Alert, AlertSeverity } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { AlertTriangle, AlertCircle, AlertOctagon, Info } from 'lucide-react';
import { ReactNode } from 'react';

// Severity icon mapping
const severityIcons: Record<AlertSeverity, ReactNode> = {
  low: <Info className="w-4 h-4 text-blue-500" />,
  medium: <AlertCircle className="w-4 h-4 text-amber-500" />,
  high: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  critical: <AlertOctagon className="w-4 h-4 text-red-500" />,
};

// Severity variant mapping for toast
const severityVariant: Record<AlertSeverity, 'default' | 'destructive'> = {
  low: 'default',
  medium: 'default',
  high: 'destructive',
  critical: 'destructive',
};

export function showAlertToast(alert: Alert, deviceName?: string) {
  const icon = severityIcons[alert.severity];
  const variant = severityVariant[alert.severity];

  toast({
    variant,
    title: (
      <div className="flex items-center gap-2">
        {icon}
        <span>{alert.title}</span>
      </div>
    ) as unknown as string,
    description: (
      <div className="mt-1">
        {alert.description && (
          <p className="text-sm mb-1">{alert.description}</p>
        )}
        {deviceName && (
          <p className="text-xs text-muted-foreground">Device: {deviceName}</p>
        )}
      </div>
    ) as unknown as string,
  });
}

// Hook for managing alert notifications
export function useAlertNotifications() {
  const notify = (alert: Alert, deviceName?: string) => {
    showAlertToast(alert, deviceName);
  };

  const notifyNew = (alert: Alert, deviceName?: string) => {
    // Play sound for critical alerts (optional)
    if (alert.severity === 'critical') {
      // Could add audio notification here
    }
    showAlertToast(alert, deviceName);
  };

  return { notify, notifyNew };
}
