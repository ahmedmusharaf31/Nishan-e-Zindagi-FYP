'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { WebSocketClient, ConnectionStatus } from '@/lib/websocket/websocket-client';
import { SensorDataPayload, TelemetryPayload, SensorReading, Alert, AlertSeverity, SurvivorProbability } from '@/types';
import { useDeviceStore, useSensorStore } from '@/store';
import { useAlertStore } from '@/store/alert-store';

const OFFLINE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

interface WebSocketContextValue {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  wsUrl?: string;
}

export function WebSocketProvider({
  children,
  autoConnect = true,
  wsUrl = 'ws://localhost:8000/ws',
}: WebSocketProviderProps) {
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const { updateDevice, addDevice } = useDeviceStore();
  const { addReading } = useSensorStore();
  const { addAlert } = useAlertStore();
  // Track which devices already have active threshold alerts to avoid spamming
  const thresholdAlertedDevices = useRef<Set<string>>(new Set());

  // Handle sensor data from mesh nodes
  const handleSensorData = useCallback(
    (payload: SensorDataPayload) => {
      const reading: SensorReading = {
        deviceId: payload.deviceId,
        co2: payload.co2,
        temperature: payload.temperature,
        humidity: payload.humidity,
        latitude: payload.latitude,
        longitude: payload.longitude,
        gpsFix: payload.gpsFix,
        timestamp: payload.timestamp,
        receivedAt: new Date().toISOString(),
      };
      addReading(reading);

      // Auto-create threshold alert if CO2 exceeds threshold
      const sensorState = useSensorStore.getState();
      const threshold = sensorState.thresholds.co2Threshold;
      if (payload.co2 > threshold && !thresholdAlertedDevices.current.has(payload.deviceId)) {
        thresholdAlertedDevices.current.add(payload.deviceId);

        const probToSeverity: Record<SurvivorProbability, AlertSeverity> = {
          high: 'critical',
          moderate: 'high',
          low: 'medium',
          none: 'low',
        };
        const prob = sensorState.getSurvivorProbability(payload.deviceId);
        const severity = probToSeverity[prob] || 'medium';

        const alert: Alert = {
          id: `threshold-${payload.deviceId}-${Date.now()}`,
          deviceId: payload.deviceId,
          type: 'sensor_threshold',
          severity,
          status: 'active',
          title: `CO2 threshold exceeded on ${payload.deviceId}`,
          description: `CO2 reading ${payload.co2} ppm exceeds threshold of ${threshold} ppm. Survivor probability: ${prob.toUpperCase()}.`,
          triggeredAt: new Date().toISOString(),
        };
        addAlert(alert);
      } else if (payload.co2 <= threshold) {
        // Clear the flag so a new alert can be created if it crosses again
        thresholdAlertedDevices.current.delete(payload.deviceId);
      }

      // Auto-create or update device entry from sensor data
      const existingDevice = useDeviceStore.getState().devices.find(
        (d) => d.id === payload.deviceId
      );
      if (existingDevice) {
        updateDevice(payload.deviceId, {
          location: { latitude: payload.latitude, longitude: payload.longitude },
          lastSeenAt: new Date().toISOString(),
          status: 'online',
        });
      } else {
        addDevice({
          id: payload.deviceId,
          name: payload.deviceId,
          status: 'online',
          batteryLevel: 100,
          location: { latitude: payload.latitude, longitude: payload.longitude },
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
    },
    [addReading, updateDevice, addDevice, addAlert]
  );

  // Handle telemetry data (battery, voltage, environment)
  const handleTelemetry = useCallback(
    (payload: TelemetryPayload) => {
      if (payload.subtype === 'device' && payload.battery !== undefined) {
        // Find device by node number or name - update battery
        const deviceStore = useDeviceStore.getState();
        const device = deviceStore.devices.find(
          (d) => d.name === payload.from || d.id === payload.from
        );
        if (device) {
          const batteryStatus = payload.battery < 20 ? 'warning' as const : 'online' as const;
          updateDevice(device.id, {
            batteryLevel: payload.battery,
            status: batteryStatus,
            lastSeenAt: new Date().toISOString(),
          });
        }
      }
    },
    [updateDevice]
  );

  // Handle status changes
  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    if (newStatus === 'connected') {
      console.log('WebSocket connected to backend');
    } else if (newStatus === 'error') {
      console.warn('WebSocket connection error');
    }
  }, []);

  // Initialize client
  useEffect(() => {
    const wsClient = new WebSocketClient({
      url: wsUrl,
      reconnectInterval: 5000,
      maxReconnectAttempts: 50,
      onStatusChange: handleStatusChange,
      onSensorData: handleSensorData,
      onTelemetry: handleTelemetry,
    });

    setClient(wsClient);

    if (autoConnect) {
      wsClient.connect();
    }

    return () => {
      wsClient.disconnect();
    };
  }, [autoConnect, wsUrl, handleSensorData, handleTelemetry, handleStatusChange]);

  // Periodically check for devices that haven't sent data in 10 minutes and mark them offline
  useEffect(() => {
    const interval = setInterval(() => {
      const deviceStore = useDeviceStore.getState();
      const now = Date.now();
      for (const device of deviceStore.devices) {
        if (device.status !== 'offline' && device.lastSeenAt) {
          const lastSeen = new Date(device.lastSeenAt).getTime();
          if (now - lastSeen > OFFLINE_TIMEOUT_MS) {
            deviceStore.updateDevice(device.id, { status: 'offline' });
          }
        }
      }
    }, 60_000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(() => {
    client?.connect();
  }, [client]);

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
