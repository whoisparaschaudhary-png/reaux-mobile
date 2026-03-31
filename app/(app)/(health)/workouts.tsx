import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import {
  colors,
  fontFamily,
  spacing,
  borderRadius,
  shadows,
} from '../../../src/theme';
import { ms, mvs } from '../../../src/utils/responsive';
import type { Workout, WorkoutCategory, WorkoutDifficulty } from '../../../src/types/models';

const CATEGORIES: { key: WorkoutCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'strength', label: 'Strength' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'hiit', label: 'HIIT' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'flexibility', label: 'Flexibility' },
  { key: 'crossfit', label: 'CrossFit' },
];

const DIFFICULTY_CONFIG: Record<WorkoutDifficulty, { color: string; variant: 'success' | 'warning' | 'error' }> = {
  beginner: { color: colors.status.success, variant: 'success' },
  intermediate: { color: colors.status.warning, variant: 'warning' },
  advanced: { color: colors.status.error, variant: 'error' },
};

export default function WorkoutsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const {
    workouts,
    isLoading,
    isRefreshing,
    pagination,
    fetchWorkouts,
    refreshWorkouts,
  } = useWorkoutStore();

  const [activeCategory, setActiveCategory] = useState<WorkoutCategory | 'all'>('all');

  useEffect(() => {
    const category = activeCategory === 'all' ? undefined : activeCategory;
    fetchWorkouts({ page: 1, category });
  }, [activeCategory]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && pagination.page < pagination.pages) {
      const category = activeCategory === 'all' ? undefined : activeCategory;
      fetchWorkouts({ page: pagination.page + 1, category });
    }
  }, [isLoading, pagination, activeCategory]);

  const handleRefresh = useCallback(() => {
    const category = activeCategory === 'all' ? undefined : activeCategory;
    refreshWorkouts({ category });
  }, [activeCategory]);

  const renderItem = useCallback(
    ({ item }: { item: Workout }) => {
      const diffConfig = DIFFICULTY_CONFIG[item.difficulty];
      return (
        <Card
          style={styles.workoutCard}
          onPress={() => router.push(`/(app)/(health)/workout/${item._id}`)}
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
              <Badge
                text={item.difficulty}
                variant={diffConfig.variant}
                size="sm"
              />
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
              {item.caloriesBurn && (
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

            {item.tags?.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Card>
      );
    },
    [router],
  );

  return (
    <SafeScreen>
      <Header
        title="Workouts"
        showBack
        onBack={() => router.back()}
        rightAction={
          isAdmin ? (
            <TouchableOpacity
              onPress={() => router.push('/(app)/(health)/workout/create' as any)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.container}>
        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          style={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryChip, activeCategory === cat.key && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat.key && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Workout List */}
        <View style={styles.listContainer}>
          <FlashList
            data={workouts}
            renderItem={renderItem}
            estimatedItemSize={200}
            keyExtractor={(item) => item._id}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary.yellow} />
                </View>
              ) : (
                <EmptyState
                  icon="barbell-outline"
                  title="No workouts found"
                  message="Check back later for new workout plans"
                />
              )
            }
            ListFooterComponent={
              isLoading && workouts.length > 0 ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color={colors.primary.yellow} />
                </View>
              ) : null
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
  categoryScroll: {
    flexGrow: 0,
  },
  categoryRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  categoryChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  categoryChipActive: {
    backgroundColor: colors.background.dark,
  },
  categoryText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
  },
  categoryTextActive: {
    color: colors.text.white,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  workoutCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  workoutImage: {
    width: '100%',
    height: 160,
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
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  footerLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
