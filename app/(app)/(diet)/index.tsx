import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { DietPlanCard } from '../../../src/components/cards/DietPlanCard';
import { CyclesList } from '../../../src/components/cycles/CyclesList';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonCard } from '../../../src/components/ui/SkeletonLoader';
import { Button } from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useDietStore } from '../../../src/stores/useDietStore';
import { useUIStore } from '../../../src/stores/useUIStore';
import { useRefreshOnFocus } from '../../../src/hooks/useRefreshOnFocus';
import { colors, fontFamily, typography, spacing, borderRadius } from '../../../src/theme';
import { ms, mvs } from '../../../src/utils/responsive';
import type { DietCategory, DietType, DietPlan } from '../../../src/types/models';

const CATEGORIES: { label: string; value: DietCategory | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Weight Loss', value: 'weight-loss' },
  { label: 'Muscle Gain', value: 'muscle-gain' },
  { label: 'Bulking', value: 'bulking' },
  { label: 'Cutting', value: 'cutting' },
  { label: 'Other', value: 'other' },
];

const DIET_TYPES: { label: string; value: DietType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Veg', value: 'veg' },
  { label: 'Non-Veg', value: 'non-veg' },
  { label: 'Both', value: 'both' },
];

type FuelMode = 'diets' | 'steroids';

export default function DietScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const openDrawer = useUIStore((s) => s.openDrawer);

  // Steroids/Cycles is admin/coach-only content — regular users see only Diets
  // (the user design omits the toggle entirely).
  const [mode, setMode] = useState<FuelMode>(params.mode === 'steroids' && isAdmin ? 'steroids' : 'diets');

  // Honor deep-links / cross-tab navigation that request a specific mode
  // (e.g. the admin dashboard "Cycle Protocols" shortcut) — admins only.
  useEffect(() => {
    if (params.mode === 'steroids' && isAdmin) setMode('steroids');
    else if (params.mode === 'diets') setMode('diets');
  }, [params.mode, isAdmin]);

  // Non-admins can never be in steroids mode even if state drifts.
  const fuelMode: FuelMode = isAdmin ? mode : 'diets';

  const [selectedCategory, setSelectedCategory] = useState<DietCategory | undefined>(undefined);
  const [selectedDietType, setSelectedDietType] = useState<DietType | undefined>(undefined);

  const { plans, isLoading, pagination, fetchPlans } = useDietStore();

  const loadPlans = useCallback(() => {
    fetchPlans(1, selectedCategory, { includeUnpublished: isAdmin, dietType: selectedDietType });
  }, [fetchPlans, selectedCategory, selectedDietType, isAdmin]);

  useRefreshOnFocus(loadPlans);

  const handleRefresh = useCallback(() => {
    fetchPlans(1, selectedCategory, { includeUnpublished: isAdmin, dietType: selectedDietType });
  }, [fetchPlans, selectedCategory, selectedDietType, isAdmin]);

  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !isLoading) {
      fetchPlans(pagination.page + 1, selectedCategory, { includeUnpublished: isAdmin, dietType: selectedDietType });
    }
  }, [fetchPlans, pagination, isLoading, selectedCategory, selectedDietType, isAdmin]);

  const handleCategorySelect = useCallback(
    (category: DietCategory | undefined) => {
      setSelectedCategory(category);
      fetchPlans(1, category, { includeUnpublished: isAdmin, dietType: selectedDietType });
    },
    [fetchPlans, isAdmin, selectedDietType],
  );

  const handleDietTypeSelect = useCallback(
    (dietType: DietType | undefined) => {
      setSelectedDietType(dietType);
      fetchPlans(1, selectedCategory, { includeUnpublished: isAdmin, dietType });
    },
    [fetchPlans, isAdmin, selectedCategory],
  );

  const handlePlanPress = useCallback((plan: DietPlan) => {
    router.push(`/(diet)/${plan._id}`);
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
        {/* Top bar with menu (opens policy drawer) */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={openDrawer} hitSlop={8} activeOpacity={0.7}>
            <Ionicons name="menu" size={ms(26)} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.heading}>Find your fuel</Text>
          <Text style={styles.subtitle}>Curated plans by top trainers</Text>
        </View>

        {/* Diets / Steroids toggle — admin/coach only */}
        {isAdmin && (
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, fuelMode === 'diets' && styles.toggleButtonActive]}
              onPress={() => setMode('diets')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, fuelMode === 'diets' && styles.toggleTextActive]}>Diets</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, fuelMode === 'steroids' && styles.toggleButtonActive]}
              onPress={() => setMode('steroids')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, fuelMode === 'steroids' && styles.toggleTextActive]}>Steroids</Text>
            </TouchableOpacity>
          </View>
        )}

        {fuelMode === 'steroids' ? (
          <CyclesList isAdmin={isAdmin} />
        ) : (
          <>
        {/* Admin button */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.analyticsButton}
            onPress={() => router.push('/(diet)/upload' as any)}
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

            {/* Diet Type filter (Veg / Non-Veg) */}
            <View style={styles.categoryRow}>
              <FlashList
                data={DIET_TYPES}
                horizontal
                showsHorizontalScrollIndicator={false}

                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      styles.dietTypeChip,
                      selectedDietType === item.value && styles.categoryChipActive,
                      item.value === undefined && selectedDietType === undefined && styles.categoryChipActive,
                    ]}
                    onPress={() => handleDietTypeSelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        (selectedDietType === item.value ||
                          (item.value === undefined && selectedDietType === undefined)) &&
                          styles.categoryChipTextActive,
                      ]}
                    >
                      {item.value === 'veg' ? '🟢 ' : item.value === 'non-veg' ? '🔴 ' : ''}{item.label}
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
          </>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  headingSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  heading: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.secondary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.xs,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.pill,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary.yellow,
  },
  toggleText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: colors.text.onPrimary,
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
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
  },
  categoryRow: {
    height: ms(40),
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
  dietTypeChip: {
    borderWidth: 1,
    borderColor: colors.border.gray,
  },
  categoryChipText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
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
