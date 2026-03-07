import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { Reel, ReelComment } from '../../types/models';

export const reelsApi = {
  list: (params?: PaginationParams) =>
    client.get<PaginatedResponse<Reel>>('/reels', { params }).then(r => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<Reel>>(`/reels/${id}`).then(r => r.data),

  create: (data: FormData) =>
    client
      .post<ApiResponse<Reel>>('/reels', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      })
      .then(r => r.data),

  like: (id: string) =>
    client.post<ApiResponse<Reel>>(`/reels/${id}/like`).then(r => r.data),

  getComments: (id: string, params?: PaginationParams) =>
    client.get<PaginatedResponse<ReelComment>>(`/reels/${id}/comments`, { params }).then(r => r.data),

  addComment: (id: string, content: string) =>
    client.post<ApiResponse<ReelComment>>(`/reels/${id}/comment`, { content }).then(r => r.data),
};
