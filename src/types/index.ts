// User types
export type UserRole = 'admin' | 'rescuer' | 'public';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Device types
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'critical';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
}

export interface Device {
  id: string;
  name: string;
  status: DeviceStatus;
  batteryLevel: number;
  location: DeviceLocation;
  lastSeenAt: string;
  createdAt: string;
}

// Alert types
export type AlertType = 'sensor_threshold' | 'sos' | 'battery_low';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  deviceId: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description?: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

// Campaign types
export type CampaignStatus =
  | 'initiated'
  | 'assigned'
  | 'accepted'
  | 'en_route'
  | 'on_scene'
  | 'in_progress'
  | 'resolved'
  | 'cancelled';

export interface CampaignStatusHistoryEntry {
  status: CampaignStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface CampaignNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Campaign {
  id: string;
  alertId: string;
  status: CampaignStatus;
  assignedRescuerId?: string;
  location: DeviceLocation;
  statusHistory: CampaignStatusHistoryEntry[];
  notes: CampaignNote[];
  createdAt: string;
  updatedAt: string;
}

// WebSocket message types
export type WebSocketMessageType =
  | 'device_update'
  | 'alert_new'
  | 'alert_update'
  | 'campaign_update'
  | 'connection_status';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: string;
}

export interface DeviceUpdatePayload {
  deviceId: string;
  status?: DeviceStatus;
  batteryLevel?: number;
  location?: DeviceLocation;
}

export interface AlertPayload {
  alert: Alert;
}

export interface CampaignPayload {
  campaign: Campaign;
}

// Stats types for dashboard
export interface DashboardStats {
  totalUsers: number;
  totalDevices: number;
  activeAlerts: number;
  activeCampaigns: number;
  devicesOnline: number;
  devicesOffline: number;
}

// Auth types
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  userProfile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
