import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { DietPlanCard } from '../../../src/components/cards/DietPlanCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SourcesCard } from '../../../src/components/ui/SourcesCard';
import { useDietStore } from '../../../src/stores/useDietStore';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';
import type { DietPlan, DietType } from '../../../src/types/models';

const DIET_TYPES: { label: string; value: DietType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Veg', value: 'veg' },
  { label: 'Non-Veg', value: 'non-veg' },
];

export default function SuggestedDietsScreen() {
  const { suggestedPlans, isLoading, suggestedPagination, fetchSuggestedPlans } = useDietStore();

  // Estimated daily calories (TDEE) passed from the BMI screen. When present the
  // backend matches diets to this calorie need instead of the coarse BMI band.
  const params = useLocalSearchParams<{ calories?: string }>();
  const targetCalories =
    params.calories && Number(params.calories) > 0 ? Number(params.calories) : undefined;

  const [selectedDietType, setSelectedDietType] = useState<DietType | undefined>(undefined);

  const loadPage = useCallback(
    (page: number) => {
      fetchSuggestedPlans(page, { dietType: selectedDietType, targetCalories });
    },
    [fetchSuggestedPlans, selectedDietType, targetCalories],
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const handleRefresh = useCallback(() => {
    loadPage(1);
  }, [loadPage]);

  const handleLoadMore = useCallback(() => {
    if (suggestedPagination.page < suggestedPagination.pages && !isLoading) {
      loadPage(suggestedPagination.page + 1);
    }
  }, [loadPage, suggestedPagination, isLoading]);

  const handlePlanPress = useCallback((plan: DietPlan) => {
    router.push(`/(diet)/${plan._id}` as any);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: DietPlan }) => (
      <DietPlanCard plan={item} onPress={() => handlePlanPress(item)} />
    ),
    [handlePlanPress],
  );

  const renderFooter = useCallback(() => {
    return (
      <View>
        {isLoading && suggestedPlans.length > 0 && (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.primary.yellow} />
          </View>
        )}
        {/* Citations for diet/calorie recommendations (App Store guideline 1.4.1) */}
        <SourcesCard style={styles.sourcesCard} />
      </View>
    );
  }, [isLoading, suggestedPlans.length]);

  return (
    <SafeScreen>
      <Header
        title="Suggested Diets"
        showBack
        onBack={() => router.back()}
      />

      {/* Info card */}
      <View style={[styles.infoCard, shadows.card]}>
        <View style={styles.infoIcon}>
          <Ionicons name="bulb" size={24} color={colors.primary.yellowDark} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Personalized for You</Text>
          <Text style={styles.infoText}>
            {targetCalories
              ? `Diet plans matched to your daily need of ~${targetCalories} cal. Filter by preference below.`
              : 'These diet plans are recommended based on your current BMI category. Record your BMI to fine-tune them to your calories.'}
          </Text>
        </View>
      </View>

      {/* Veg / Non-Veg filter */}
      <View style={styles.filterRow}>
        {DIET_TYPES.map((item) => {
          const active = selectedDietType === item.value;
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedDietType(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {item.value === 'veg' ? '🟢 ' : item.value === 'non-veg' ? '🔴 ' : ''}
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading && suggestedPlans.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      ) : suggestedPlans.length === 0 ? (
        <EmptyState
          icon="restaurant-outline"
          title="No Suggestions Available"
          message={
            selectedDietType
              ? 'No matching diet plans for this preference. Try a different filter.'
              : 'Record your BMI to get personalized diet plan suggestions'
          }
          actionLabel="Go to BMI Calculator"
          onAction={() => router.push('/(app)/(health)/' as any)}
        />
      ) : (
        // flash-list v2 needs a bounded-height parent or it collapses to 0 and
        // renders blank — this list was a direct child of SafeScreen.
        <View style={styles.listWrapper}>
          <FlashList
            data={suggestedPlans}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={isLoading && suggestedPlans.length > 0}
                onRefresh={handleRefresh}
                tintColor={colors.primary.yellow}
              />
            }
          />
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary.yellowLight,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoIcon: {
    width: ms(48),
    height: ms(48),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(16),
    lineHeight: ms(20),
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    borderWidth: 1,
    borderColor: colors.border.gray,
  },
  filterChipActive: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
  filterChipText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.text.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  sourcesCard: {
    marginTop: spacing.lg,
  },
});
