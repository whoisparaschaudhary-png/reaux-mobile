import * as Haptics from 'expo-haptics';

/**
 * Thin, crash-safe wrapper around expo-haptics. Every call is fire-and-forget
 * and swallows errors (haptics are unsupported on simulators / some devices).
 *
 * Usage:
 *   haptics.light()      // taps, toggles, selections
 *   haptics.medium()     // likes, add-to-cart, confirm
 *   haptics.success()    // completed action (order placed, saved)
 *   haptics.error()      // validation / failure
 */
export const haptics = {
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
  selection: () => {
    Haptics.selectionAsync().catch(() => {});
  },
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
