import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../../src/components/layout/Header';
import { EmptyState } from '../../../../../src/components/ui/EmptyState';
import { SkeletonLoader } from '../../../../../src/components/ui/SkeletonLoader';
import { RoleGuard } from '../../../../../src/components/guards/RoleGuard';
import { MembershipPlanCard } from '../../../../../src/components/cards/MembershipPlanCard';
import { useMembershipStore } from '../../../../../src/stores/useMembershipStore';
import { colors, spacing, layout } from '../../../../../src/theme';

export default function MembershipPlansScreen() {
  const router = useRouter();
  const { plans, plansLoading, plansPagination, fetchPlans, clearSelectedPlan } =
    useMembershipStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    clearSelectedPlan();
    fetchPlans(1);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPlans(1);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (
      !plansLoading &&
      plansPagination.page < plansPagination.pages
    ) {
      fetchPlans(plansPagination.page + 1);
    }
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonLoader key={i} width="100%" height={180} borderRadius={16} />
      ))}
    </View>
  );

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Membership Plans"
          showBack
          onBack={() => router.back()}
          rightAction={
            <TouchableOpacity
              onPress={() => router.push('/(app)/(admin)/memberships/plans/create')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />

        {plansLoading && plans.length === 0 ? (
          renderSkeleton()
        ) : (
          <FlashList
            data={plans}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <MembershipPlanCard
                plan={item}
                onPress={() =>
                  router.push(`/(app)/(admin)/memberships/plans/${item._id}`)
                }
              />
            )}
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
                icon="card-outline"
                title="No Plans Found"
                message="Create your first membership plan to get started."
                actionLabel="Create Plan"
                onAction={() =>
                  router.push('/(app)/(admin)/memberships/plans/create')
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
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  skeletonContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
});
