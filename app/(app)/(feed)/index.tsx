import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Share,
  Pressable,
} from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { PostCard } from '../../../src/components/cards/PostCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonCard } from '../../../src/components/ui/SkeletonLoader';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { useFeedStore } from '../../../src/stores/useFeedStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import {
  colors,
  fontFamily,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../../src/theme';
import type { Post, Workout, WorkoutCategory, WorkoutDifficulty } from '../../../src/types/models';

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

const CATEGORIES = ['For You', 'Workouts'] as const;
type Category = (typeof CATEGORIES)[number];

const categoryToApi: Record<Category, string | undefined> = {
  'For You': undefined,
  Workouts: 'workout',
};

export default function FeedScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>('For You');
  const [workoutCategory, setWorkoutCategory] = useState<WorkoutCategory | 'all'>('all');
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const {
    posts,
    isLoading,
    isRefreshing,
    error,
    pagination,
    fetchPosts,
    refreshPosts,
    likePost,
  } = useFeedStore();

  const {
    workouts,
    isLoading: workoutsLoading,
    isRefreshing: workoutsRefreshing,
    pagination: workoutPagination,
    fetchWorkouts,
    refreshWorkouts,
  } = useWorkoutStore();

  // FAB animations
  const fabScale = useSharedValue(1);
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleFabPressIn = () => {
    fabScale.value = withSpring(0.9, { damping: 10, stiffness: 400 });
  };

  const handleFabPressOut = () => {
    fabScale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  useEffect(() => {
    if (activeCategory === 'Workouts') {
      const category = workoutCategory === 'all' ? undefined : workoutCategory;
      fetchWorkouts({ page: 1, category });
    } else {
      fetchPosts(1, categoryToApi[activeCategory]);
    }
  }, [activeCategory, workoutCategory]);

  const handleRefresh = useCallback(() => {
    if (activeCategory === 'Workouts') {
      const category = workoutCategory === 'all' ? undefined : workoutCategory;
      refreshWorkouts({ category });
    } else {
      refreshPosts(categoryToApi[activeCategory]);
    }
  }, [activeCategory, workoutCategory, refreshPosts, refreshWorkouts]);

  const handleLoadMore = useCallback(() => {
    if (activeCategory === 'Workouts') {
      if (workoutsLoading || workoutPagination.page >= workoutPagination.pages) return;
      const category = workoutCategory === 'all' ? undefined : workoutCategory;
      fetchWorkouts({ page: workoutPagination.page + 1, category });
    } else {
      if (isLoading || pagination.page >= pagination.pages) return;
      fetchPosts(pagination.page + 1, categoryToApi[activeCategory]);
    }
  }, [isLoading, workoutsLoading, pagination, workoutPagination, activeCategory, workoutCategory, fetchPosts, fetchWorkouts]);

  const handleCategoryChange = useCallback((cat: Category) => {
    setActiveCategory(cat);
  }, []);

  const renderWorkout = useCallback(
    ({ item }: { item: Workout }) => {
      const diffConfig = DIFFICULTY_CONFIG[item.difficulty];
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

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onPress={() => router.push(`/(app)/(feed)/${item._id}`)}
        onLike={() => likePost(item._id)}
        onComment={() => router.push(`/(app)/(feed)/${item._id}`)}
        onShare={() => {
          Share.share({
            message: item.caption
              ? `${item.caption} — shared from REAUX Labs`
              : 'Check out this post on REAUX Labs!',
          });
        }}
      />
    ),
    [router, likePost],
  );

  const renderFooter = useCallback(() => {
    if (!isLoading || posts.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary.yellow} />
      </View>
    );
  }, [isLoading, posts.length]);

  return (
    <SafeScreen>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Feed</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() =>
              activeCategory === 'Workouts'
                ? router.push('/(app)/(feed)/workout/create' as any)
                : router.push('/(app)/(feed)/upload')
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Category tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => handleCategoryChange(cat)}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Workout sub-category filters */}
      {activeCategory === 'Workouts' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.workoutCategoryRow}
          style={styles.workoutCategoryScroll}
        >
          {WORKOUT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.workoutCategoryChip, workoutCategory === cat.key && styles.workoutCategoryChipActive]}
              onPress={() => setWorkoutCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.workoutCategoryText, workoutCategory === cat.key && styles.workoutCategoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Feed / Workout list */}
      <View style={styles.listContainer}>
        {activeCategory === 'Workouts' ? (
          workoutsLoading && workouts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.yellow} />
            </View>
          ) : (
            <FlashList
              data={workouts}
              renderItem={renderWorkout}
              estimatedItemSize={240}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.workoutListContent}
              onRefresh={handleRefresh}
              refreshing={workoutsRefreshing}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  icon="barbell-outline"
                  title="No workouts found"
                  message="Check back later for new workout plans"
                />
              }
              ListFooterComponent={
                workoutsLoading && workouts.length > 0 ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={colors.primary.yellow} />
                  </View>
                ) : null
              }
            />
          )
        ) : isLoading && posts.length === 0 ? (
          <ScrollView style={styles.skeletonScroll} contentContainerStyle={styles.listContent}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} style={{ marginBottom: spacing.lg }} />
            ))}
          </ScrollView>
        ) : !isLoading && posts.length === 0 && !error ? (
          <EmptyState
            icon="newspaper-outline"
            title="No posts yet"
            message={isAdmin ? "Be the first to share something with the community." : "Check back later for new posts."}
            actionLabel={isAdmin ? "Create Post" : undefined}
            onAction={isAdmin ? () => router.push('/(app)/(feed)/upload') : undefined}
          />
        ) : (
          <FlashList
            data={posts}
            renderItem={renderPost}
            estimatedItemSize={300}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB - Admin only */}
      {isAdmin && (
        <Pressable
          onPress={() =>
            activeCategory === 'Workouts'
              ? router.push('/(app)/(feed)/workout/create' as any)
              : router.push('/(app)/(feed)/upload')
          }
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
        >
          <Animated.View style={[styles.fab, fabAnimatedStyle]}>
            <Ionicons name="add" size={28} color={colors.text.onPrimary} />
          </Animated.View>
        </Pressable>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
  },

  // Category tabs
  tabsWrapper: {
    paddingBottom: spacing.sm,
  },
  tabsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  tabActive: {
    backgroundColor: colors.primary.yellow,
  },
  tabText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.onPrimary,
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  skeletonScroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },

  // Workout sub-categories
  workoutCategoryScroll: {
    flexGrow: 0,
    paddingBottom: spacing.sm,
  },
  workoutCategoryRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  workoutCategoryChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  workoutCategoryChipActive: {
    backgroundColor: colors.background.dark,
  },
  workoutCategoryText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  workoutCategoryTextActive: {
    color: colors.text.white,
  },

  // Workout cards
  workoutListContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
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
    fontSize: 17,
    lineHeight: 22,
    color: colors.text.primary,
  },
  workoutDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 12,
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
    fontSize: 11,
    color: colors.text.secondary,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
});
