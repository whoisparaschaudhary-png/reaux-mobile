import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { ContentReport, ReportContentType, ReportReason, ReportStatus, User } from '../../types/models';

export interface CreateReportRequest {
  contentType: Exclude<ReportContentType, 'user'>;
  contentId: string;
  reason: Exclude<ReportReason, 'blocked_user'>;
  details?: string;
}

export const moderationApi = {
  // Flag objectionable content — the team reviews reports within 24 hours.
  report: (data: CreateReportRequest) =>
    client.post<ApiResponse<ContentReport>>('/moderation/reports', data).then(r => r.data),

  blockUser: (userId: string) =>
    client.post<ApiResponse<{ blocked: boolean }>>(`/moderation/block/${userId}`).then(r => r.data),

  unblockUser: (userId: string) =>
    client.delete<ApiResponse<{ blocked: boolean }>>(`/moderation/block/${userId}`).then(r => r.data),

  getBlockedUsers: () =>
    client.get<ApiResponse<User[]>>('/moderation/blocked').then(r => r.data),

  // Admin moderation queue
  listReports: (params?: PaginationParams & { status?: ReportStatus }) =>
    client.get<PaginatedResponse<ContentReport>>('/moderation/reports', { params }).then(r => r.data),

  resolveReport: (id: string, action: 'remove' | 'dismiss', ejectUser?: boolean) =>
    client
      .patch<ApiResponse<ContentReport>>(`/moderation/reports/${id}`, { action, ejectUser })
      .then(r => r.data),
};
