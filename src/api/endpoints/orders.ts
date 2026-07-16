import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { Order, OrderStatus } from '../../types/models';
import type { CreateOrderRequest } from '../../types/api';

export interface OrderListParams extends PaginationParams {
  status?: OrderStatus;
}

export const ordersApi = {
  create: (data: CreateOrderRequest) =>
    client.post<ApiResponse<Order>>('/orders/create', data).then(r => r.data),

  getMyOrders: (params?: OrderListParams) =>
    client.get<PaginatedResponse<Order>>('/orders/my', { params }).then(r => r.data),

  getAll: (params?: OrderListParams) =>
    client.get<PaginatedResponse<Order>>('/orders', { params }).then(r => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<Order>>(`/orders/${id}`).then(r => r.data),

  updateStatus: (id: string, status: OrderStatus) =>
    client.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }).then(r => r.data),
};
