import { create } from 'zustand';
import { moderationApi, CreateReportRequest } from '../api/endpoints/moderation';
import { useFeedStore } from './useFeedStore';
import { useReelStore } from './useReelStore';
import type { ContentReport, ReportStatus, User } from '../types/models';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const authorId = (author: unknown): string | undefined =>
  typeof author === 'object' && author ? (author as User)._id : (author as string | undefined);

/**
 * Removes everything authored by `userId` from the feed and reel stores so a
 * block takes effect instantly (App Store 1.2: blocking must remove the
 * user's content from the feed immediately).
 */
function purgeAuthorFromStores(userId: string) {
  useFeedStore.setState((state) => {
    const postsByCategory: typeof state.postsByCategory = {};
    for (const [key, cache] of Object.entries(state.postsByCategory)) {
      postsByCategory[key] = {
        ...cache,
        posts: cache.posts.filter((p) => authorId(p.author) !== userId),
      };
    }
    return { postsByCategory };
  });

  useReelStore.setState((state) => ({
    reels: state.reels.filter((r) => authorId(r.author) !== userId),
    comments: state.comments.filter((c) => authorId(c.author) !== userId),
  }));
}

interface ModerationState {
  blockedUsers: User[];
  blockedLoading: boolean;
  error: string | null;

  // Admin moderation queue
  reports: ContentReport[];
  reportsLoading: boolean;
  reportsPagination: Pagination;

  reportContent: (data: CreateReportRequest) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  fetchBlockedUsers: () => Promise<void>;
  isBlocked: (userId: string) => boolean;

  fetchReports: (page?: number, status?: ReportStatus) => Promise<void>;
  resolveReport: (id: string, action: 'remove' | 'dismiss', ejectUser?: boolean) => Promise<void>;
  clearError: () => void;
}

export const useModerationStore = create<ModerationState>((set, get) => ({
  blockedUsers: [],
  blockedLoading: false,
  error: null,

  reports: [],
  reportsLoading: false,
  reportsPagination: { page: 1, limit: 20, total: 0, pages: 0 },

  reportContent: async (data) => {
    try {
      await moderationApi.report(data);
    } catch (err: any) {
      const message = err.message || 'Failed to submit report';
      set({ error: message });
      throw new Error(message);
    }
  },

  blockUser: async (userId) => {
    // Optimistic: the blocked user's content disappears immediately.
    purgeAuthorFromStores(userId);
    try {
      await moderationApi.blockUser(userId);
      const response = await moderationApi.getBlockedUsers();
      set({ blockedUsers: response.data ?? [] });
    } catch (err: any) {
      const message = err.message || 'Failed to block user';
      set({ error: message });
      throw new Error(message);
    }
  },

  unblockUser: async (userId) => {
    const prev = get().blockedUsers;
    set({ blockedUsers: prev.filter((u) => u._id !== userId) });
    try {
      await moderationApi.unblockUser(userId);
    } catch (err: any) {
      set({ blockedUsers: prev, error: err.message || 'Failed to unblock user' });
      throw new Error(err.message || 'Failed to unblock user');
    }
  },

  fetchBlockedUsers: async () => {
    set({ blockedLoading: true, error: null });
    try {
      const response = await moderationApi.getBlockedUsers();
      set({ blockedUsers: response.data ?? [], blockedLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load blocked users', blockedLoading: false });
    }
  },

  isBlocked: (userId) => get().blockedUsers.some((u) => u._id === userId),

  fetchReports: async (page = 1, status) => {
    set({ reportsLoading: true, error: null });
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (status) params.status = status;
      const response = await moderationApi.listReports(params);
      set((state) => ({
        reports: page === 1 ? (response.data ?? []) : [...state.reports, ...(response.data ?? [])],
        reportsPagination: response.pagination,
        reportsLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to load reports', reportsLoading: false });
    }
  },

  resolveReport: async (id, action, ejectUser) => {
    try {
      await moderationApi.resolveReport(id, action, ejectUser);
      // The backend resolves every pending report on the same content, so
      // refetch instead of patching a single row.
      await get().fetchReports(1, 'pending');
    } catch (err: any) {
      const message = err.message || 'Failed to resolve report';
      set({ error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
