import { create } from 'zustand';
import { reelsApi } from '../api/endpoints/reels';
import type { Reel, ReelComment, User } from '../types/models';

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

  // Comments
  comments: ReelComment[];
  commentsLoading: boolean;
  commentsPagination: Pagination;

  fetchReels: (page?: number) => Promise<void>;
  refreshReels: () => Promise<void>;
  likeReel: (id: string) => Promise<void>;
  fetchComments: (reelId: string, page?: number) => Promise<void>;
  addComment: (reelId: string, content: string) => Promise<ReelComment>;
  clearComments: () => void;
  clearError: () => void;
}

export const useReelStore = create<ReelState>((set, get) => ({
  reels: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },

  comments: [],
  commentsLoading: false,
  commentsPagination: { page: 1, limit: 20, total: 0, pages: 0 },

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
      set({ reels });
    }
  },

  fetchComments: async (reelId, page = 1) => {
    set({ commentsLoading: true });
    try {
      const response = await reelsApi.getComments(reelId, { page, limit: 20 });
      set((state) => ({
        comments: page === 1 ? response.data : [...state.comments, ...response.data],
        commentsPagination: response.pagination,
        commentsLoading: false,
      }));
    } catch {
      set({ commentsLoading: false });
    }
  },

  addComment: async (reelId, content) => {
    const response = await reelsApi.addComment(reelId, content);
    const newComment = response.data;
    set((state) => ({
      comments: [newComment, ...state.comments],
      reels: state.reels.map((r) =>
        r._id === reelId ? { ...r, commentsCount: (r.commentsCount ?? 0) + 1 } : r,
      ),
    }));
    return newComment;
  },

  clearComments: () =>
    set({ comments: [], commentsPagination: { page: 1, limit: 20, total: 0, pages: 0 } }),

  clearError: () => set({ error: null }),
}));
