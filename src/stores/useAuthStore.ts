import { create } from 'zustand';
import { login, register, getMe, updateProfile, uploadAvatar } from '../api/endpoints/auth';
import type { UpdateProfileParams } from '../api/endpoints/auth';
import { getToken, setToken, removeToken, getItem, setItem, removeItem } from '../utils/storage';
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
  register: (name: string, email: string, password: string, phone?: string, dateOfBirth?: string) => Promise<void>;
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
      await setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
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

  register: async (name, email, password, phone, dateOfBirth) => {
    set({ isLoading: true, error: null });
    try {
      const response = await register({ name, email, password, phone, dateOfBirth });
      const { token: authToken, user } = response.data;
      await setToken(authToken);
      await setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
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
    await removeItem(STORAGE_KEYS.PUSH_TOKEN);
    await removeItem(STORAGE_KEYS.USER_DATA);
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

      // Restore from cache immediately so app opens without waiting for network
      const cachedUser = await getItem(STORAGE_KEYS.USER_DATA);
      if (cachedUser) {
        set({
          token: storedToken,
          user: JSON.parse(cachedUser) as User,
          isAuthenticated: true,
          isRestoring: false,
        });
        // Refresh profile in background (don't await)
        getMe()
          .then((response) => {
            const freshUser = response.data as unknown as User;
            set({ user: freshUser });
            setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(freshUser));
          })
          .catch(() => {
            // Token expired — clear and force re-login
            removeToken();
            removeItem(STORAGE_KEYS.USER_DATA);
            set({ user: null, token: null, isAuthenticated: false });
          });
        return;
      }

      // No cache — fall back to blocking network call
      set({ token: storedToken });
      const response = await getMe();
      const user = response.data as unknown as User;
      await setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      set({ user, isAuthenticated: true, isRestoring: false });
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
