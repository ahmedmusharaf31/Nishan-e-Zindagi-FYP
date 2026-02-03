'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { MockWebSocketClient, MockConnectionStatus } from '@/lib/websocket/mock-websocket-client';
import { DeviceUpdatePayload, AlertPayload } from '@/types';
import { useDeviceStore, useAlertStore } from '@/store';
import { useToast } from '@/components/ui/use-toast';

interface WebSocketContextValue {
  status: MockConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  enableNotifications?: boolean;
}

export function WebSocketProvider({
  children,
  autoConnect = true,
  enableNotifications = true,
}: WebSocketProviderProps) {
  const [client, setClient] = useState<MockWebSocketClient | null>(null);
  const [status, setStatus] = useState<MockConnectionStatus>('disconnected');
  const { updateDevice } = useDeviceStore();
  const { addAlert } = useAlertStore();
  const { toast } = useToast();

  // Handle device updates
  const handleDeviceUpdate = useCallback(
    async (payload: DeviceUpdatePayload) => {
      await updateDevice(payload.deviceId, {
        status: payload.status,
        batteryLevel: payload.batteryLevel,
        location: payload.location,
        lastSeenAt: new Date().toISOString(),
      });
    },
    [updateDevice]
  );

  // Handle new alerts
  const handleNewAlert = useCallback(
    async (payload: AlertPayload) => {
      await addAlert(payload.alert);

      // Show toast notification for new alerts
      if (enableNotifications) {
        toast({
          title: payload.alert.title,
          description: payload.alert.description || `New ${payload.alert.severity} alert`,
          variant: payload.alert.severity === 'critical' ? 'destructive' : 'default',
        });
      }
    },
    [addAlert, enableNotifications, toast]
  );

  // Handle status changes
  const handleStatusChange = useCallback((newStatus: MockConnectionStatus) => {
    setStatus(newStatus);
  }, []);

  // Initialize client
  useEffect(() => {
    const wsClient = new MockWebSocketClient({
      onStatusChange: handleStatusChange,
      onDeviceUpdate: handleDeviceUpdate,
      onNewAlert: handleNewAlert,
      updateInterval: 20000, // Update every 20 seconds
    });

    setClient(wsClient);

    // Auto connect if enabled
    if (autoConnect) {
      wsClient.connect();
    }

    return () => {
      wsClient.disconnect();
    };
  }, [autoConnect, handleDeviceUpdate, handleNewAlert, handleStatusChange]);

  // Connect function
  const connect = useCallback(() => {
    client?.connect();
  }, [client]);

  // Disconnect function
  const disconnect = useCallback(() => {
    client?.disconnect();
  }, [client]);

  const value: WebSocketContextValue = {
    status,
    connect,
    disconnect,
    isConnected: status === 'connected',
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
