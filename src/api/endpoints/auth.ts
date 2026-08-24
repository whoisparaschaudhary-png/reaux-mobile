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
  gender?: 'male' | 'female' | 'other';
  gymId?: string;
}

export interface UpdateProfileParams {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  height?: number;
  weight?: number;
  dateOfBirth?: string;
  gender?: string;
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

// Soft-deletes the account server-side (status='deleted' + PII anonymized).
// Backend requires the current password to confirm.
export async function deleteAccount(
  password: string,
): Promise<ApiResponse<null>> {
  const { data } = await client.delete<ApiResponse<null>>('/auth/account', {
    data: { password },
    // A 401 here means "incorrect password" — surface it in the confirm UI
    // instead of letting the interceptor kill the session.
    skipAuthLogout: true,
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
    // The DEPLOYED backend validator expects `password` (auth.validator.js
    // resetPasswordSchema), even though docs/API.md §1.6 says `newPassword`.
    // Verified live: {token,password} passes validation; {token,newPassword}
    // fails with "Password is required".
    { token, password: newPassword },
  );
  return data;
}
