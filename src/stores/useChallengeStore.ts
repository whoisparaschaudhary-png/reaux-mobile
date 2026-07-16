import { create } from 'zustand';
import { challengesApi } from '../api/endpoints/challenges';
import type { Challenge } from '../types/models';
import type { CreateChallengeRequest, UpdateChallengeRequest } from '../types/api';

interface ChallengePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ChallengeState {
  challenges: Challenge[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  pagination: ChallengePagination;

  fetchChallenges: (page?: number) => Promise<void>;
  refreshChallenges: () => Promise<void>;
  joinChallenge: (id: string, userId: string) => Promise<void>;
  createChallenge: (data: CreateChallengeRequest) => Promise<void>;
  updateChallenge: (id: string, data: UpdateChallengeRequest) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenges: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },

  fetchChallenges: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await challengesApi.list({ page, limit: 10 });
      set((state) => ({
        challenges: page === 1 ? response.data : [...state.challenges, ...response.data],
        pagination: response.pagination,
        isLoading: false,
      }));
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch challenges',
        isLoading: false,
      });
    }
  },

  refreshChallenges: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const response = await challengesApi.list({ page: 1, limit: 10 });
      set({
        challenges: response.data,
        pagination: response.pagination,
        isRefreshing: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to refresh challenges',
        isRefreshing: false,
      });
    }
  },

  joinChallenge: async (id: string, userId: string) => {
    const { challenges } = get();
    // Optimistic update: add user to participants
    const updatedChallenges = challenges.map((challenge) => {
      if (challenge._id !== id) return challenge;
      return {
        ...challenge,
        participants: [
          ...(challenge.participants ?? []),
          { userId, progress: 0, joinedAt: new Date().toISOString() },
        ],
      };
    });
    set({ challenges: updatedChallenges });

    try {
      const response = await challengesApi.join(id);
      const serverChallenge = response.data;
      set((state) => ({
        challenges: state.challenges.map((c) =>
          c._id === id ? { ...c, ...serverChallenge } : c
        ),
      }));
    } catch {
      // Revert optimistic update on failure
      set({ challenges });
    }
  },

  createChallenge: async (data: CreateChallengeRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await challengesApi.create(data);
      set((state) => ({
        challenges: [response.data, ...state.challenges],
        isLoading: false,
      }));
    } catch (err: any) {
      set({
        error: err.message || 'Failed to create challenge',
        isLoading: false,
      });
      throw err;
    }
  },

  updateChallenge: async (id: string, data: UpdateChallengeRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await challengesApi.update(id, data);
      const updated = response.data;
      set((state) => ({
        challenges: state.challenges.map((c) => (c._id === id ? { ...c, ...updated } : c)),
        isLoading: false,
      }));
    } catch (err: any) {
      const message = err.message || 'Failed to update challenge';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  deleteChallenge: async (id: string) => {
    const { challenges } = get();
    // Optimistic removal — restore the previous list if the server rejects it.
    set({ challenges: challenges.filter((c) => c._id !== id) });
    try {
      await challengesApi.remove(id);
    } catch (err: any) {
      const message = err.message || 'Failed to delete challenge';
      set({ challenges, error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
