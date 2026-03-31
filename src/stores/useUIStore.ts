import { create } from 'zustand';

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

  setGlobalLoading: (loading: boolean) => void;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  toast: { message: '', type: 'info', visible: false },
  alert: null,

  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type, visible: true } });
    setTimeout(() => {
      set((state) => ({ toast: { ...state.toast, visible: false } }));
    }, 3000);
  },

  hideToast: () => set((state) => ({ toast: { ...state.toast, visible: false } })),

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
