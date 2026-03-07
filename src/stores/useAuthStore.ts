import { create } from 'zustand';
import { login, register, getMe, updateProfile, uploadAvatar } from '../api/endpoints/auth';
import type { UpdateProfileParams } from '../api/endpoints/auth';
import { getToken, setToken, removeToken, getItem, setItem } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import type { User } from '../types/models';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  uploadAvatar: (uri: string, type: string, fileName: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, _get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoring: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await login(email, password);
      const { token: authToken, user } = response.data;
      await setToken(authToken);
      set({ user: user as unknown as User, token: authToken, isAuthenticated: true, isLoading: false });

      // Only register push token if it hasn't been registered yet on this device
      try {
        const { getPushNotificationToken } = await import('../services/notifications');
        const { notificationsApi } = await import('../api/endpoints/notifications');
        const pushToken = await getPushNotificationToken();
        if (pushToken) {
          const registeredToken = await getItem(STORAGE_KEYS.PUSH_TOKEN);
          if (registeredToken !== pushToken) {
            await notificationsApi.registerDeviceToken(pushToken);
            await setItem(STORAGE_KEYS.PUSH_TOKEN, pushToken);
          }
        }
      } catch {
        // Don't fail login if token registration fails
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (name, email, password, phone) => {
    set({ isLoading: true, error: null });
    try {
      const response = await register({ name, email, password, phone });
      const { token: authToken, user } = response.data;
      await setToken(authToken);
      set({ user: user as unknown as User, token: authToken, isAuthenticated: true, isLoading: false });

      // Only register push token if it hasn't been registered yet on this device
      try {
        const { getPushNotificationToken } = await import('../services/notifications');
        const { notificationsApi } = await import('../api/endpoints/notifications');
        const pushToken = await getPushNotificationToken();
        if (pushToken) {
          const registeredToken = await getItem(STORAGE_KEYS.PUSH_TOKEN);
          if (registeredToken !== pushToken) {
            await notificationsApi.registerDeviceToken(pushToken);
            await setItem(STORAGE_KEYS.PUSH_TOKEN, pushToken);
          }
        }
      } catch {
        // Don't fail registration if token registration fails
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    await removeToken();
    // Clear cached push token so next login re-registers if needed
    const { removeItem } = await import('../utils/storage');
    await removeItem(STORAGE_KEYS.PUSH_TOKEN);
    set({ user: null, token: null, isAuthenticated: false, error: null });
    // Clear all stores that hold user-specific data
    const { useNotificationStore } = await import('./useNotificationStore');
    useNotificationStore.getState().reset();
  },

  restoreSession: async () => {
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        set({ isRestoring: false });
        return;
      }
      set({ token: storedToken });
      const response = await getMe();
      set({ user: response.data as unknown as User, isAuthenticated: true, isRestoring: false });
    } catch {
      await removeToken();
      set({ token: null, isRestoring: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const params: UpdateProfileParams = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        gymId: typeof data.gymId === 'string' ? data.gymId : undefined,
      };
      const response = await updateProfile(params);
      set({ user: response.data as unknown as User, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Update failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  uploadAvatar: async (uri: string, type: string, fileName: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await uploadAvatar(uri, type, fileName);
      set({ user: response.data as unknown as User, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Upload failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
