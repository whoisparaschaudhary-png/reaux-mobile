import { create } from 'zustand';
import { analyticsApi } from '../api/endpoints/analytics';
import { usersApi } from '../api/endpoints/users';
import type { PlatformStats, SalesReport, User, Role, UserStatus } from '../types/models';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AdminState {
  stats: PlatformStats | null;
  salesReport: SalesReport | null;
  users: User[];
  isLoading: boolean;
  error: string | null;
  pagination: Pagination;

  fetchStats: () => Promise<void>;
  fetchSalesReport: () => Promise<void>;
  fetchUsers: (page?: number) => Promise<void>;
  updateUserRole: (id: string, role: Role) => Promise<void>;
  updateUserStatus: (id: string, status: UserStatus) => Promise<void>;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  salesReport: null,
  users: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await analyticsApi.getStats();
      set({ stats: response.data, isLoading: false });
    } catch (err: any) {
      const message = err.message || 'Failed to load stats';
      set({ error: message, isLoading: false });
    }
  },

  fetchSalesReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await analyticsApi.getSalesReport();
      const rawData = response.data as any;

      // Transform backend data to match frontend structure
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];

      const transformedData: SalesReport = {
        totalRevenue: rawData.totalRevenue || 0,
        monthlyBreakdown: rawData.monthlyStats?.map((stat: any) => ({
          month: `${monthNames[stat._id.month - 1]} ${stat._id.year}`,
          orders: stat.orders || 0,
          revenue: stat.revenue || 0,
        })) || [],
        topProducts: rawData.topProducts?.map((item: any) => ({
          product: {
            _id: item._id,
            name: item.name || 'Unknown Product',
          },
          totalSold: item.totalQuantity || 0,
          revenue: item.totalRevenue || 0,
        })) || [],
      };

      set({ salesReport: transformedData, isLoading: false });
    } catch (err: any) {
      const message = err.message || 'Failed to load sales report';
      set({ error: message, isLoading: false });
    }
  },

  fetchUsers: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersApi.getUsers({ page, limit: 10 });
      set((state) => ({
        users: page === 1 ? response.data : [...state.users, ...response.data.filter((u: any) => !state.users.some((existing: any) => existing._id === u._id))],
        pagination: response.pagination,
        isLoading: false,
      }));
    } catch (err: any) {
      const message = err.message || 'Failed to load users';
      set({ error: message, isLoading: false });
    }
  },

  updateUserRole: async (id: string, role: Role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersApi.updateUserRole(id, role);
      const updatedUser = response.data;
      set((state) => ({
        users: state.users.map((u) => (u._id === id ? updatedUser : u)),
        isLoading: false,
      }));
    } catch (err: any) {
      const message = err.message || 'Failed to update user role';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  updateUserStatus: async (id: string, status: UserStatus) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersApi.updateUserStatus(id, status);
      const updatedUser = response.data;
      set((state) => ({
        users: state.users.map((u) => (u._id === id ? updatedUser : u)),
        isLoading: false,
      }));
    } catch (err: any) {
      const message = err.message || 'Failed to update user status';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
