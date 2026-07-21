import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { CyclePlan } from '../../types/models';
import type { CreateCycleRequest } from '../../types/api';

export const cyclesApi = {
  list: (params?: PaginationParams & { category?: string; level?: string; type?: string; tag?: string; includeUnpublished?: boolean }) =>
    client.get<PaginatedResponse<CyclePlan>>('/cycles', { params }).then(r => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<CyclePlan>>(`/cycles/${id}`).then(r => r.data),

  create: (data: CreateCycleRequest | FormData) =>
    client
      .post<ApiResponse<CyclePlan>>('/cycles', data, data instanceof FormData ? {
        headers: { 'Content-Type': 'multipart/form-data' },
      } : undefined)
      .then(r => r.data),

  update: (id: string, data: Partial<CreateCycleRequest> | FormData) =>
    client
      .put<ApiResponse<CyclePlan>>(`/cycles/${id}`, data, data instanceof FormData ? {
        headers: { 'Content-Type': 'multipart/form-data' },
      } : undefined)
      .then(r => r.data),

  remove: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/cycles/${id}`).then(r => r.data),

  follow: (id: string) =>
    client.post<ApiResponse<CyclePlan>>(`/cycles/${id}/follow`).then(r => r.data),

  like: (id: string) =>
    client.post<ApiResponse<CyclePlan>>(`/cycles/${id}/like`).then(r => r.data),
};
