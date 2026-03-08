import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return false;
  }

  return true;
}

/**
 * Get the device's push notification token
 * This token should be sent to your backend to send notifications
 */
export async function getPushNotificationToken(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const token = await Notifications.getDevicePushTokenAsync();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F9F506',
        sound: 'default',
      });
    }

    return token.data;
  } catch {
    return null;
  }
}

/**
 * Send device token to backend
 */
export async function registerDeviceToken(token: string, userId: string): Promise<void> {
  const { notificationsApi } = await import('../api/endpoints/notifications');
  await notificationsApi.registerDeviceToken(token);
}

/**
 * Remove device token from backend
 */
export async function removeDeviceToken(token: string): Promise<void> {
  const { notificationsApi } = await import('../api/endpoints/notifications');
  await notificationsApi.removeDeviceToken(token);
}

/**
 * Listen for notification received while app is in foreground
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listen for notification tap/interaction
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get badge count (unread notifications)
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification 🎉',
      body: 'This is a test notification from REAUX Labs',
      data: { test: true },
      sound: 'default',
    },
    trigger: null, // Show immediately
  });
}
