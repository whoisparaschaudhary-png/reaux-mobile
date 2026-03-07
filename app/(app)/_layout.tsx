import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { colors, fontFamily, layout } from '../../src/theme';

function debugLog(p: { location: string; message: string; data?: Record<string, unknown>; hypothesisId?: string }) {
  const body = { sessionId: '1c7f0b', runId: 'run1', hypothesisId: p.hypothesisId ?? 'E', location: p.location, message: p.message, data: p.data ?? {}, timestamp: Date.now() };
  fetch('http://127.0.0.1:7927/ingest/9dae40e1-b3fb-4628-a12e-08648e00da2b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1c7f0b' }, body: JSON.stringify(body) }).catch(() => {});
}

export default function AppLayout() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // #region agent log
  useEffect(() => {
    debugLog({ location: 'app/(app)/_layout.tsx:AppLayout', message: 'App tabs mounted', data: { role: user?.role }, hypothesisId: 'E' });
  }, [user?.role]);
  // #endregion

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.yellow,
        tabBarInactiveTintColor: colors.text.light,
        tabBarStyle: {
          backgroundColor: colors.background.white,
          borderTopColor: colors.border.light,
          borderTopWidth: 1,
          height: layout.tabBarHeight,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="(feed)"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(reels)"
        options={{
          title: 'Reels',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(diet)"
        options={{
          title: 'Diet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(health)"
        options={{
          title: 'BMI',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
          ...({
            listeners: {
              tabPress: () => {
                router.replace('/(app)/(health)' as any);
              },
            },
          } as any),
        }}
      />
      <Tabs.Screen
        name="(shop)"
        options={
          isAdmin
            ? {
                title: 'Shop',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="storefront-outline" size={size} color={color} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(admin)"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
