import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { LEGAL_MENU } from '../../utils/legalContent';
import { colors, fontFamily, typography, spacing } from '../theme';
import { ms } from '../../utils/responsive';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(ms(300), SCREEN_WIDTH * 0.82);

export const AppDrawer: React.FC = () => {
  const isDrawerOpen = useUIStore((s) => s.isDrawerOpen);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isDrawerOpen) {
      setVisible(true);
      translateX.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 260 });
    } else if (visible) {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 200, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setVisible)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const handleNavigate = (slug: string) => {
    closeDrawer();
    router.push(`/(app)/(legal)/${slug}` as any);
  };

  const handleRoute = (path: string) => {
    closeDrawer();
    router.push(path as any);
  };

  // App sections that are not bottom tabs in the redesign but must stay reachable.
  // (Reels moved to the bottom tab bar, so it is no longer listed here.)
  const APP_MENU: { label: string; icon: keyof typeof Ionicons.glyphMap; path: string }[] = [
    { label: 'My Profile', icon: 'person-outline', path: '/(app)/(profile)' },
  ];

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={closeDrawer} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        </Animated.View>

        <Animated.View style={[styles.panel, { paddingTop: insets.top + spacing.lg }, panelStyle]}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {user?.name || 'Menu'}
            </Text>
            <TouchableOpacity onPress={closeDrawer} hitSlop={8} activeOpacity={0.7}>
              <Ionicons name="close" size={ms(24)} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.menu}>
            {APP_MENU.map((item) => (
              <TouchableOpacity
                key={item.path}
                style={styles.menuItem}
                onPress={() => handleRoute(item.path)}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={ms(20)} color={colors.text.secondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.menu}>
            {LEGAL_MENU.map((item) => (
              <TouchableOpacity
                key={item.slug}
                style={styles.menuItem}
                onPress={() => handleNavigate(item.slug)}
                activeOpacity={0.7}
              >
                <Ionicons name="document-text-outline" size={ms(20)} color={colors.text.secondary} />
                <Text style={styles.menuLabel}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.medium,
  },
  panel: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  menu: {
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.gray,
    marginVertical: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  menuLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
});
