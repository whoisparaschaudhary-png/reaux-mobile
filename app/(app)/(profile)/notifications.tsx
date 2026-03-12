import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { NotificationCard } from '../../../src/components/cards/NotificationCard';
import { useNotificationStore } from '../../../src/stores/useNotificationStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { formatDate } from '../../../src/utils/formatters';
import {
  colors,
  fontFamily,
  spacing,
  borderRadius,
  layout,
} from '../../../src/theme';
import type { Notification, NotificationType } from '../../../src/types/models';

type TabKey = 'all' | 'unread' | 'activity';

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
            Alert.alert(
              notification.title,
              [
                notification.message,
                '',
                `Type: ${notification.type}`,
                `ID: ${notification._id}`,
                meta.orderId ? `Order: ${meta.orderId}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
            );
          }
          break;
        case 'community':
          if (meta.postId) {
            router.push(`/(app)/(feed)/${meta.postId}`);
          } else if (meta.reelId) {
            router.push(`/(app)/(reels)/${meta.reelId}`);
          } else {
            Alert.alert(
              notification.title,
              [
                notification.message,
                '',
                `Type: ${notification.type}`,
                `ID: ${notification._id}`,
              ]
                .filter(Boolean)
                .join('\n'),
            );
          }
          break;
        case 'challenge':
          router.push('/(app)/(admin)/challenges');
          break;
        default:
          // Show notification details in an alert for other types
          Alert.alert(
            notification.title,
            [
              notification.message,
              '',
              `Type: ${notification.type}`,
              `ID: ${notification._id}`,
              Object.keys(meta).length > 0
                ? `Metadata: ${JSON.stringify(meta, null, 2)}`
                : '',
            ]
              .filter(Boolean)
              .join('\n'),
          );
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
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.onPrimary,
  },
  tabBadge: {
    backgroundColor: colors.status.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.white,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.light,
  },
  sectionHeaderText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
