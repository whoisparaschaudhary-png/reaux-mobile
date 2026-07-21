import { create } from 'zustand';
import { haptics } from '../utils/haptics';

type ToastType = 'success' | 'error' | 'info';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  subtitle?: string;
  icon?: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
}

export interface AlertConfig {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

interface UIState {
  isGlobalLoading: boolean;
  toast: { message: string; type: ToastType; visible: boolean };
  alert: AlertConfig | null;
  isDrawerOpen: boolean;

  setGlobalLoading: (loading: boolean) => void;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

// Tracked so a rapid second toast doesn't leave the first one's timer to flip
// visibility back off at the wrong time.
let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  toast: { message: '', type: 'info', visible: false },
  alert: null,
  isDrawerOpen: false,

  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  showToast: (message, type = 'info') => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    if (type === 'success') haptics.success();
    else if (type === 'error') haptics.error();
    set({ toast: { message, type, visible: true } });
    toastTimeoutId = setTimeout(() => {
      set((state) => ({ toast: { ...state.toast, visible: false } }));
      toastTimeoutId = null;
    }, 3000);
  },

  hideToast: () => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    toastTimeoutId = null;
    set((state) => ({ toast: { ...state.toast, visible: false } }));
  },

  showAlert: (config) => set({ alert: config }),
  hideAlert: () => set({ alert: null }),
}));

/**
 * Same signature as Alert.alert - use across the app for consistent modal UI.
 * Usage: showAppAlert('Title', 'Message', [ { text: 'OK', onPress: () => {} }, { text: 'Cancel', style: 'cancel' } ])
 */
export function showAppAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  const defaultButtons: AlertButton[] = [{ text: 'OK', style: 'default' }];
  useUIStore.getState().showAlert({
    title,
    message: message ?? '',
    buttons: buttons ?? defaultButtons,
  });
}
