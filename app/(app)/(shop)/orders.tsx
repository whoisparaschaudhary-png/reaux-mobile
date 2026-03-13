import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { OrderCard } from '../../../src/components/cards/OrderCard';
import { useOrderStore } from '../../../src/stores/useOrderStore';
import { useRefreshOnFocus } from '../../../src/hooks/useRefreshOnFocus';
import { colors, fontFamily, borderRadius, spacing, layout } from '../../../src/theme';
import type { OrderStatus } from '../../../src/types/models';

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function OrdersScreen() {
  const { backRoute } = useLocalSearchParams<{ backRoute?: string }>();
  const handleBack = () => backRoute === 'profile' ? router.navigate('/(app)/(profile)') : router.back();
  const { orders, isLoading, pagination, fetchMyOrders } = useOrderStore();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchMyOrders(1);
  }, []);

  useRefreshOnFocus(
    useCallback(() => {
      fetchMyOrders(1);
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyOrders(1);
    setRefreshing(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoading || pagination.page >= pagination.pages) return;
    fetchMyOrders(pagination.page + 1);
  }, [isLoading, pagination]);

  const filteredOrders =
    statusFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const renderOrder = useCallback(
    ({ item }: { item: any }) => (
      <OrderCard
        order={item}
        onPress={() =>
          router.push(`/(app)/(shop)/invoice/${item._id}`)
        }
      />
    ),
    [],
  );

  return (
    <SafeScreen>
      <Header title="My Orders" showBack onBack={handleBack} />

      {/* Status Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabsScroll}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = tab.value === statusFilter;
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setStatusFilter(tab.value)}
              style={[styles.tab, isActive && styles.tabActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.container}>
        {filteredOrders.length === 0 && !isLoading ? (
          <EmptyState
            icon="receipt-outline"
            title="No Orders Yet"
            message="Your order history will appear here once you make a purchase"
            actionLabel="Browse Products"
            onAction={() => router.back()}
          />
        ) : (
          <FlashList
            data={filteredOrders}
            renderItem={renderOrder}
            keyExtractor={(item) => item._id}

            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary.yellow}
              />
            }
            ListFooterComponent={
              isLoading && orders.length > 0 ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={colors.primary.yellow} />
                </View>
              ) : (
                <View style={styles.footerSpacer} />
              )
            }
          />
        )}

        {isLoading && orders.length === 0 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
          </View>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Tabs
  tabsScroll: {
    maxHeight: 50,
  },
  tabsContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    marginRight: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primary.yellow,
  },
  tabText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.onPrimary,
    fontFamily: fontFamily.bold,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  footerLoader: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  footerSpacer: {
    height: spacing.xxxl,
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,248,245,0.8)',
  },
});
