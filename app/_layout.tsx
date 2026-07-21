import { useEffect } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/stores/useAuthStore';
import { Toast } from '../src/components/ui/Toast';
import { AppAlert } from '../src/components/ui/AppAlert';
import { AppDrawer } from '../src/components/layout/AppDrawer';
import { useNotifications } from '../src/hooks/useNotifications';

// Keep the native splash visible while we load fonts and restore auth. This is
// the ONLY splash — the OS paints it before JS runs and we hold it until the app
// is ready, so there is no second (JS) splash layer on top of it.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isRestoring = useAuthStore((s) => s.isRestoring);
  const router = useRouter();

  // Initialize push notifications
  useNotifications();

  // Suppress "Unable to activate keep awake" from expo-keep-awake (used by expo-video)
  useEffect(() => {
    LogBox.ignoreLogs(['Unable to activate keep awake', 'Error: Unable to activate keep awake']);
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event?.reason?.message ?? String(event?.reason ?? '');
      if (typeof msg === 'string' && msg.includes('Unable to activate keep awake')) {
        event.preventDefault?.();
        event.stopPropagation?.();
      }
    };
    (global as any).onunhandledrejection = onUnhandledRejection;
    return () => {
      delete (global as any).onunhandledrejection;
    };
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'SplineSans-Regular': require('../assets/fonts/SplineSans-Regular.ttf'),
    'SplineSans-Medium': require('../assets/fonts/SplineSans-Medium.ttf'),
    'SplineSans-Bold': require('../assets/fonts/SplineSans-Bold.ttf'),
  });

  useEffect(() => {
    restoreSession();
  }, []);

  // Handle deep links for password reset
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const parsed = Linking.parse(url);

      // Handle reset-password deep link: reauxlabs://reset-password?token=xxx
      // Depending on the URL form, "reset-password" lands in either `path` or
      // `hostname` (a bare scheme://host puts it in hostname) — accept both.
      const target = (parsed.path ?? parsed.hostname ?? '').replace(/^\/+/, '');
      if (target === 'reset-password' && parsed.queryParams?.token) {
        const token = parsed.queryParams.token as string;
        router.push({
          pathname: '/(auth)/reset-password',
          params: { token },
        } as any);
      }
    };

    // Handle initial URL (app opened via link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URL while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Hide the native splash only once fonts are loaded AND the session has been
  // restored — so the single splash covers the whole boot and reveals the app
  // (login or dashboard) directly, with no intermediate flash.
  useEffect(() => {
    if ((fontsLoaded || fontError) && !isRestoring) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isRestoring]);

  // Wait for fonts before rendering
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="auto" />
        <Slot />
        <Toast />
        <AppAlert />
        <AppDrawer />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
