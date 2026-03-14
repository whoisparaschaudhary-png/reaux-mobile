import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { User, Role, UserStatus, Gender, BirthdayUser, UpcomingBirthdayUser, SavedAddress } from '../../types/models';

interface UpdateUserPayload {
  name?: string;
  phone?: string;
  role?: Role;
  gymId?: string;
  gender?: Gender;
  dateOfBirth?: string;
  status?: UserStatus;
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
  gymId?: string;
  gender: Gender;
  dateOfBirth: string;
  dateOfJoining?: string;
  status?: UserStatus;
}

export const usersApi = {
  getUsers: (params?: PaginationParams) =>
    client.get<PaginatedResponse<User>>('/users', { params }).then(r => r.data),

  getUserById: (id: string) =>
    client.get<ApiResponse<User>>(`/users/${id}`).then(r => r.data),

  createUser: (payload: CreateUserPayload) =>
    client.post<ApiResponse<User>>('/users', payload).then(r => r.data),

  updateUserRole: (id: string, role: Role) =>
    client.put<ApiResponse<User>>(`/users/${id}/role`, { role }).then(r => r.data),

  updateUserStatus: (id: string, status: UserStatus) =>
    client.put<ApiResponse<User>>(`/users/${id}/status`, { status }).then(r => r.data),

  updateUser: (id: string, payload: UpdateUserPayload) =>
    client.put<ApiResponse<User>>(`/users/${id}`, payload).then(r => r.data),

  getTodayBirthdays: () =>
    client.get<ApiResponse<BirthdayUser[]>>('/users/birthdays/today').then(r => r.data),

  getUpcomingBirthdays: (days = 7) =>
    client.get<ApiResponse<UpcomingBirthdayUser[]>>('/users/birthdays/upcoming', { params: { days } }).then(r => r.data),
};

export const addressesApi = {
  list: () =>
    client.get<ApiResponse<SavedAddress[]>>('/users/addresses').then(r => r.data),

  add: (payload: { label: string; street: string; city: string; state: string; pincode: string; phone: string; isDefault?: boolean }) =>
    client.post<ApiResponse<SavedAddress>>('/users/addresses', payload).then(r => r.data),

  update: (id: string, payload: Partial<{ label: string; street: string; city: string; state: string; pincode: string; phone: string; isDefault: boolean }>) =>
    client.put<ApiResponse<SavedAddress>>(`/users/addresses/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    client.delete<ApiResponse<{ message: string }>>(`/users/addresses/${id}`).then(r => r.data),
};
