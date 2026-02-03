import {
  WebSocketMessage,
  DeviceUpdatePayload,
  AlertPayload,
  Alert,
  DeviceStatus,
  AlertSeverity,
} from '@/types';
import { generateId } from '@/lib/utils';

export type MockConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface MockWebSocketClientOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onStatusChange?: (status: MockConnectionStatus) => void;
  onDeviceUpdate?: (payload: DeviceUpdatePayload) => void;
  onNewAlert?: (payload: AlertPayload) => void;
  updateInterval?: number;
}

// Sample device IDs and alert titles for generating mock data
const DEVICE_IDS = ['device-1', 'device-2', 'device-3', 'device-4', 'device-5'];
const ALERT_TITLES = [
  'SOS Signal Detected',
  'Low Battery Warning',
  'Sensor Threshold Exceeded',
  'Device Offline Alert',
  'Location Update Required',
];
const ALERT_DESCRIPTIONS = [
  'Emergency signal received from the device.',
  'Device battery level is critically low.',
  'Sensor readings have exceeded the configured threshold.',
  'Device has not reported for an extended period.',
  'Device location needs verification.',
];

export class MockWebSocketClient {
  private status: MockConnectionStatus = 'disconnected';
  private updateInterval: number;
  private intervalId: NodeJS.Timeout | null = null;
  private options: MockWebSocketClientOptions;

  constructor(options: MockWebSocketClientOptions) {
    this.options = options;
    this.updateInterval = options.updateInterval || 15000; // 15 seconds default
  }

  connect(): void {
    if (this.status === 'connected') {
      return;
    }

    this.setStatus('connecting');

    // Simulate connection delay
    setTimeout(() => {
      this.setStatus('connected');
      this.startMockUpdates();
    }, 1000);
  }

  disconnect(): void {
    this.stopMockUpdates();
    this.setStatus('disconnected');
  }

  getStatus(): MockConnectionStatus {
    return this.status;
  }

  private setStatus(status: MockConnectionStatus): void {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  private startMockUpdates(): void {
    // Start periodic mock updates
    this.intervalId = setInterval(() => {
      this.generateMockUpdate();
    }, this.updateInterval);

    // Generate initial update after short delay
    setTimeout(() => {
      this.generateMockUpdate();
    }, 2000);
  }

  private stopMockUpdates(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private generateMockUpdate(): void {
    // Randomly choose between device update and new alert
    const updateType = Math.random();

    if (updateType < 0.7) {
      // 70% chance of device update
      this.generateDeviceUpdate();
    } else {
      // 30% chance of new alert
      this.generateNewAlert();
    }
  }

  private generateDeviceUpdate(): void {
    const deviceId = DEVICE_IDS[Math.floor(Math.random() * DEVICE_IDS.length)];
    const statuses: DeviceStatus[] = ['online', 'offline', 'warning'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Generate battery level changes
    const batteryChange = Math.floor(Math.random() * 10) - 5; // -5 to +5
    const baseBattery = 50 + Math.floor(Math.random() * 50);
    const batteryLevel = Math.max(5, Math.min(100, baseBattery + batteryChange));

    // Generate small location changes (simulating movement)
    const baseLat = 30.3753 + (Math.random() - 0.5) * 2;
    const baseLng = 69.3451 + (Math.random() - 0.5) * 2;

    const payload: DeviceUpdatePayload = {
      deviceId,
      status,
      batteryLevel,
      location: {
        latitude: baseLat,
        longitude: baseLng,
      },
    };

    const message: WebSocketMessage<DeviceUpdatePayload> = {
      type: 'device_update',
      payload,
      timestamp: new Date().toISOString(),
    };

    this.options.onMessage?.(message);
    this.options.onDeviceUpdate?.(payload);
  }

  private generateNewAlert(): void {
    const deviceId = DEVICE_IDS[Math.floor(Math.random() * DEVICE_IDS.length)];
    const titleIndex = Math.floor(Math.random() * ALERT_TITLES.length);
    const severities: AlertSeverity[] = ['low', 'medium', 'high', 'critical'];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    const alert: Alert = {
      id: generateId(),
      deviceId,
      type: titleIndex === 0 ? 'sos' : titleIndex === 1 ? 'battery_low' : 'sensor_threshold',
      severity,
      status: 'active',
      title: ALERT_TITLES[titleIndex],
      description: ALERT_DESCRIPTIONS[titleIndex],
      triggeredAt: new Date().toISOString(),
    };

    const payload: AlertPayload = { alert };

    const message: WebSocketMessage<AlertPayload> = {
      type: 'alert_new',
      payload,
      timestamp: new Date().toISOString(),
    };

    this.options.onMessage?.(message);
    this.options.onNewAlert?.(payload);
  }

  // Method to manually trigger an update (useful for testing)
  triggerDeviceUpdate(): void {
    this.generateDeviceUpdate();
  }

  triggerNewAlert(): void {
    this.generateNewAlert();
  }
}
