import { useEffect } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenCapture from 'expo-screen-capture';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/stores/useAuthStore';
import { Toast } from '../src/components/ui/Toast';
import { AppAlert } from '../src/components/ui/AppAlert';
import { useNotifications } from '../src/hooks/useNotifications';

// Keep splash visible while we load fonts and restore auth
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
    // Ensure screenshots and screen recording are allowed
    ScreenCapture.allowScreenCaptureAsync();
  }, []);

  // Handle deep links for password reset
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const parsed = Linking.parse(url);

      // Handle reset-password deep link: reauxlabs://reset-password?token=xxx
      if (parsed.path === 'reset-password' && parsed.queryParams?.token) {
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
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
