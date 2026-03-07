import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { Reel, Comment } from '../../types/models';

export type ReelDetailResponse = Reel & { comments?: Comment[] };

export const reelsApi = {
  list: (params?: PaginationParams) =>
    client.get<PaginatedResponse<Reel>>('/reels', { params }).then(r => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<ReelDetailResponse>>(`/reels/${id}`).then(r => r.data),

  create: (data: FormData) =>
    client
      .post<ApiResponse<Reel>>('/reels', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      })
      .then(r => r.data),

  like: (id: string) =>
    client.post<ApiResponse<Reel>>(`/reels/${id}/like`).then(r => r.data),

  comment: (id: string, content: string) =>
    client
      .post<ApiResponse<Comment>>(`/reels/${id}/comment`, { content })
      .then(r => r.data),
};
