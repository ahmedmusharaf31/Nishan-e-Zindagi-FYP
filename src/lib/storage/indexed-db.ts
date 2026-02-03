import Dexie, { Table } from 'dexie';
import { User, Device, Alert, Campaign } from '@/types';

export class NishanEZindagiDB extends Dexie {
  users!: Table<User>;
  devices!: Table<Device>;
  alerts!: Table<Alert>;
  campaigns!: Table<Campaign>;

  constructor() {
    super('NishanEZindagiDB');

    this.version(1).stores({
      users: 'id, email, role, isActive, createdAt',
      devices: 'id, name, status, lastSeenAt',
      alerts: 'id, deviceId, type, severity, status, triggeredAt',
      campaigns: 'id, alertId, status, assignedRescuerId, createdAt',
    });
  }
}

export const db = new NishanEZindagiDB();

// Helper function to clear all data
export async function clearAllData() {
  await db.users.clear();
  await db.devices.clear();
  await db.alerts.clear();
  await db.campaigns.clear();
}

// Helper function to check if database is empty
export async function isDatabaseEmpty() {
  const userCount = await db.users.count();
  const deviceCount = await db.devices.count();
  return userCount === 0 && deviceCount === 0;
}

// Seed demo data for testing
export async function seedDemoData() {
  const isEmpty = await isDatabaseEmpty();
  if (!isEmpty) return;

  // Seed demo devices across Pakistan
  const demoDevices: Device[] = [
    {
      id: 'device-1',
      name: 'Karachi Station Alpha',
      status: 'online',
      batteryLevel: 85,
      location: { latitude: 24.8607, longitude: 67.0011 },
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'device-2',
      name: 'Lahore Station Beta',
      status: 'online',
      batteryLevel: 72,
      location: { latitude: 31.5204, longitude: 74.3587 },
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'device-3',
      name: 'Islamabad Station Gamma',
      status: 'warning',
      batteryLevel: 18,
      location: { latitude: 33.6844, longitude: 73.0479 },
      lastSeenAt: new Date(Date.now() - 30 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'device-4',
      name: 'Peshawar Station Delta',
      status: 'offline',
      batteryLevel: 5,
      location: { latitude: 34.0151, longitude: 71.5249 },
      lastSeenAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'device-5',
      name: 'Quetta Station Epsilon',
      status: 'online',
      batteryLevel: 95,
      location: { latitude: 30.1798, longitude: 66.975 },
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'device-6',
      name: 'Multan Station Zeta',
      status: 'critical',
      batteryLevel: 3,
      location: { latitude: 30.1575, longitude: 71.5249 },
      lastSeenAt: new Date(Date.now() - 5 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  // Seed demo alerts
  const demoAlerts: Alert[] = [
    {
      id: 'alert-1',
      deviceId: 'device-6',
      type: 'battery_low',
      severity: 'critical',
      status: 'active',
      title: 'Critical Battery Level',
      description: 'Device battery is critically low at 3%. Immediate action required.',
      triggeredAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: 'alert-2',
      deviceId: 'device-4',
      type: 'sos',
      severity: 'high',
      status: 'active',
      title: 'Device Offline',
      description: 'Peshawar Station Delta has gone offline. Last contact 2 hours ago.',
      triggeredAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'alert-3',
      deviceId: 'device-3',
      type: 'battery_low',
      severity: 'medium',
      status: 'acknowledged',
      title: 'Low Battery Warning',
      description: 'Device battery is at 18%. Please recharge soon.',
      triggeredAt: new Date(Date.now() - 45 * 60000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 30 * 60000).toISOString(),
      acknowledgedBy: 'Rescuer Ali',
    },
    {
      id: 'alert-4',
      deviceId: 'device-1',
      type: 'sensor_threshold',
      severity: 'low',
      status: 'resolved',
      title: 'Sensor Calibration Needed',
      description: 'Routine sensor check detected minor drift. Calibration recommended.',
      triggeredAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      resolvedAt: new Date(Date.now() - 20 * 3600000).toISOString(),
    },
    {
      id: 'alert-5',
      deviceId: 'device-2',
      type: 'sos',
      severity: 'critical',
      status: 'active',
      title: 'Emergency SOS Signal',
      description: 'Emergency SOS signal received from Lahore Station Beta. Rescue team dispatch required.',
      triggeredAt: new Date(Date.now() - 2 * 60000).toISOString(),
    },
  ];

  // Seed demo users
  const demoUsers: User[] = [
    {
      id: 'admin-user-1',
      email: 'admin@demo.com',
      displayName: 'Admin User',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rescuer-user-1',
      email: 'rescuer@demo.com',
      displayName: 'Rescuer Ali',
      role: 'rescuer',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'public-user-1',
      email: 'public@demo.com',
      displayName: 'Public User',
      role: 'public',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  await db.devices.bulkAdd(demoDevices);
  await db.alerts.bulkAdd(demoAlerts);
  await db.users.bulkAdd(demoUsers);

  console.log('Demo data seeded successfully');
}
