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
    if (!user) return;

    let isMounted = true;

    const initializeNotifications = async () => {
      setIsLoading(true);
      try {
        const token = await getPushNotificationToken();
        if (isMounted && token) {
          setExpoPushToken(token);
          try {
            await registerDeviceToken(token, user._id);
          } catch {
            // Don't fail if registration fails
          }
        }
      } catch {
        // Ignore errors
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeNotifications();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Listen for notifications
  useEffect(() => {
    notificationListener.current = addNotificationReceivedListener(
      (_notification) => {
        // Foreground notification received
      }
    );

    responseListener.current = addNotificationResponseReceivedListener(
      (response) => {

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
