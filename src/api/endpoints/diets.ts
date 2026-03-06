import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { DietPlan } from '../../types/models';
import type { CreateDietRequest } from '../../types/api';

export const dietsApi = {
  list: (params?: PaginationParams & { category?: string; includeUnpublished?: boolean }) =>
    client.get<PaginatedResponse<DietPlan>>('/diets', { params }).then(r => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<DietPlan>>(`/diets/${id}`).then(r => r.data),

  create: (data: CreateDietRequest | FormData) =>
    client
      .post<ApiResponse<DietPlan>>('/diets', data, data instanceof FormData ? {
        headers: { 'Content-Type': 'multipart/form-data' },
      } : undefined)
      .then(r => r.data),

  update: (id: string, data: Partial<CreateDietRequest> | FormData) =>
    client
      .put<ApiResponse<DietPlan>>(`/diets/${id}`, data, data instanceof FormData ? {
        headers: { 'Content-Type': 'multipart/form-data' },
      } : undefined)
      .then(r => r.data),

  follow: (id: string) =>
    client.post<ApiResponse<DietPlan>>(`/diets/${id}/follow`).then(r => r.data),

  like: (id: string) =>
    client.post<ApiResponse<DietPlan>>(`/diets/${id}/like`).then(r => r.data),

  getSuggested: (params?: PaginationParams) =>
    client.get<PaginatedResponse<DietPlan>>('/diets/suggested', { params }).then(r => r.data),
};
