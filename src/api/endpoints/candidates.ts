import client from '../client';
import type { ApiResponse } from '../types';
import type { Membership } from '../../types/models';
import type { CreateCandidateRequest } from '../../types/api';

/**
 * Streamlined gym-member ("candidate") management for admins — matches the
 * "Add a Candidate" / "Remove Candidate" design. Creating a candidate in one
 * step (name + phone + monthly fees + start date + avatar) needs a dedicated
 * backend endpoint; see docs/BACKEND_REQUIREMENTS.md. Listing reuses the
 * existing memberships API (membershipsApi.list({ gymId })).
 */
export const candidatesApi = {
  create: (data: CreateCandidateRequest | FormData) =>
    client
      .post<ApiResponse<Membership>>('/gyms/candidates', data, data instanceof FormData ? {
        headers: { 'Content-Type': 'multipart/form-data' },
      } : undefined)
      .then((r) => r.data),

  remove: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/gyms/candidates/${id}`).then((r) => r.data),
};
