import { create } from 'zustand';
import { Alert, AlertSeverity, AlertStatus, AlertType } from '@/types';
import { db } from '@/lib/storage/indexed-db';

interface AlertState {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAlerts: () => Promise<void>;
  addAlert: (alert: Alert) => Promise<void>;
  updateAlert: (id: string, updates: Partial<Alert>) => Promise<void>;
  acknowledgeAlert: (id: string, acknowledgedBy: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  getAlertById: (id: string) => Alert | undefined;
  getAlertsByStatus: (status: AlertStatus) => Alert[];
  getAlertsBySeverity: (severity: AlertSeverity) => Alert[];
  getAlertsByDevice: (deviceId: string) => Alert[];
  getActiveAlerts: () => Alert[];
  getCriticalAlerts: () => Alert[];
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  isLoading: false,
  error: null,

  fetchAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const alerts = await db.alerts.toArray();
      // Sort by triggered date, newest first
      alerts.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
      set({ alerts, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addAlert: async (alert: Alert) => {
    try {
      await db.alerts.add(alert);
      set(state => ({ alerts: [alert, ...state.alerts] }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateAlert: async (id: string, updates: Partial<Alert>) => {
    try {
      await db.alerts.update(id, updates);
      set(state => ({
        alerts: state.alerts.map(alert =>
          alert.id === id ? { ...alert, ...updates } : alert
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  acknowledgeAlert: async (id: string, acknowledgedBy: string) => {
    await get().updateAlert(id, {
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy,
    });
  },

  resolveAlert: async (id: string) => {
    await get().updateAlert(id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
  },

  deleteAlert: async (id: string) => {
    try {
      await db.alerts.delete(id);
      set(state => ({ alerts: state.alerts.filter(alert => alert.id !== id) }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  getAlertById: (id: string) => {
    return get().alerts.find(alert => alert.id === id);
  },

  getAlertsByStatus: (status: AlertStatus) => {
    return get().alerts.filter(alert => alert.status === status);
  },

  getAlertsBySeverity: (severity: AlertSeverity) => {
    return get().alerts.filter(alert => alert.severity === severity);
  },

  getAlertsByDevice: (deviceId: string) => {
    return get().alerts.filter(alert => alert.deviceId === deviceId);
  },

  getActiveAlerts: () => {
    return get().alerts.filter(alert => alert.status === 'active');
  },

  getCriticalAlerts: () => {
    return get().alerts.filter(
      alert => alert.severity === 'critical' && alert.status !== 'resolved'
    );
  },
}));
