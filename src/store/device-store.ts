import { create } from 'zustand';
import { Device, DeviceStatus, DeviceLocation } from '@/types';
import { db } from '@/lib/storage/indexed-db';

interface DeviceState {
  devices: Device[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDevices: () => Promise<void>;
  addDevice: (device: Device) => Promise<void>;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  updateDeviceStatus: (id: string, status: DeviceStatus) => Promise<void>;
  updateDeviceLocation: (id: string, location: DeviceLocation) => Promise<void>;
  updateDeviceBattery: (id: string, batteryLevel: number) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  getDeviceById: (id: string) => Device | undefined;
  getDevicesByStatus: (status: DeviceStatus) => Device[];
  getOnlineDevices: () => Device[];
  getOfflineDevices: () => Device[];
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  isLoading: false,
  error: null,

  fetchDevices: async () => {
    set({ isLoading: true, error: null });
    try {
      const devices = await db.devices.toArray();
      set({ devices, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addDevice: async (device: Device) => {
    try {
      await db.devices.add(device);
      set(state => ({ devices: [...state.devices, device] }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateDevice: async (id: string, updates: Partial<Device>) => {
    try {
      await db.devices.update(id, updates);
      set(state => ({
        devices: state.devices.map(device =>
          device.id === id ? { ...device, ...updates } : device
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateDeviceStatus: async (id: string, status: DeviceStatus) => {
    const lastSeenAt = status === 'online' ? new Date().toISOString() : undefined;
    await get().updateDevice(id, { status, ...(lastSeenAt && { lastSeenAt }) });
  },

  updateDeviceLocation: async (id: string, location: DeviceLocation) => {
    await get().updateDevice(id, { location, lastSeenAt: new Date().toISOString() });
  },

  updateDeviceBattery: async (id: string, batteryLevel: number) => {
    const status: DeviceStatus = batteryLevel < 20 ? 'warning' : 'online';
    await get().updateDevice(id, { batteryLevel, status });
  },

  deleteDevice: async (id: string) => {
    try {
      await db.devices.delete(id);
      set(state => ({ devices: state.devices.filter(device => device.id !== id) }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  getDeviceById: (id: string) => {
    return get().devices.find(device => device.id === id);
  },

  getDevicesByStatus: (status: DeviceStatus) => {
    return get().devices.filter(device => device.status === status);
  },

  getOnlineDevices: () => {
    return get().devices.filter(device => device.status === 'online');
  },

  getOfflineDevices: () => {
    return get().devices.filter(device => device.status === 'offline');
  },
}));
