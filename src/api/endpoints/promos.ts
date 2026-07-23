import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { PromoCode, PromoValidation } from '../../types/models';
import type { CreatePromoRequest } from '../../types/api';

export const promosApi = {
  list: (params?: PaginationParams & { isActive?: string; search?: string }) =>
    client.get<PaginatedResponse<PromoCode>>('/promo', { params }).then(r => r.data),

  create: (data: CreatePromoRequest) =>
    client.post<ApiResponse<PromoCode>>('/promo/create', data).then(r => r.data),

  // orderAmount is REQUIRED by the backend — it enforces minOrderAmount and
  // returns the computed `discount` against this total. Omitting it made the
  // server see 0 and reject every promo that has a minimum order.
  validate: (code: string, orderAmount: number) =>
    client
      .post<ApiResponse<PromoValidation>>('/promo/validate', { code, orderAmount })
      .then(r => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<PromoCode>>(`/promo/${id}`).then(r => r.data),

  update: (id: string, data: Partial<CreatePromoRequest>) =>
    client.put<ApiResponse<PromoCode>>(`/promo/${id}`, data).then(r => r.data),
};
