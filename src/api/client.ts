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
      try {
        const { useAuthStore } = require('../stores/useAuthStore');
        useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
      } catch {
        // store not ready — token removal + redirect still applied
      }
      router.replace('/(auth)/login');
    }

    // Normalize error into a consistent shape
    const normalized: ApiError = {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',
      errors: error.response?.data?.errors,
    };

    return Promise.reject(normalized);
  },
);

export default client;
