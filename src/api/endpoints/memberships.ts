import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { MembershipPlan, Membership } from '../../types/models';

// ─── Request Types ───────────────────────────────────────────────────

export interface CreateMembershipPlanRequest {
  name: string;
  gymId: string;
  durationDays: number;
  price: number;
  features?: string[];
  description?: string;
}

export interface UpdateMembershipPlanRequest {
  name?: string;
  durationDays?: number;
  price?: number;
  features?: string[];
  description?: string;
  isActive?: boolean;
}

export interface AssignMembershipRequest {
  userId: string;
  planId: string;
  startDate: string;
}

export interface RecordFeesRequest {
  amount: number;
  note?: string;
}

// ─── Plans API ───────────────────────────────────────────────────────

export const membershipPlansApi = {
  /**
   * List all membership plans (admin/superadmin)
   * Supports optional gymId filter
   */
  list: (params?: PaginationParams & { gymId?: string }) =>
    client
      .get<PaginatedResponse<MembershipPlan>>('/memberships/plans', { params })
      .then((r) => r.data),

  /**
   * Get membership plan by ID
   */
  getById: (id: string) =>
    client
      .get<ApiResponse<MembershipPlan>>(`/memberships/plans/${id}`)
      .then((r) => r.data),

  /**
   * Create new membership plan (superadmin)
   */
  create: (data: CreateMembershipPlanRequest) =>
    client
      .post<ApiResponse<MembershipPlan>>('/memberships/plans', data)
      .then((r) => r.data),

  /**
   * Update membership plan (superadmin)
   */
  update: (id: string, data: UpdateMembershipPlanRequest) =>
    client
      .put<ApiResponse<MembershipPlan>>(`/memberships/plans/${id}`, data)
      .then((r) => r.data),

  /**
   * Soft delete membership plan (superadmin)
   */
  delete: (id: string) =>
    client
      .delete<ApiResponse<{ message: string }>>(`/memberships/plans/${id}`)
      .then((r) => r.data),
};

// ─── Memberships API ─────────────────────────────────────────────────

export const membershipsApi = {
  /**
   * Assign membership to user (admin/superadmin)
   */
  assign: (data: AssignMembershipRequest) =>
    client
      .post<ApiResponse<Membership>>('/memberships/assign', data)
      .then((r) => r.data),

  /**
   * List user memberships with filters (admin/superadmin)
   */
  list: (
    params?: PaginationParams & { userId?: string; gymId?: string; status?: string }
  ) =>
    client
      .get<PaginatedResponse<Membership>>('/memberships', { params })
      .then((r) => r.data),

  /**
   * Get my memberships (any user)
   */
  getMyMemberships: (params?: PaginationParams) =>
    client
      .get<PaginatedResponse<Membership>>('/memberships/my', { params })
      .then((r) => r.data),

  /**
   * Get membership by ID
   */
  getById: (id: string) =>
    client.get<ApiResponse<Membership>>(`/memberships/${id}`).then((r) => r.data),

  /**
   * Cancel membership (admin/superadmin)
   */
  cancel: (id: string) =>
    client
      .patch<ApiResponse<Membership>>(`/memberships/${id}/cancel`)
      .then((r) => r.data),

  /**
   * Record a fee payment for a membership (admin/superadmin)
   */
  recordFees: (id: string, data: RecordFeesRequest) =>
    client
      .put<ApiResponse<Membership>>(`/memberships/${id}/fees`, data)
      .then((r) => r.data),

  /**
   * Apply advance credit toward pending fees (admin/superadmin)
   * feesPaid += amount, advanceCredit -= amount, capped at min(amount, advanceCredit)
   */
  applyCredit: (id: string, amount: number) =>
    client
      .post<ApiResponse<Membership>>(`/memberships/${id}/apply-credit`, { amount })
      .then((r) => r.data),
};
