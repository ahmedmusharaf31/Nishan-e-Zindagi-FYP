// User types
export type UserRole = 'admin' | 'rescuer' | 'public';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified?: boolean;
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

export type NodeAssignmentStatus = 'pending' | 'assigned' | 'in_progress' | 'rescued';

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

export interface NodeAssignment {
  nodeId: string;
  deviceId: string;
  alertId: string;
  assignedRescuerIds: string[];
  location: DeviceLocation;
  status: NodeAssignmentStatus;
  rescuedAt?: string;
  rescuedBy?: string;
  survivorsFound?: number;
}

export interface Campaign {
  id: string;
  // Legacy single-alert/single-rescuer fields (backward compat)
  alertId?: string;
  assignedRescuerId?: string;
  // New multi-node/multi-rescuer fields
  name?: string;
  description?: string;
  alertIds: string[];
  assignedRescuerIds: string[];
  nodeAssignments: NodeAssignment[];
  totalSurvivorsFound?: number;
  resolvedAt?: string;
  // Common fields
  status: CampaignStatus;
  location: DeviceLocation;
  statusHistory: CampaignStatusHistoryEntry[];
  notes: CampaignNote[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  deployedNodes: number;
  deployedRescuers: number;
  activeCampaigns: number;
  totalSurvivorsFound: number;
  resolvedCampaigns: number;
  totalCampaigns: number;
}

export interface CampaignReport {
  campaign: Campaign;
  rescuerNames: Record<string, string>;
  deviceNames: Record<string, string>;
  alertDetails: Record<string, Alert>;
  duration?: string;
  generatedAt: string;
}

// Sensor reading types
export type SurvivorProbability = 'high' | 'moderate' | 'low' | 'none';

export interface SensorReading {
  deviceId: string;
  co2: number;
  temperature: number;
  humidity: number;
  latitude: number;
  longitude: number;
  gpsFix: number;
  timestamp: number;
  receivedAt: string;
}

export interface ThresholdSettings {
  co2Threshold: number;
}

// WebSocket message types
export type WebSocketMessageType =
  | 'device_update'
  | 'alert_new'
  | 'alert_update'
  | 'campaign_update'
  | 'connection_status'
  | 'sensor_data'
  | 'telemetry'
  | 'ping';

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

export interface SensorDataPayload {
  deviceId: string;
  from: string;
  nodeNum: number;
  co2: number;
  temperature: number;
  humidity: number;
  latitude: number;
  longitude: number;
  gpsFix: number;
  timestamp: number;
}

export interface TelemetryPayload {
  from: string;
  nodeNum: number;
  subtype: 'device' | 'environment';
  battery?: number;
  voltage?: number;
  uptime?: number;
  temperature?: number;
  humidity?: number;
  pressure?: number;
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
