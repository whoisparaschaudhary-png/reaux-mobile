import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { colors, fontFamily, layout } from '../../src/theme';
import { haptics } from '../../src/utils/haptics';
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
      screenListeners={{ tabPress: () => haptics.selection() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.yellow,
        tabBarInactiveTintColor: colors.text.light,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.background.white,
          // Soft floating shadow instead of a hard hairline border (premium feel).
          borderTopWidth: 0,
          height: layout.tabBarHeight + insets.bottom,
          paddingBottom: ms(14) + insets.bottom,
          paddingTop: ms(8),
          shadowColor: '#1c1c0d',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          // 6 tabs — keep labels compact so the longest ("Community") never truncates.
          fontSize: ms(9),
          letterSpacing: -0.2,
          marginTop: ms(2),
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
      }}
    >
      {/* Visible tabs — Feed · Reels · Diet · BMI · Community · Shop.
          Profile is route-only (reached from the header avatar). Reels now lives in
          the bottom bar (moved out of the app drawer) right after Feed, matching the
          IG/TikTok convention. */}
      <Tabs.Screen
        name="(feed)"
        options={{
          title: isAdmin ? 'Members' : 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(reels)"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('(reels)', { screen: 'index' });
          },
        })}
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
            <Ionicons name="nutrition-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(health)"
        options={{
          title: 'BMI',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(community)"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('(community)', { screen: 'index' });
          },
        })}
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
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
            <Ionicons name="bag-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Route-only groups (no tab). Profile → header avatar. */}
      <Tabs.Screen
        name="(profile)"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="(cycles)"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="(legal)"
        options={{
          href: null,
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
