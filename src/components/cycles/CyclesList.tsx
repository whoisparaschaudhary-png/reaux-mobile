import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CyclePlanCard } from '../cards/CyclePlanCard';
import { EmptyState } from '../ui/EmptyState';
import { SkeletonCard } from '../ui/SkeletonLoader';
import { useCycleStore } from '../../stores/useCycleStore';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import { ms } from '../../utils/responsive';
import type { CycleCategory, CyclePlan } from '../../types/models';

const CATEGORIES: { label: string; value: CycleCategory | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Bulking', value: 'bulking' },
  { label: 'Cutting', value: 'cutting' },
  { label: 'Recomp', value: 'recomp' },
  { label: 'PCT', value: 'pct' },
  { label: 'Other', value: 'other' },
];

interface CyclesListProps {
  isAdmin: boolean;
}

export const CyclesList: React.FC<CyclesListProps> = ({ isAdmin }) => {
  const [selectedCategory, setSelectedCategory] = useState<CycleCategory | undefined>(undefined);
  const { cycles, isLoading, pagination, fetchCycles } = useCycleStore();

  const loadCycles = useCallback(() => {
    fetchCycles(1, selectedCategory, { includeUnpublished: isAdmin });
  }, [fetchCycles, selectedCategory, isAdmin]);

  useRefreshOnFocus(loadCycles);

  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !isLoading) {
      fetchCycles(pagination.page + 1, selectedCategory, { includeUnpublished: isAdmin });
    }
  }, [fetchCycles, pagination, isLoading, selectedCategory, isAdmin]);

  const handleCategorySelect = useCallback(
    (category: CycleCategory | undefined) => {
      setSelectedCategory(category);
      fetchCycles(1, category, { includeUnpublished: isAdmin });
    },
    [fetchCycles, isAdmin],
  );

  const renderItem = useCallback(
    ({ item }: { item: CyclePlan }) => (
      <CyclePlanCard cycle={item} onPress={() => router.push(`/(app)/(cycles)/${item._id}` as any)} />
    ),
    [],
  );

  const renderFooter = useCallback(() => {
    if (!isLoading || cycles.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary.yellow} />
      </View>
    );
  }, [isLoading, cycles.length]);

  return (
    <View style={styles.container}>
      {isAdmin && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push('/(app)/(cycles)/upload' as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.text.primary} />
          <Text style={styles.adminButtonText}>Add New Cycle</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      )}

      {/* Category filter */}
      <View style={styles.categoryRow}>
        <FlashList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active =
              selectedCategory === item.value ||
              (item.value === undefined && selectedCategory === undefined);
            return (
              <TouchableOpacity
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => handleCategorySelect(item.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.label}
        />
      </View>

      {/* Cycles list */}
      <View style={styles.listContainer}>
        <FlashList
          data={cycles}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && cycles.length > 0}
              onRefresh={loadCycles}
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
                icon="flask-outline"
                title="No cycles yet"
                message="Curated cycle protocols from verified coaches will appear here."
              />
            )
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  adminButton: {
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
  adminButtonText: {
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
