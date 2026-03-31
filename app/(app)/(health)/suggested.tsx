import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { DietPlanCard } from '../../../src/components/cards/DietPlanCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useDietStore } from '../../../src/stores/useDietStore';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../../src/theme';
import { ms, mvs } from '../../../src/utils/responsive';
import type { DietPlan } from '../../../src/types/models';

export default function SuggestedDietsScreen() {
  const { suggestedPlans, isLoading, suggestedPagination, fetchSuggestedPlans } = useDietStore();

  useEffect(() => {
    fetchSuggestedPlans(1);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchSuggestedPlans(1);
  }, [fetchSuggestedPlans]);

  const handleLoadMore = useCallback(() => {
    if (suggestedPagination.page < suggestedPagination.pages && !isLoading) {
      fetchSuggestedPlans(suggestedPagination.page + 1);
    }
  }, [fetchSuggestedPlans, suggestedPagination, isLoading]);

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
    if (!isLoading || suggestedPlans.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary.yellow} />
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
            These diet plans are recommended based on your current BMI category and health goals.
          </Text>
        </View>
      </View>

      {isLoading && suggestedPlans.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      ) : suggestedPlans.length === 0 ? (
        <EmptyState
          icon="restaurant-outline"
          title="No Suggestions Available"
          message="Record your BMI to get personalized diet plan suggestions"
          actionLabel="Go to BMI Calculator"
          onAction={() => router.push('/(app)/(health)/' as any)}
        />
      ) : (
        <FlashList
          data={suggestedPlans}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          estimatedItemSize={220}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={colors.primary.yellow}
            />
          }
        />
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
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  infoIcon: {
    width: 48,
    height: 48,
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
