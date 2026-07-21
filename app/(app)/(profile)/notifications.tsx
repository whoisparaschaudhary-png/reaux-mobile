import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { NotificationCard } from '../../../src/components/cards/NotificationCard';
import { useNotificationStore } from '../../../src/stores/useNotificationStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { formatDate, formatRelative } from '../../../src/utils/formatters';
import {
  colors,
  fontFamily,
  spacing,
  borderRadius,
  layout,
} from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';
import type { Notification, NotificationType } from '../../../src/types/models';

type TabKey = 'all' | 'unread' | 'activity';

const NOTIFICATION_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  order:        'cart-outline',
  challenge:    'trophy-outline',
  community:    'people-outline',
  diet:         'leaf-outline',
  system:       'settings-outline',
  announcement: 'megaphone-outline',
};

const NOTIFICATION_ICON_COLOR: Record<string, string> = {
  order:        colors.status.info,
  challenge:    colors.status.warning,
  community:    colors.status.success,
  diet:         colors.status.success,
  system:       colors.text.secondary,
  announcement: colors.primary.yellowDark,
};

const NOTIFICATION_ICON_BG: Record<string, string> = {
  order:        '#dbeafe',
  challenge:    '#fef3c7',
  community:    '#dcfce7',
  diet:         '#dcfce7',
  system:       colors.border.light,
  announcement: colors.primary.yellowLight,
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'activity', label: 'Activity' },
];

const ACTIVITY_TYPES: NotificationType[] = ['community', 'challenge'];

export default function NotificationsScreen() {
  const {
    notifications,
    isLoading,
    isRefreshing,
    pagination,
    unreadCount,
    fetchNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'superadmin';

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [detailNotification, setDetailNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.isRead);
      case 'activity':
        return notifications.filter((n) =>
          ACTIVITY_TYPES.includes(n.type),
        );
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  // Group notifications by date
  const groupedData = useMemo(() => {
    const groups: { title: string; data: Notification[] }[] = [];
    const map = new Map<string, Notification[]>();

    filteredNotifications.forEach((n) => {
      const dateKey = formatDate(n.createdAt);
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(n);
    });

    map.forEach((data, title) => {
      groups.push({ title, data });
    });

    return groups;
  }, [filteredNotifications]);

  // Compute date range label
  const dateRangeLabel = useMemo(() => {
    if (notifications.length === 0) return '';
    const dates = notifications.map((n) => new Date(n.createdAt));
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
    const formatShort = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${formatShort(earliest)} - ${formatShort(latest)}`;
  }, [notifications]);

  const handleLoadMore = useCallback(() => {
    if (
      !isLoading &&
      pagination.page < pagination.pages
    ) {
      fetchNotifications(pagination.page + 1);
    }
  }, [isLoading, pagination, fetchNotifications]);

  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Superadmin: navigate to related detail or show metadata
    if (isSuperAdmin) {
      const meta = notification.metadata ?? {};

      switch (notification.type) {
        case 'order':
          if (meta.orderId) {
            router.push(`/(app)/(admin)/orders/${meta.orderId}`);
          } else {
            setDetailNotification(notification);
          }
          break;
        case 'community':
          if (meta.postId) {
            router.push(`/(app)/(feed)/${meta.postId}`);
          } else if (meta.reelId) {
            router.push(`/(app)/(reels)/${meta.reelId}`);
          } else {
            setDetailNotification(notification);
          }
          break;
        case 'challenge':
          router.push('/(app)/(admin)/challenges');
          break;
        default:
          setDetailNotification(notification);
          break;
      }
    }
  }, [markAsRead, isSuperAdmin]);

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationCard
        notification={item}
        onPress={handleNotificationPress}
        onMarkAsRead={markAsRead}
      />
    ),
    [handleNotificationPress, markAsRead],
  );

  const renderSectionHeader = useCallback(
    (title: string) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    ),
    [],
  );

  // Flatten grouped data for FlatList with section headers
  const flatData = useMemo(() => {
    const items: { type: 'header' | 'item'; data: any; key: string }[] = [];
    groupedData.forEach((group) => {
      items.push({
        type: 'header',
        data: group.title,
        key: `header-${group.title}`,
      });
      group.data.forEach((n) => {
        items.push({ type: 'item', data: n, key: n._id });
      });
    });
    return items;
  }, [groupedData]);

  const renderFlatItem = useCallback(
    ({ item }: { item: { type: 'header' | 'item'; data: any; key: string } }) => {
      if (item.type === 'header') {
        return renderSectionHeader(item.data);
      }
      return (
        <NotificationCard
          notification={item.data}
          onPress={handleNotificationPress}
          onMarkAsRead={markAsRead}
        />
      );
    },
    [renderSectionHeader, handleNotificationPress, markAsRead],
  );

  return (
    <SafeScreen>
      <Header
        title="Notifications"
        showBack
        onBack={() => router.back()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={markAllAsRead}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={22}
                color={colors.text.primary}
              />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Date Range */}
      {dateRangeLabel !== '' && (
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeText}>{dateRangeLabel}</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabText, isActive && styles.tabTextActive]}
              >
                {tab.label}
              </Text>
              {tab.key === 'unread' && unreadCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No Notifications"
          message={
            activeTab === 'unread'
              ? 'You have read all your notifications'
              : 'You have no notifications yet'
          }
        />
      ) : (
        <FlatList
          data={flatData}
          renderItem={renderFlatItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshNotifications}
              tintColor={colors.primary.yellow}
            />
          }
          ListFooterComponent={
            isLoading && notifications.length > 0 ? (
              <View style={styles.footer}>
                <ActivityIndicator
                  size="small"
                  color={colors.primary.yellow}
                />
              </View>
            ) : null
          }
        />
      )}
      {/* Notification Detail Modal */}
      <Modal
        visible={detailNotification !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDetailNotification(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDetailNotification(null)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {detailNotification && (() => {
              const iconName  = NOTIFICATION_ICON[detailNotification.type]  ?? 'notifications-outline';
              const iconColor = NOTIFICATION_ICON_COLOR[detailNotification.type] ?? colors.text.secondary;
              const iconBg    = NOTIFICATION_ICON_BG[detailNotification.type]    ?? colors.border.light;
              const typeLabel = detailNotification.type.charAt(0).toUpperCase() + detailNotification.type.slice(1);
              return (
                <>
                  {/* Icon */}
                  <View style={[styles.modalIconWrap, { backgroundColor: iconBg }]}>
                    <Ionicons name={iconName} size={ms(28)} color={iconColor} />
                  </View>

                  {/* Type badge */}
                  <View style={[styles.modalTypeBadge, { backgroundColor: iconBg }]}>
                    <Text style={[styles.modalTypeText, { color: iconColor }]}>{typeLabel}</Text>
                  </View>

                  {/* Title */}
                  <Text style={styles.modalTitle}>{detailNotification.title}</Text>

                  {/* Message */}
                  {detailNotification.message ? (
                    <Text style={styles.modalMessage}>{detailNotification.message}</Text>
                  ) : null}

                  {/* Timestamp */}
                  <Text style={styles.modalTimestamp}>
                    {formatRelative(detailNotification.createdAt)}
                  </Text>

                  {/* Divider */}
                  <View style={styles.modalDivider} />

                  {/* Close button */}
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setDetailNotification(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalCloseBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  dateRangeContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
  },
  dateRangeText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    backgroundColor: colors.background.white,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
  tabText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.onPrimary,
  },
  tabBadge: {
    backgroundColor: colors.status.error,
    borderRadius: ms(10),
    minWidth: ms(18),
    height: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(4),
  },
  tabBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(10),
    lineHeight: ms(14),
    color: colors.text.white,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: ms(40),
  },
  sectionHeader: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.light,
  },
  sectionHeaderText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },

  // Notification detail modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.medium,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTypeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: ms(3),
    borderRadius: borderRadius.pill,
    marginBottom: spacing.md,
  },
  modalTypeText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(11),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(17),
    lineHeight: ms(24),
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(21),
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalTimestamp: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    color: colors.text.light,
    marginBottom: spacing.lg,
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border.light,
    marginBottom: spacing.lg,
  },
  modalCloseBtn: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary.yellow,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    color: colors.text.onPrimary,
  },
});
