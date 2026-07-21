import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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
    console.log('📲 getPushNotificationToken: Starting...');
    console.log('📲 Device.isDevice:', Device.isDevice);
    console.log('📲 Platform:', Platform.OS);

    // Push tokens can only be issued on a physical device. On simulators/emulators
    // there is no APNs/FCM environment, so getDevicePushTokenAsync() throws a native
    // "no valid aps-environment entitlement" error. Skip cleanly instead of erroring.
    if (!Device.isDevice) {
      console.log('ℹ️ Skipping push token — only available on a physical device.');
      return null;
    }

    // Request permissions first
    console.log('📲 Requesting notification permissions...');
    const hasPermission = await requestNotificationPermissions();
    console.log('📲 Permission granted:', hasPermission);

    if (!hasPermission) {
      console.log('⚠️ Permission denied');
      return null;
    }

    // Get the native FCM token (for Firebase Admin SDK)
    console.log('📲 Getting native FCM push token...');
    const token = await Notifications.getDevicePushTokenAsync();

    console.log('✅ Push notification token:', token.data);

    // For Android, set up notification channel
    if (Platform.OS === 'android') {
      console.log('📲 Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F9F506', // Your primary yellow color
        sound: 'default',
      });
      console.log('✅ Android notification channel created');
    }

    return token.data;
  } catch (error) {
    console.error('❌ Error getting push notification token:', error);
    return null;
  }
}

/**
 * Send device token to backend
 */
export async function registerDeviceToken(token: string, userId: string): Promise<void> {
  try {
    const { notificationsApi } = await import('../api/endpoints/notifications');
    await notificationsApi.registerDeviceToken(token);
    console.log('✅ Device token registered with backend:', { token, userId });
  } catch (error) {
    console.error('❌ Failed to register device token:', error);
    throw error;
  }
}

/**
 * Remove device token from backend
 */
export async function removeDeviceToken(token: string): Promise<void> {
  try {
    const { notificationsApi } = await import('../api/endpoints/notifications');
    await notificationsApi.removeDeviceToken(token);
    console.log('✅ Device token removed from backend:', token);
  } catch (error) {
    console.error('❌ Failed to remove device token:', error);
    throw error;
  }
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
