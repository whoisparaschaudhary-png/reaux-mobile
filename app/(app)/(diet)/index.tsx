import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { DietPlanCard } from '../../../src/components/cards/DietPlanCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonCard } from '../../../src/components/ui/SkeletonLoader';
import { Button } from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useDietStore } from '../../../src/stores/useDietStore';
import { useRefreshOnFocus } from '../../../src/hooks/useRefreshOnFocus';
import { colors, fontFamily, typography, spacing, borderRadius } from '../../../src/theme';
import type { DietCategory, DietPlan } from '../../../src/types/models';

const CATEGORIES: { label: string; value: DietCategory | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Weight Loss', value: 'weight-loss' },
  { label: 'Muscle Gain', value: 'muscle-gain' },
  { label: 'Keto', value: 'keto' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Maintenance', value: 'maintenance' },
];

export default function DietScreen() {
  const [selectedCategory, setSelectedCategory] = useState<DietCategory | undefined>(undefined);

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const { plans, isLoading, pagination, fetchPlans } = useDietStore();

  const loadPlans = useCallback(() => {
    fetchPlans(1, selectedCategory, { includeUnpublished: isAdmin });
  }, [fetchPlans, selectedCategory, isAdmin]);

  useRefreshOnFocus(loadPlans);

  const handleRefresh = useCallback(() => {
    fetchPlans(1, selectedCategory, { includeUnpublished: isAdmin });
  }, [fetchPlans, selectedCategory, isAdmin]);

  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !isLoading) {
      fetchPlans(pagination.page + 1, selectedCategory, { includeUnpublished: isAdmin });
    }
  }, [fetchPlans, pagination, isLoading, selectedCategory, isAdmin]);

  const handleCategorySelect = useCallback(
    (category: DietCategory | undefined) => {
      setSelectedCategory(category);
      fetchPlans(1, category, { includeUnpublished: isAdmin });
    },
    [fetchPlans, isAdmin],
  );

  const handlePlanPress = useCallback((plan: DietPlan) => {
    router.push(`/(app)/(diet)/${plan._id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: DietPlan }) => (
      <DietPlanCard plan={item} onPress={() => handlePlanPress(item)} />
    ),
    [handlePlanPress],
  );

  const renderFooter = useCallback(() => {
    if (!isLoading || plans.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary.yellow} />
      </View>
    );
  }, [isLoading, plans.length]);

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.heading}>Find your fuel</Text>
          <Text style={styles.subtitle}>Curated plans by top trainers</Text>
        </View>

        {/* Admin button */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.analyticsButton}
            onPress={() => router.push('/(app)/(diet)/upload' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.text.primary} />
            <Text style={styles.analyticsText}>Add New Diet Plan</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        )}

        {/* Category filter */}
            <View style={styles.categoryRow}>
              <FlashList
                data={CATEGORIES}
                horizontal
                showsHorizontalScrollIndicator={false}

                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      selectedCategory === item.value && styles.categoryChipActive,
                      item.value === undefined && selectedCategory === undefined && styles.categoryChipActive,
                    ]}
                    onPress={() => handleCategorySelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        (selectedCategory === item.value ||
                          (item.value === undefined && selectedCategory === undefined)) &&
                          styles.categoryChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.label}
              />
            </View>

            {/* Plans list */}
            <View style={styles.listContainer}>
              <FlashList
                data={plans}
                renderItem={renderItem}

                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={isLoading && plans.length > 0}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary.yellow}
                  />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                  isLoading ? (
                    <View style={styles.loadingContainer}>
                      {[1, 2, 3].map((i) => (
                        <SkeletonCard key={i} style={{ marginBottom: spacing.md }} />
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      icon="restaurant-outline"
                      title="No diet plans yet"
                      message="Check back later for curated diet plans from top trainers."
                    />
                  )
                }
              />
            </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headingSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  heading: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary.yellowLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  analyticsText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  categoryRow: {
    height: 40,
    marginBottom: spacing.md,
    paddingLeft: spacing.xl,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  categoryChipText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.text.primary,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
