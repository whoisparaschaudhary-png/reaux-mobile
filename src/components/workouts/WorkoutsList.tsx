import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import { ms, mvs } from '../../utils/responsive';
import type { Workout, WorkoutCategory, WorkoutDifficulty } from '../../types/models';

/**
 * The workout library — category chips + card list, with its own store wiring.
 *
 * Extracted from the Feed's "Workouts" tab so the Community tab can show the very
 * same content. Before this, Community's "Workouts" chip filtered *posts* by
 * category while the Feed's "Workouts" tab listed Workout records, so the same
 * word showed a full library on one tab and "No posts yet" on the other.
 */

const WORKOUT_CATEGORIES: { key: WorkoutCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'strength', label: 'Strength' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'hiit', label: 'HIIT' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'flexibility', label: 'Flexibility' },
  { key: 'crossfit', label: 'CrossFit' },
];

const DIFFICULTY_CONFIG: Record<WorkoutDifficulty, { variant: 'success' | 'warning' | 'error' }> = {
  beginner: { variant: 'success' },
  intermediate: { variant: 'warning' },
  advanced: { variant: 'error' },
};

interface WorkoutsListProps {
  /** Shows the "Add content" action on the empty state. */
  isAdmin?: boolean;
  onAdminAdd?: () => void;
  /** Extra padding for the list content (e.g. to clear a FAB). */
  contentContainerStyle?: object;
}

export const WorkoutsList: React.FC<WorkoutsListProps> = ({
  isAdmin = false,
  onAdminAdd,
  contentContainerStyle,
}) => {
  const [category, setCategory] = useState<WorkoutCategory | 'all'>('all');

  const {
    workouts,
    isLoading,
    isRefreshing,
    pagination,
    fetchWorkouts,
    refreshWorkouts,
  } = useWorkoutStore();

  useEffect(() => {
    fetchWorkouts({ page: 1, category: category === 'all' ? undefined : category });
  }, [category, fetchWorkouts]);

  const handleRefresh = useCallback(() => {
    refreshWorkouts({ category: category === 'all' ? undefined : category });
  }, [refreshWorkouts, category]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || !pagination || pagination.page >= pagination.pages) return;
    fetchWorkouts({
      page: pagination.page + 1,
      category: category === 'all' ? undefined : category,
    });
  }, [isLoading, pagination, fetchWorkouts, category]);

  const renderItem = useCallback(({ item }: { item: Workout }) => {
    const diffConfig = (item.difficulty && DIFFICULTY_CONFIG[item.difficulty]) || DIFFICULTY_CONFIG.beginner;
    return (
      <Card
        style={styles.workoutCard}
        onPress={() => router.push(`/(app)/(health)/workout/${item._id}` as any)}
      >
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.workoutImage}
            contentFit="cover"
            transition={200}
          />
        )}
        <View style={styles.workoutContent}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Badge text={item.difficulty} variant={diffConfig.variant} size="sm" />
          </View>
          {item.description && (
            <Text style={styles.workoutDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.workoutMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.metaText}>{item.duration} min</Text>
            </View>
            {item.caloriesBurn != null && (
              <View style={styles.metaItem}>
                <Ionicons name="flame-outline" size={14} color={colors.status.warning} />
                <Text style={styles.metaText}>{item.caloriesBurn} cal</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="barbell-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.metaText}>{item.exercises?.length ?? 0} exercises</Text>
            </View>
          </View>
          {item.tags?.length ? (
            <View style={styles.tagRow}>
              {item.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Card>
    );
  }, []);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryRow}
      >
        {WORKOUT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
            onPress={() => setCategory(cat.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryText, category === cat.key && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && workouts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      ) : !isLoading && workouts.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No workouts found"
          message="Check back later for new workout plans"
          actionLabel={isAdmin && onAdminAdd ? 'Add content' : undefined}
          onAction={isAdmin && onAdminAdd ? onAdminAdd : undefined}
        />
      ) : (
        <FlashList
          data={workouts}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ ...styles.listContent, ...(contentContainerStyle ?? {}) }}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading && workouts.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary.yellow} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  categoryScroll: {
    // No fixed height, and flexGrow: 0 so the row never stretches — a hard height
    // here crops the chip labels once the OS text-size setting scales them up.
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  categoryRow: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  categoryText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    color: colors.text.secondary,
  },
  categoryTextActive: {
    color: colors.text.onPrimary,
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  workoutCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  workoutImage: {
    width: '100%',
    height: mvs(160),
  },
  workoutContent: {
    padding: spacing.lg,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  workoutTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: ms(17),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
  workoutDescription: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    color: colors.text.secondary,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.tag,
  },
  tagText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(11),
    color: colors.text.secondary,
  },
});
