import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { colors, fontFamily, layout } from '../../src/theme';

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

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
          title: isAdmin ? 'Members' : 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isAdmin ? 'people-outline' : 'home-outline'} size={size} color={color} />
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
