import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { Product } from '../../types/models';
import type { CreateProductRequest } from '../../types/api';

export const productsApi = {
  // `manage` is honoured for admin/superadmin only — it is the catalogue view
  // that keeps hidden and members-only products listed so they stay editable.
  list: (params?: PaginationParams & { category?: string; search?: string; manage?: boolean }) =>
    client.get<PaginatedResponse<Product>>('/products', { params }).then(r => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<Product>>(`/products/${id}`).then(r => r.data),

  create: (data: CreateProductRequest) =>
    client.post<ApiResponse<Product>>('/products', data).then(r => r.data),

  update: (id: string, data: Partial<CreateProductRequest>) =>
    client.put<ApiResponse<Product>>(`/products/${id}`, data).then(r => r.data),
};
