import { doc, writeBatch } from 'firebase/firestore';
import { firestore } from './config';
import { db } from '@/lib/storage/indexed-db';
import { useSensorStore } from '@/store/sensor-store';

export interface CloudSyncResult {
  users: number;
  devices: number;
  alerts: number;
  campaigns: number;
  sensorReadings: number;
}

const BATCH_LIMIT = 500; // Firestore batch limit

export async function uploadDataToCloud(): Promise<CloudSyncResult> {
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your configuration.');
  }

  const result: CloudSyncResult = {
    users: 0,
    devices: 0,
    alerts: 0,
    campaigns: 0,
    sensorReadings: 0,
  };

  // Read all data from IndexedDB
  const [users, devices, alerts, campaigns] = await Promise.all([
    db.users.toArray(),
    db.devices.toArray(),
    db.alerts.toArray(),
    db.campaigns.toArray(),
  ]);

  // Get sensor readings from Zustand in-memory store
  const sensorState = useSensorStore.getState();
  const latestReadings = Object.entries(sensorState.readings);
  const readingHistory = sensorState.readingHistory;

  // Build all documents to write
  type DocEntry = { collection: string; id: string; data: Record<string, unknown> };
  const allDocs: DocEntry[] = [];

  for (const user of users) {
    allDocs.push({ collection: 'users', id: user.id, data: { ...user } });
  }
  for (const device of devices) {
    allDocs.push({ collection: 'devices', id: device.id, data: { ...device } });
  }
  for (const alert of alerts) {
    allDocs.push({ collection: 'alerts', id: alert.id, data: { ...alert } });
  }
  for (const campaign of campaigns) {
    allDocs.push({ collection: 'campaigns', id: campaign.id, data: { ...campaign } });
  }

  // Upload all sensor readings as flat documents in sensorReadings collection
  // Each reading gets a unique ID: deviceId-timestamp
  const seenReadingIds = new Set<string>();
  for (const [deviceId, history] of Object.entries(readingHistory)) {
    for (const reading of history) {
      const readingId = `${deviceId}-${reading.timestamp}`;
      if (!seenReadingIds.has(readingId)) {
        seenReadingIds.add(readingId);
        allDocs.push({
          collection: 'sensorReadings',
          id: readingId,
          data: { ...reading },
        });
      }
    }
  }
  // Also include latest readings in case they're not in history yet
  for (const [deviceId, reading] of latestReadings) {
    const readingId = `${deviceId}-${reading.timestamp}`;
    if (!seenReadingIds.has(readingId)) {
      seenReadingIds.add(readingId);
      allDocs.push({
        collection: 'sensorReadings',
        id: readingId,
        data: { ...reading },
      });
    }
  }

  // Write in batches of 500 (Firestore limit)
  for (let i = 0; i < allDocs.length; i += BATCH_LIMIT) {
    const chunk = allDocs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(firestore);

    for (const entry of chunk) {
      const ref = doc(firestore, entry.collection, entry.id);
      batch.set(ref, entry.data, { merge: true });
    }

    await batch.commit();
  }

  result.users = users.length;
  result.devices = devices.length;
  result.alerts = alerts.length;
  result.campaigns = campaigns.length;
  result.sensorReadings = seenReadingIds.size;

  return result;
}
