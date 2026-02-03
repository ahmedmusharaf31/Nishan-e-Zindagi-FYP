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
