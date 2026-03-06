import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import type { EventSubscription } from 'expo-modules-core';
import {
  getPushNotificationToken,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  setBadgeCount,
  registerDeviceToken,
  removeDeviceToken,
} from '../services/notifications';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';

/**
 * Hook to manage push notifications throughout the app
 */
export function useNotifications() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  // Initialize notifications when user is logged in
  useEffect(() => {
    console.log('🔔 useNotifications effect triggered, user:', user ? user._id : 'null');

    if (!user) {
      console.log('⚠️ No user found, skipping notification initialization');
      return;
    }

    let isMounted = true;

    const initializeNotifications = async () => {
      console.log('🚀 Starting notification initialization...');
      setIsLoading(true);
      try {
        // Get push token
        console.log('📲 Requesting push token...');
        const token = await getPushNotificationToken();
        console.log('📲 Push token result:', token ? 'Success' : 'Failed');

        if (isMounted && token) {
          setExpoPushToken(token);
          console.log('📱 Push token ready:', token);

          // Register token with backend
          console.log('🔄 Registering token with backend...');
          try {
            await registerDeviceToken(token, user._id);
            console.log('✅ Token registration successful');
          } catch (registerError) {
            console.error('❌ Failed to register token with backend:', registerError);
            // Don't fail the whole flow if registration fails
          }
        } else if (!token) {
          console.error('❌ Failed to get push token');
        }
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeNotifications();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Listen for notifications
  useEffect(() => {
    // Notification received while app is in foreground
    notificationListener.current = addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received:', notification);
        // You can show a toast or update UI here
      }
    );

    // User tapped on notification
    responseListener.current = addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);

        // Navigate based on notification data
        const data = response.notification.request.content.data;

        if (data.type === 'order') {
          router.push(`/(app)/(shop)/invoice/${data.orderId}`);
        } else if (data.type === 'challenge') {
          router.push(`/(app)/(admin)/challenges`);
        } else if (data.type === 'membership') {
          router.push(`/(app)/(profile)/memberships`);
        } else {
          // Default: go to notifications screen
          router.push('/(app)/(profile)/notifications');
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      notificationListener.current = null;
      responseListener.current = null;
    };
  }, [router]);

  // Update badge count when unread count changes
  useEffect(() => {
    setBadgeCount(unreadCount);
  }, [unreadCount]);

  return {
    expoPushToken,
    isLoading,
  };
}
