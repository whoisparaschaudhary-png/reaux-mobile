import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../../src/components/layout/Header';
import { EmptyState } from '../../../../../src/components/ui/EmptyState';
import { SkeletonLoader } from '../../../../../src/components/ui/SkeletonLoader';
import { RoleGuard } from '../../../../../src/components/guards/RoleGuard';
import { MembershipCard } from '../../../../../src/components/cards/MembershipCard';
import { useMembershipStore } from '../../../../../src/stores/useMembershipStore';
import { colors, fontFamily, spacing, borderRadius, layout } from '../../../../../src/theme';

const STATUS_FILTERS = ['All', 'Active', 'Expired', 'Cancelled'];

export default function UserMembershipsScreen() {
  const router = useRouter();
  const {
    memberships,
    membershipsLoading,
    membershipsPagination,
    fetchMemberships,
    clearSelectedMembership,
  } = useMembershipStore();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    clearSelectedMembership();
    loadMemberships();
  }, [statusFilter]);

  const loadMemberships = () => {
    const filters: Record<string, any> = {};
    if (statusFilter !== 'All') {
      filters.status = statusFilter.toLowerCase();
    }
    fetchMemberships(1, filters);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMemberships();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (
      !membershipsLoading &&
      membershipsPagination.page < membershipsPagination.pages
    ) {
      const filters: Record<string, any> = {};
      if (statusFilter !== 'All') {
        filters.status = statusFilter.toLowerCase();
      }
      fetchMemberships(membershipsPagination.page + 1, filters);
    }
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonLoader key={i} width="100%" height={200} borderRadius={16} />
      ))}
    </View>
  );

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="User Memberships"
          showBack
          onBack={() => router.back()}
          rightAction={
            <TouchableOpacity
              onPress={() => router.push('/(app)/(admin)/memberships/records/assign')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="person-add-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />

        {/* Status Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={styles.filtersScroll}
        >
          {STATUS_FILTERS.map((status) => {
            const isActive = status === statusFilter;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {membershipsLoading && memberships.length === 0 ? (
          renderSkeleton()
        ) : (
          <FlashList
            data={memberships}
            renderItem={({ item }) => (
              <MembershipCard
                membership={item}
                onPress={() =>
                  router.push(`/(app)/(admin)/memberships/records/${item._id}`)
                }
              />
            )}
            estimatedItemSize={200}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary.yellow}
                colors={[colors.primary.yellow]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title="No Memberships Found"
                message="Assign memberships to users to get started."
                actionLabel="Assign Membership"
                onAction={() =>
                  router.push('/(app)/(admin)/memberships/records/assign')
                }
              />
            }
          />
        )}
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  filtersScroll: {
    maxHeight: 50,
    flexGrow: 0,
  },
  filtersContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  filterChipText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.text.onPrimary,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 40,
  },
  skeletonContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
});
