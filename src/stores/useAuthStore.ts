import { create } from 'zustand';
import { login, register, getMe, updateProfile, uploadAvatar } from '../api/endpoints/auth';
import type { UpdateProfileParams } from '../api/endpoints/auth';
import { getToken, setToken, removeToken } from '../utils/storage';
import { resetAllStores } from './resetAllStores';
import type { User } from '../types/models';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, dateOfBirth?: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  uploadAvatar: (uri: string, type: string, fileName: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
      // Clear all store data before setting new user — prevents stale data from previous session
      resetAllStores();
      set({ user: user as unknown as User, token: authToken, isAuthenticated: true, isLoading: false });

      // Register device token immediately after login
      try {
        const { getPushNotificationToken } = await import('../services/notifications');
        const { notificationsApi } = await import('../api/endpoints/notifications');
        const pushToken = await getPushNotificationToken();
        if (pushToken) {
          await notificationsApi.registerDeviceToken(pushToken);
          console.log('✅ Device token registered after login');
        }
      } catch (tokenError) {
        console.error('Failed to register device token after login:', tokenError);
        // Don't fail login if token registration fails
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (name, email, password, phone, dateOfBirth) => {
    set({ isLoading: true, error: null });
    try {
      const response = await register({ name, email, password, phone, dateOfBirth });
      const { token: authToken, user } = response.data;
      await setToken(authToken);
      set({ user: user as unknown as User, token: authToken, isAuthenticated: true, isLoading: false });

      // Register device token immediately after registration
      try {
        const { getPushNotificationToken } = await import('../services/notifications');
        const { notificationsApi } = await import('../api/endpoints/notifications');
        const pushToken = await getPushNotificationToken();
        if (pushToken) {
          await notificationsApi.registerDeviceToken(pushToken);
          console.log('✅ Device token registered after registration');
        }
      } catch (tokenError) {
        console.error('Failed to register device token after registration:', tokenError);
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
    resetAllStores();
    set({ user: null, token: null, isAuthenticated: false, error: null });
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
