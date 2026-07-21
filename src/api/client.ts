import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { router } from 'expo-router';
import { API_URL } from '../utils/constants';
import { getToken, removeToken } from '../utils/storage';
import type { ApiError } from './types';

// ─── Axios instance ─────────────────────────────────────────────────

const client = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach JWT ────────────────────────────────

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor: handle errors ────────────────────────────

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear BOTH the secure token and the in-memory
      // auth store, else isAuthenticated stays true and stale authed UI persists.
      // Lazy require avoids a circular import (store → auth api → this client).
      await removeToken();
      let wasAuthenticated = true;
      try {
        const { useAuthStore } = require('../stores/useAuthStore');
        wasAuthenticated = useAuthStore.getState().isAuthenticated;
        useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
      } catch {
        // store not ready — token removal + redirect still applied
      }
      // Only redirect on the transition from authed → logged-out. Concurrent
      // boot requests can each 401; without this guard every one fires its own
      // router.replace, causing the "verified multiple times" navigation churn.
      // While restoring (not yet authenticated), index.tsx handles the redirect.
      if (wasAuthenticated) {
        router.replace('/(auth)/login');
      }
    }

    // Normalize error into a consistent shape
    const data = error.response?.data;
    let message = data?.message || error.message || 'An unexpected error occurred';

    // If the server returned a generic "Validation error", surface the specific
    // field errors so the user knows exactly what's missing/wrong instead of a
    // vague toast. Newer backend builds already return a specific message (which
    // won't match this check, so it's used as-is).
    const fieldErrors = (data?.errors as { fieldErrors?: Record<string, string[]> } | undefined)
      ?.fieldErrors;
    if (fieldErrors && /^validation error$/i.test(message)) {
      const parts = Object.values(fieldErrors)
        .flat()
        .filter((m): m is string => typeof m === 'string' && m.trim().length > 0);
      if (parts.length) message = parts.slice(0, 4).join('\n');
    }

    const normalized: ApiError = {
      success: false,
      message,
      errors: data?.errors,
    };

    return Promise.reject(normalized);
  },
);

export default client;
