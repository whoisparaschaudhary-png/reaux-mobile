import client from '../client';
import type { ApiResponse } from '../types';

// ─── Types ──────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  gymId?: string;
  role: string;
  createdAt: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  gymId?: string;
}

export interface UpdateProfileParams {
  name?: string;
  email?: string;
  phone?: string;
  gymId?: string;
}

// ─── Endpoints ──────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
): Promise<ApiResponse<AuthPayload>> {
  const { data } = await client.post<ApiResponse<AuthPayload>>(
    '/auth/login',
    { email, password },
  );
  return data;
}

export async function register(
  params: RegisterParams,
): Promise<ApiResponse<AuthPayload>> {
  const { data } = await client.post<ApiResponse<AuthPayload>>(
    '/auth/register',
    params,
  );
  return data;
}

export async function getMe(): Promise<ApiResponse<User>> {
  const { data } = await client.get<ApiResponse<User>>('/auth/me');
  return data;
}

export async function updateProfile(
  params: UpdateProfileParams,
): Promise<ApiResponse<User>> {
  const { data } = await client.put<ApiResponse<User>>(
    '/auth/profile',
    params,
  );
  return data;
}

export async function uploadAvatar(
  uri: string,
  type: string,
  fileName: string,
): Promise<ApiResponse<User>> {
  const form = new FormData();
  form.append('avatar', {
    uri,
    type,
    name: fileName,
  } as any);

  const { data } = await client.put<ApiResponse<User>>('/auth/profile', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function forgotPassword(
  email: string,
): Promise<ApiResponse<null>> {
  const { data } = await client.post<ApiResponse<null>>(
    '/auth/forgot-password',
    { email },
  );
  return data;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ApiResponse<null>> {
  const { data } = await client.post<ApiResponse<null>>(
    '/auth/reset-password',
    { token, password: newPassword },
  );
  return data;
}
