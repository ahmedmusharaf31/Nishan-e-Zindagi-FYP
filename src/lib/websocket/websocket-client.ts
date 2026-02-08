import {
  WebSocketMessage,
  DeviceUpdatePayload,
  AlertPayload,
  CampaignPayload,
  SensorDataPayload,
  TelemetryPayload,
} from '@/types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketClientOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onDeviceUpdate?: (payload: DeviceUpdatePayload) => void;
  onNewAlert?: (payload: AlertPayload) => void;
  onAlertUpdate?: (payload: AlertPayload) => void;
  onCampaignUpdate?: (payload: CampaignPayload) => void;
  onSensorData?: (payload: SensorDataPayload) => void;
  onTelemetry?: (payload: TelemetryPayload) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private status: ConnectionStatus = 'disconnected';
  private options: WebSocketClientOptions;

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.reconnectInterval = options.reconnectInterval || 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.options = options;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setStatus('error');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRawMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch {
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect();
    }, this.reconnectInterval);
  }

  // Handle raw messages from backend (flat JSON with "type" field)
  private handleRawMessage(data: Record<string, unknown>): void {
    const msgType = data.type as string;

    // Wrap as WebSocketMessage for the general handler
    const wrapped: WebSocketMessage = {
      type: msgType as WebSocketMessage['type'],
      payload: data,
      timestamp: new Date().toISOString(),
    };
    this.options.onMessage?.(wrapped);

    switch (msgType) {
      case 'sensor_data':
        this.options.onSensorData?.({
          deviceId: data.device_id as string,
          from: data.from as string,
          nodeNum: data.node_num as number,
          co2: data.co2 as number,
          temperature: data.temperature as number,
          humidity: data.humidity as number,
          latitude: data.latitude as number,
          longitude: data.longitude as number,
          gpsFix: data.gps_fix as number,
          timestamp: data.timestamp as number,
        });
        break;
      case 'telemetry':
        this.options.onTelemetry?.({
          from: data.from as string,
          nodeNum: data.node_num as number,
          subtype: data.subtype as 'device' | 'environment',
          battery: data.battery as number | undefined,
          voltage: data.voltage as number | undefined,
          uptime: data.uptime as number | undefined,
          temperature: data.temperature as number | undefined,
          humidity: data.humidity as number | undefined,
          pressure: data.pressure as number | undefined,
        });
        break;
      case 'device_update':
        this.options.onDeviceUpdate?.(data.payload as DeviceUpdatePayload);
        break;
      case 'alert_new':
        this.options.onNewAlert?.(data.payload as AlertPayload);
        break;
      case 'alert_update':
        this.options.onAlertUpdate?.(data.payload as AlertPayload);
        break;
      case 'campaign_update':
        this.options.onCampaignUpdate?.(data.payload as CampaignPayload);
        break;
      case 'ping':
        // Heartbeat from server, ignore
        break;
    }
  }
}
