import { create } from 'zustand';
import { notificationsApi } from '../api/endpoints/notifications';
import type { Notification } from '../types/models';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  pagination: Pagination;

  fetchNotifications: (page?: number, filters?: { isRead?: boolean; type?: string }) => Promise<void>;
  refreshNotifications: (filters?: { isRead?: boolean; type?: string }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getUnreadCount: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isRefreshing: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },

  fetchNotifications: async (page = 1, filters?: { isRead?: boolean; type?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationsApi.list({ page, limit: 20, ...filters });
      set((state) => ({
        notifications:
          page === 1
            ? response.data
            : [...state.notifications, ...response.data],
        pagination: response.pagination,
        isLoading: false,
      }));
      // Recalculate unread count
      get().getUnreadCount();
    } catch (err: any) {
      const message = err.message || 'Failed to load notifications';
      set({ error: message, isLoading: false });
    }
  },

  refreshNotifications: async (filters?: { isRead?: boolean; type?: string }) => {
    set({ isRefreshing: true, error: null });
    try {
      const response = await notificationsApi.list({ page: 1, limit: 20, ...filters });
      set({
        notifications: response.data,
        pagination: response.pagination,
        isRefreshing: false,
      });
      get().getUnreadCount();
    } catch (err: any) {
      const message = err.message || 'Failed to refresh notifications';
      set({ error: message, isRefreshing: false });
    }
  },

  markAsRead: async (id: string) => {
    const { notifications } = get();
    // Optimistic update
    set({
      notifications: notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n,
      ),
    });
    get().getUnreadCount();

    try {
      await notificationsApi.markAsRead(id);
    } catch {
      // Revert on failure
      set({ notifications });
      get().getUnreadCount();
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    // Optimistic update
    set({
      notifications: notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });

    try {
      await notificationsApi.markAllAsRead();
    } catch {
      // Revert on failure
      set({ notifications });
      get().getUnreadCount();
    }
  },

  getUnreadCount: async () => {
    const state = get();

    // If notifications haven't been fetched yet, fetch them first
    if (state.notifications.length === 0 && !state.isLoading) {
      try {
        const response = await notificationsApi.list({ page: 1, limit: 20 });
        set({
          notifications: response.data,
          pagination: response.pagination,
        });
        const unreadCount = response.data.filter((n) => !n.isRead).length;
        set({ unreadCount });
      } catch {
        // On error (e.g. 401 when logged out), just set unread count to 0
        set({ unreadCount: 0 });
      }
    } else {
      const unreadCount = state.notifications.filter((n) => !n.isRead).length;
      set({ unreadCount });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isRefreshing: false,
    error: null,
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  }),
}));
