import { create } from 'zustand';
import { bmiApi } from '../api/endpoints/bmi';
import type { BmiRecord, Gender } from '../types/models';

interface BmiState {
  records: BmiRecord[];
  latestRecord: BmiRecord | null;
  isLoading: boolean;
  error: string | null;

  recordBmi: (height: number, weight: number, age?: number, gender?: Gender) => Promise<BmiRecord>;
  fetchHistory: () => Promise<void>;
  getLatest: () => Promise<void>;
  clearError: () => void;
}

export const useBmiStore = create<BmiState>((set, get) => ({
  records: [],
  latestRecord: null,
  isLoading: false,
  error: null,

  recordBmi: async (height, weight, age, gender) => {
    set({ isLoading: true, error: null });
    try {
      // age + gender are what let the server store a BMR alongside the BMI —
      // without them the record's bmr comes back null.
      const response = await bmiApi.record({ height, weight, age, gender });
      const newRecord = response.data;
      set((state) => ({
        records: [newRecord, ...state.records],
        latestRecord: newRecord,
        isLoading: false,
      }));
      return newRecord;
    } catch (err: any) {
      set({
        error: err.message || 'Failed to record BMI',
        isLoading: false,
      });
      throw err;
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await bmiApi.getHistory({ limit: 50 });
      set({ records: response.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch BMI history',
        isLoading: false,
      });
    }
  },

  getLatest: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await bmiApi.getLatest();
      set({ latestRecord: response.data, isLoading: false });
    } catch (err: any) {
      // No latest record is not necessarily an error for new users
      set({ latestRecord: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
