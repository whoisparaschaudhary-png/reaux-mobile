import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { colors, fontFamily, spacing } from '../theme';
import { ms } from '../../utils/responsive';

interface AppTopBarProps {
  title: string;
  onSearch?: () => void;
  showCommunity?: boolean;
  /** Shop only: My Orders was previously unreachable except from checkout success. */
  showOrders?: boolean;
  style?: ViewStyle;
}

/**
 * Shared top bar for the main tab screens (Feed, Community, …) matching the
 * redesign: hamburger + title on the left; search / community / bell / avatar
 * actions on the right. Self-wires the drawer, notifications badge, and profile.
 */
export const AppTopBar: React.FC<AppTopBarProps> = ({
  title,
  onSearch,
  showCommunity = true,
  showOrders = false,
  style,
}) => {
  const openDrawer = useUIStore((s) => s.openDrawer);
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const getUnreadCount = useNotificationStore((s) => s.getUnreadCount);

  useEffect(() => {
    getUnreadCount();
  }, [getUnreadCount]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <TouchableOpacity onPress={openDrawer} hitSlop={8} activeOpacity={0.7} style={styles.menuButton}>
          <Ionicons name="menu" size={ms(26)} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.right}>
        {onSearch ? (
          <TouchableOpacity onPress={onSearch} hitSlop={6} activeOpacity={0.7}>
            <Ionicons name="search" size={ms(22)} color={colors.text.primary} />
          </TouchableOpacity>
        ) : null}

        {showOrders ? (
          <TouchableOpacity
            onPress={() => router.push('/(app)/(shop)/orders' as any)}
            hitSlop={6}
            activeOpacity={0.7}
            accessibilityLabel="My orders"
          >
            <Ionicons name="receipt-outline" size={ms(22)} color={colors.text.primary} />
          </TouchableOpacity>
        ) : null}

        {showCommunity ? (
          <TouchableOpacity
            onPress={() => router.push('/(app)/(community)' as any)}
            hitSlop={6}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={ms(22)} color={colors.text.primary} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => router.push('/(app)/(profile)/notifications' as any)}
          hitSlop={6}
          activeOpacity={0.7}
          style={styles.bell}
        >
          <Ionicons name="notifications-outline" size={ms(22)} color={colors.text.primary} />
          {unreadCount > 0 ? <View style={styles.dot} /> : null}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(app)/(profile)' as any)} activeOpacity={0.7}>
          <Avatar uri={user?.avatar} name={user?.name || 'Me'} size={ms(32)} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.light,
    zIndex: 10,
    // Subtle floating separation from content scrolling beneath.
    shadowColor: '#1c1c0d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuButton: {
    marginLeft: -spacing.xs,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: ms(22),
    lineHeight: ms(28),
    color: colors.text.primary,
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  bell: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: -ms(2),
    right: -ms(2),
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: colors.status.error,
  },
});
