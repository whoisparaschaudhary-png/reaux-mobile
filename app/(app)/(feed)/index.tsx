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
import Animated, { useSharedValue, withSpring, withSequence, useAnimatedStyle } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { PostCard } from '../../../src/components/cards/PostCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonCard } from '../../../src/components/ui/SkeletonLoader';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { useFeedStore, getFeedCategoryKey } from '../../../src/stores/useFeedStore';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { showAppAlert } from '../../../src/stores/useUIStore';
import {
  colors,
  fontFamily,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../../src/theme';
import type { Post, Workout, WorkoutCategory, WorkoutDifficulty } from '../../../src/types/models';

const CATEGORIES = ['For You', 'My Admins', 'Workouts', 'Nutrition'] as const;
type Category = (typeof CATEGORIES)[number];

const categoryToApi: Record<Category, string | undefined> = {
  'For You': undefined,
  'My Admins': 'admin',
  Workouts: 'workouts', // must match post category value (upload uses "workouts")
  Nutrition: 'nutrition',
};

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

export default function FeedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeCategory, setActiveCategory] = useState<Category>('For You');
  const [workoutCategory, setWorkoutCategory] = useState<WorkoutCategory | 'all'>('all');
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Show only "For You" and "Workouts" — My Admins and Nutrition tabs are hidden for all users
  const visibleCategories = CATEGORIES.filter((c) => c !== 'My Admins' && c !== 'Nutrition') as Category[];

  const categoryApiParam = categoryToApi[activeCategory];
  const categoryKey = getFeedCategoryKey(categoryApiParam);
  const cached = useFeedStore((s) => s.postsByCategory[categoryKey]);
  const posts = cached?.posts ?? [];
  const pagination = cached?.pagination ?? { page: 1, limit: 10, total: 0, pages: 0 };

  const {
    isLoading,
    isRefreshing,
    error,
    fetchPosts,
    refreshPosts,
    likePost,
  } = useFeedStore();

  const {
    workouts,
    isLoading: workoutsLoading,
    isRefreshing: workoutsRefreshing,
    pagination: workoutsPagination,
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

  const handleAdminAdd = useCallback(() => {
    const buttons = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'New Workout Plan', onPress: () => router.push('/(app)/(health)/workout/create' as any) },
    ];
    // Super admin can post; admin cannot (admin only sees New Workout Plan)
    if (!isAdmin || user?.role === 'superadmin') {
      buttons.push({ text: 'New Post', onPress: () => router.push('/(app)/(feed)/upload') });
    }
    showAppAlert('Add content', 'What would you like to create?', buttons);
  }, [router, isAdmin, user?.role]);

  // Open Workouts tab when navigating from BMI "Explore Workouts" (e.g. ?tab=workouts)
  useEffect(() => {
    if (params.tab === 'workouts') {
      setActiveCategory('Workouts');
    }
  }, [params.tab]);

  // "My Admins" and "Nutrition" are hidden for all — switch to "For You" if either was selected
  useEffect(() => {
    if (activeCategory === 'My Admins' || activeCategory === 'Nutrition') {
      setActiveCategory('For You');
    }
  }, [activeCategory]);

  // Fetch posts only for non-Workouts categories when tab has no cached data
  useEffect(() => {
    if (activeCategory === 'Workouts') return;
    const key = getFeedCategoryKey(categoryToApi[activeCategory]);
    const hasCache = useFeedStore.getState().postsByCategory[key]?.posts?.length;
    if (!hasCache) fetchPosts(1, categoryToApi[activeCategory]);
  }, [activeCategory, fetchPosts]);

  // Fetch workouts when Workouts tab is active
  useEffect(() => {
    if (activeCategory !== 'Workouts') return;
    const category = workoutCategory === 'all' ? undefined : workoutCategory;
    fetchWorkouts({ page: 1, category });
  }, [activeCategory, workoutCategory]);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7927/ingest/9dae40e1-b3fb-4628-a12e-08648e00da2b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1c7f0b' }, body: JSON.stringify({ sessionId: '1c7f0b', runId: 'run1', hypothesisId: 'E', location: 'app/(app)/(feed)/index.tsx:FeedScreen', message: 'Feed screen mounted', data: { activeCategory }, timestamp: Date.now() }) }).catch(() => {});
  }, [activeCategory]);
  // #endregion

  const handleRefresh = useCallback(() => {
    if (activeCategory === 'Workouts') {
      const category = workoutCategory === 'all' ? undefined : workoutCategory;
      refreshWorkouts({ category });
    } else {
      refreshPosts(categoryApiParam);
    }
  }, [activeCategory, workoutCategory, categoryApiParam, refreshPosts, refreshWorkouts]);

  const handleLoadMore = useCallback(() => {
    if (activeCategory === 'Workouts') {
      if (workoutsLoading || workoutsPagination.page >= workoutsPagination.pages) return;
      const category = workoutCategory === 'all' ? undefined : workoutCategory;
      fetchWorkouts({ page: workoutsPagination.page + 1, category });
    } else {
      if (isLoading || pagination.page >= pagination.pages) return;
      fetchPosts(pagination.page + 1, categoryApiParam);
    }
  }, [
    activeCategory,
    workoutCategory,
    workoutsLoading,
    workoutsPagination,
    isLoading,
    pagination,
    categoryApiParam,
    fetchPosts,
    fetchWorkouts,
  ]);

  const handleCategoryChange = useCallback((cat: Category) => {
    setActiveCategory(cat);
  }, []);

  const renderWorkoutItem = useCallback(
    ({ item }: { item: Workout }) => {
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
            onPress={handleAdminAdd}
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
          {visibleCategories.map((cat) => {
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

      {/* Feed list or Workout list when Workouts tab is active */}
      <View style={styles.listContainer}>
        {activeCategory === 'Workouts' ? (
          <>
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
                  <Text
                    style={[
                      styles.workoutCategoryText,
                      workoutCategory === cat.key && styles.workoutCategoryTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {workoutsLoading && workouts.length === 0 ? (
              <View style={styles.workoutLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.yellow} />
              </View>
            ) : !workoutsLoading && workouts.length === 0 ? (
              <EmptyState
                icon="barbell-outline"
                title="No workouts found"
                message="Check back later for new workout plans"
                actionLabel={isAdmin ? 'Add content' : undefined}
                onAction={isAdmin ? handleAdminAdd : undefined}
              />
            ) : (
              <FlashList
                data={workouts}
                renderItem={renderWorkoutItem}
                estimatedItemSize={200}
                keyExtractor={(item) => item._id}
                contentContainerStyle={[styles.listContent, styles.workoutListContent]}
                onRefresh={handleRefresh}
                refreshing={workoutsRefreshing}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  workoutsLoading && workouts.length > 0 ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={colors.primary.yellow} />
                    </View>
                  ) : null
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
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
            actionLabel={isAdmin ? "Add content" : undefined}
            onAction={isAdmin ? handleAdminAdd : undefined}
          />
        ) : (
          <FlashList
            data={posts}
            renderItem={renderPost}
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

      {/* FAB - Admin: New Post or New Workout Plan */}
      {isAdmin && (
        <Pressable
          onPress={handleAdminAdd}
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

  // Workouts tab
  workoutCategoryScroll: {
    flexGrow: 0,
  },
  workoutCategoryRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  workoutCategoryChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  workoutCategoryChipActive: {
    backgroundColor: colors.background.dark,
  },
  workoutCategoryText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  workoutCategoryTextActive: {
    color: colors.text.white,
  },
  workoutListContent: {
    paddingHorizontal: spacing.xl,
  },
  workoutLoadingContainer: {
    flex: 1,
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
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
});
