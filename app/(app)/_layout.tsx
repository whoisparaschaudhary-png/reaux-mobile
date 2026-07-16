import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { colors, fontFamily, layout } from '../../src/theme';
import { ms } from '../../src/utils/responsive';

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isRestoring = useAuthStore((s) => s.isRestoring);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const insets = useSafeAreaInsets();

  // Never render the authenticated tabs for a logged-out user (e.g. after a 401
  // clears the session) — redirect to login instead of flashing the dashboard.
  if (!isRestoring && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

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
          height: layout.tabBarHeight + insets.bottom,
          paddingBottom: ms(14) + insets.bottom,
          paddingTop: ms(6),
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: ms(11),
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('(diet)', { screen: 'index' });
          },
        })}
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('(shop)', { screen: 'index' });
          },
        })}
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
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
