import { create } from 'zustand';
import { SensorReading, SurvivorProbability, ThresholdSettings } from '@/types';

const MAX_HISTORY = 50;

interface SensorState {
  readings: Record<string, SensorReading>;
  readingHistory: Record<string, SensorReading[]>;
  thresholds: ThresholdSettings;

  // Actions
  addReading: (reading: SensorReading) => void;
  setCo2Threshold: (value: number) => void;
  getSurvivorProbability: (deviceId: string) => SurvivorProbability;
  getLatestReading: (deviceId: string) => SensorReading | undefined;
  getAllLatestReadings: () => SensorReading[];
  getDeviceIdsWithHighProbability: () => string[];
}

export const useSensorStore = create<SensorState>((set, get) => ({
  readings: {},
  readingHistory: {},
  thresholds: { co2Threshold: 800 },

  addReading: (reading: SensorReading) => {
    set((state) => {
      const history = state.readingHistory[reading.deviceId] || [];
      const updatedHistory = [...history, reading].slice(-MAX_HISTORY);

      return {
        readings: {
          ...state.readings,
          [reading.deviceId]: reading,
        },
        readingHistory: {
          ...state.readingHistory,
          [reading.deviceId]: updatedHistory,
        },
      };
    });
  },

  setCo2Threshold: (value: number) => {
    set({ thresholds: { co2Threshold: value } });
  },

  getSurvivorProbability: (deviceId: string): SurvivorProbability => {
    const { readings, thresholds } = get();
    const reading = readings[deviceId];
    if (!reading) return 'none';

    const threshold = thresholds.co2Threshold;
    if (threshold <= 0) return 'none';

    if (reading.co2 > threshold * 1.5) return 'high';
    if (reading.co2 > threshold * 1.2) return 'moderate';
    if (reading.co2 > threshold) return 'low';
    return 'none';
  },

  getLatestReading: (deviceId: string): SensorReading | undefined => {
    return get().readings[deviceId];
  },

  getAllLatestReadings: (): SensorReading[] => {
    return Object.values(get().readings);
  },

  getDeviceIdsWithHighProbability: (): string[] => {
    const { readings, thresholds } = get();
    return Object.keys(readings).filter((id) => {
      const reading = readings[id];
      return reading.co2 > thresholds.co2Threshold;
    });
  },
}));
