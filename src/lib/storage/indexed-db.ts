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

    this.version(2).stores({
      users: 'id, email, role, isActive, createdAt',
      devices: 'id, name, status, lastSeenAt',
      alerts: 'id, deviceId, type, severity, status, triggeredAt',
      campaigns: 'id, status, createdAt, *alertIds, *assignedRescuerIds',
    }).upgrade(tx => {
      return tx.table('campaigns').toCollection().modify(campaign => {
        // Migrate single alertId to alertIds array
        if (!campaign.alertIds) {
          campaign.alertIds = campaign.alertId ? [campaign.alertId] : [];
        }
        // Migrate single assignedRescuerId to assignedRescuerIds array
        if (!campaign.assignedRescuerIds) {
          campaign.assignedRescuerIds = campaign.assignedRescuerId ? [campaign.assignedRescuerId] : [];
        }
        // Initialize nodeAssignments if missing
        if (!campaign.nodeAssignments) {
          campaign.nodeAssignments = [];
        }
      });
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
    {
      id: 'alert-6',
      deviceId: 'device-5',
      type: 'sensor_threshold',
      severity: 'high',
      status: 'active',
      title: 'High CO2 Detected',
      description: 'Elevated CO2 levels detected at Quetta Station Epsilon. Possible survivor presence.',
      triggeredAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 'alert-7',
      deviceId: 'device-3',
      type: 'sensor_threshold',
      severity: 'medium',
      status: 'resolved',
      title: 'CO2 Spike Detected',
      description: 'CO2 spike detected and resolved at Islamabad Station Gamma.',
      triggeredAt: new Date(Date.now() - 72 * 3600000).toISOString(),
      resolvedAt: new Date(Date.now() - 68 * 3600000).toISOString(),
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
      id: 'rescuer-user-2',
      email: 'ahmed.khan@demo.com',
      displayName: 'Ahmed Khan',
      role: 'rescuer',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rescuer-user-3',
      email: 'fatima.zahra@demo.com',
      displayName: 'Fatima Zahra',
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

  // Seed demo campaigns (new multi-node format)
  const demoCampaigns: Campaign[] = [
    // Campaign 1: Active multi-node campaign (3 nodes, 2 rescuers, 1 node rescued)
    {
      id: 'campaign-1',
      name: 'Lahore-Quetta Emergency Response',
      description: 'Multi-node rescue operation covering Lahore and Quetta stations.',
      alertId: 'alert-5',
      alertIds: ['alert-5', 'alert-6', 'alert-1'],
      assignedRescuerId: 'rescuer-user-1',
      assignedRescuerIds: ['rescuer-user-1', 'rescuer-user-2'],
      nodeAssignments: [
        {
          nodeId: 'node-1',
          deviceId: 'device-2',
          alertId: 'alert-5',
          assignedRescuerIds: ['rescuer-user-1'],
          location: { latitude: 31.5204, longitude: 74.3587 },
          status: 'in_progress',
        },
        {
          nodeId: 'node-2',
          deviceId: 'device-5',
          alertId: 'alert-6',
          assignedRescuerIds: ['rescuer-user-2'],
          location: { latitude: 30.1798, longitude: 66.975 },
          status: 'assigned',
        },
        {
          nodeId: 'node-3',
          deviceId: 'device-6',
          alertId: 'alert-1',
          assignedRescuerIds: ['rescuer-user-1', 'rescuer-user-2'],
          location: { latitude: 30.1575, longitude: 71.5249 },
          status: 'rescued',
          rescuedAt: new Date(Date.now() - 60 * 60000).toISOString(),
          rescuedBy: 'rescuer-user-1',
          survivorsFound: 3,
        },
      ],
      totalSurvivorsFound: 3,
      status: 'in_progress',
      location: { latitude: 31.5204, longitude: 74.3587 },
      statusHistory: [
        {
          status: 'initiated',
          timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
          note: 'Multi-node campaign initiated',
        },
        {
          status: 'assigned',
          timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
          note: 'Assigned to Rescuer Ali and Ahmed Khan',
        },
        {
          status: 'accepted',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          updatedBy: 'Rescuer Ali',
        },
        {
          status: 'in_progress',
          timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
          note: 'Rescue operations underway',
          updatedBy: 'Rescuer Ali',
        },
      ],
      notes: [
        {
          id: 'note-1',
          content: 'Node 3 (Multan) rescued successfully. 3 survivors found.',
          createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
          createdBy: 'Rescuer Ali',
        },
      ],
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    },
    // Campaign 2: Active single-rescuer campaign
    {
      id: 'campaign-2',
      name: 'Peshawar Device Recovery',
      alertId: 'alert-2',
      alertIds: ['alert-2'],
      assignedRescuerId: 'rescuer-user-2',
      assignedRescuerIds: ['rescuer-user-2'],
      nodeAssignments: [
        {
          nodeId: 'node-4',
          deviceId: 'device-4',
          alertId: 'alert-2',
          assignedRescuerIds: ['rescuer-user-2'],
          location: { latitude: 34.0151, longitude: 71.5249 },
          status: 'assigned',
        },
      ],
      status: 'en_route',
      location: { latitude: 34.0151, longitude: 71.5249 },
      statusHistory: [
        {
          status: 'initiated',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          note: 'Campaign initiated for offline device',
        },
        {
          status: 'assigned',
          timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
          note: 'Assigned to Ahmed Khan',
        },
        {
          status: 'accepted',
          timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
          updatedBy: 'Ahmed Khan',
        },
        {
          status: 'en_route',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          note: 'En route to location',
          updatedBy: 'Ahmed Khan',
        },
      ],
      notes: [],
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    // Campaign 3: Fully resolved campaign with survivors (for reporting)
    {
      id: 'campaign-3',
      name: 'Karachi Earthquake Response',
      description: 'Emergency response to earthquake damage in Karachi sector.',
      alertId: 'alert-4',
      alertIds: ['alert-4', 'alert-7'],
      assignedRescuerId: 'rescuer-user-3',
      assignedRescuerIds: ['rescuer-user-3', 'rescuer-user-1'],
      nodeAssignments: [
        {
          nodeId: 'node-5',
          deviceId: 'device-1',
          alertId: 'alert-4',
          assignedRescuerIds: ['rescuer-user-3'],
          location: { latitude: 24.8607, longitude: 67.0011 },
          status: 'rescued',
          rescuedAt: new Date(Date.now() - 44 * 3600000).toISOString(),
          rescuedBy: 'rescuer-user-3',
          survivorsFound: 5,
        },
        {
          nodeId: 'node-6',
          deviceId: 'device-3',
          alertId: 'alert-7',
          assignedRescuerIds: ['rescuer-user-1'],
          location: { latitude: 33.6844, longitude: 73.0479 },
          status: 'rescued',
          rescuedAt: new Date(Date.now() - 43 * 3600000).toISOString(),
          rescuedBy: 'rescuer-user-1',
          survivorsFound: 2,
        },
      ],
      totalSurvivorsFound: 7,
      resolvedAt: new Date(Date.now() - 42 * 3600000).toISOString(),
      status: 'resolved',
      location: { latitude: 24.8607, longitude: 67.0011 },
      statusHistory: [
        {
          status: 'initiated',
          timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
          note: 'Campaign initiated for earthquake response',
        },
        {
          status: 'assigned',
          timestamp: new Date(Date.now() - 47 * 3600000).toISOString(),
          note: 'Assigned to Fatima Zahra and Rescuer Ali',
        },
        {
          status: 'accepted',
          timestamp: new Date(Date.now() - 46 * 3600000).toISOString(),
          updatedBy: 'Fatima Zahra',
        },
        {
          status: 'en_route',
          timestamp: new Date(Date.now() - 45 * 3600000).toISOString(),
          updatedBy: 'Fatima Zahra',
        },
        {
          status: 'on_scene',
          timestamp: new Date(Date.now() - 44 * 3600000).toISOString(),
          updatedBy: 'Fatima Zahra',
        },
        {
          status: 'in_progress',
          timestamp: new Date(Date.now() - 43 * 3600000).toISOString(),
          note: 'Rescue operations in progress',
          updatedBy: 'Fatima Zahra',
        },
        {
          status: 'resolved',
          timestamp: new Date(Date.now() - 42 * 3600000).toISOString(),
          note: 'All nodes rescued. 7 survivors found total.',
          updatedBy: 'Fatima Zahra',
        },
      ],
      notes: [
        {
          id: 'note-2',
          content: 'Node 5 (Karachi): 5 survivors found and evacuated safely.',
          createdAt: new Date(Date.now() - 44 * 3600000).toISOString(),
          createdBy: 'Fatima Zahra',
        },
        {
          id: 'note-3',
          content: 'Node 6 (Islamabad): 2 survivors found. All clear.',
          createdAt: new Date(Date.now() - 43 * 3600000).toISOString(),
          createdBy: 'Rescuer Ali',
        },
      ],
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 42 * 3600000).toISOString(),
    },
    // Campaign 4: Unassigned campaign
    {
      id: 'campaign-4',
      name: 'Islamabad Battery Emergency',
      alertId: 'alert-3',
      alertIds: ['alert-3'],
      assignedRescuerIds: [],
      nodeAssignments: [
        {
          nodeId: 'node-7',
          deviceId: 'device-3',
          alertId: 'alert-3',
          assignedRescuerIds: [],
          location: { latitude: 33.6844, longitude: 73.0479 },
          status: 'pending',
        },
      ],
      status: 'initiated',
      location: { latitude: 33.6844, longitude: 73.0479 },
      statusHistory: [
        {
          status: 'initiated',
          timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
          note: 'Campaign initiated for low battery device',
        },
      ],
      notes: [],
      createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    },
  ];

  await db.devices.bulkAdd(demoDevices);
  await db.alerts.bulkAdd(demoAlerts);
  await db.users.bulkAdd(demoUsers);
  await db.campaigns.bulkAdd(demoCampaigns);

  console.log('Demo data seeded successfully');
}
