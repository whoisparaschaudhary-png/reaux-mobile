import { create } from 'zustand';
import { reelsApi } from '../api/endpoints/reels';
import type { Reel, User } from '../types/models';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ReelState {
  reels: Reel[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  pagination: Pagination;

  fetchReels: (page?: number) => Promise<void>;
  refreshReels: () => Promise<void>;
  likeReel: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useReelStore = create<ReelState>((set, get) => ({
  reels: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },

  fetchReels: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reelsApi.list({ page, limit: 10 });
      set((state) => ({
        reels: page === 1 ? response.data : [...state.reels, ...response.data],
        pagination: response.pagination,
        isLoading: false,
      }));
    } catch (err: any) {
      const message = err.message || 'Failed to load reels';
      set({ error: message, isLoading: false });
    }
  },

  refreshReels: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const response = await reelsApi.list({ page: 1, limit: 10 });
      set({
        reels: response.data,
        pagination: response.pagination,
        isRefreshing: false,
      });
    } catch (err: any) {
      const message = err.message || 'Failed to refresh reels';
      set({ error: message, isRefreshing: false });
    }
  },

  likeReel: async (id: string) => {
    const { reels } = get();
    // Optimistic update: toggle isLiked and count
    const updatedReels = reels.map((reel) => {
      if (reel._id !== id) return reel;
      return {
        ...reel,
        isLiked: !reel.isLiked,
        likesCount: reel.isLiked ? reel.likesCount - 1 : reel.likesCount + 1,
      };
    });
    set({ reels: updatedReels });

    try {
      const response = await reelsApi.like(id);
      const serverReel = response.data;
      const serverAuthorPopulated =
        typeof serverReel.author === 'object' && serverReel.author && (serverReel.author as User).name;
      set((state) => ({
        reels: state.reels.map((r) => {
          if (r._id !== id) return r;
          const merged: Reel = { ...r, ...serverReel };
          if (!serverAuthorPopulated && r.author) merged.author = r.author;
          return merged;
        }),
      }));
    } catch {
      // Revert on failure
      set({ reels });
    }
  },

  clearError: () => set({ error: null }),
}));
