import { create } from 'zustand';
import { ordersApi } from '../api/endpoints/orders';
import type { Order, OrderStatus } from '../types/models';
import type { CreateOrderRequest } from '../types/api';

interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  pagination: OrderPagination;

  createOrder: (data: CreateOrderRequest) => Promise<Order>;
  fetchMyOrders: (page?: number) => Promise<void>;
  fetchAllOrders: (page?: number) => Promise<void>;
  getOrderById: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  clearError: () => void;
  clearSelectedOrder: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },

  createOrder: async (data: CreateOrderRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await ordersApi.create(data);
      const order = response.data;
      set((state) => ({
        orders: [order, ...state.orders],
        isLoading: false,
      }));
      return order;
    } catch (err: any) {
      const message = err.message || 'Failed to create order';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  fetchMyOrders: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await ordersApi.getMyOrders({ page, limit: 10 });
      set({
        orders: page === 1 ? (response.data ?? []) : [...get().orders, ...(response.data ?? [])],
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch orders',
        isLoading: false,
      });
    }
  },

  fetchAllOrders: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await ordersApi.getAll({ page, limit: 20 });
      set({
        orders: page === 1 ? (response.data ?? []) : [...get().orders, ...(response.data ?? [])],
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch orders',
        isLoading: false,
      });
    }
  },

  getOrderById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await ordersApi.getById(id);
      set({ selectedOrder: response.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch order',
        isLoading: false,
      });
    }
  },

  updateOrderStatus: async (id: string, status: OrderStatus) => {
    set({ isUpdating: true, error: null });
    try {
      const response = await ordersApi.updateStatus(id, status);
      const updatedOrder = response.data;
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? updatedOrder : o)),
        isUpdating: false,
      }));
    } catch (err: any) {
      set({
        error: err.message || 'Failed to update order status',
        isUpdating: false,
      });
      throw new Error(err.message || 'Failed to update order status');
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedOrder: () => set({ selectedOrder: null }),
}));
