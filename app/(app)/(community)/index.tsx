import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { AppTopBar } from '../../../src/components/layout/AppTopBar';
import { PostCard } from '../../../src/components/cards/PostCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonCard } from '../../../src/components/ui/SkeletonLoader';
import { WorkoutsList } from '../../../src/components/workouts/WorkoutsList';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useFeedStore, getFeedCategoryKey } from '../../../src/stores/useFeedStore';
import { useRefreshOnFocus } from '../../../src/hooks/useRefreshOnFocus';
import { colors, fontFamily, spacing, borderRadius } from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';
import type { Post } from '../../../src/types/models';

// 'workouts' is not a post filter here — it swaps the whole list for the workout
// library, exactly as the Feed's Workouts tab does. Previously this chip filtered
// posts by category, and since no post is ever tagged "workouts" it always showed
// "No posts yet" while the same-named tab on Feed showed a full library.
const WORKOUTS = 'workouts';

const CATEGORIES: { label: string; value: string | undefined }[] = [
  { label: 'All Posts', value: undefined },
  { label: 'My Admin', value: 'admin' },
  { label: 'Workouts', value: WORKOUTS },
  { label: 'Nutrition', value: 'nutrition' },
];

export default function CommunityScreen() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const { postsByCategory, isLoading, fetchPosts, likePost } = useFeedStore();

  const key = getFeedCategoryKey(category);
  const cache = postsByCategory[key];
  const posts = useMemo(() => cache?.posts ?? [], [cache]);
  const pagination = cache?.pagination;

  // Workouts is not backed by posts — WorkoutsList owns its own fetching, so skip
  // every post request while it is selected.
  const showingWorkouts = category === WORKOUTS;

  const load = useCallback(() => {
    if (showingWorkouts) return;
    fetchPosts(1, category);
  }, [fetchPosts, category, showingWorkouts]);

  useRefreshOnFocus(load);

  const handleLoadMore = useCallback(() => {
    if (showingWorkouts) return;
    if (pagination && pagination.page < pagination.pages && !isLoading) {
      fetchPosts(pagination.page + 1, category);
    }
  }, [fetchPosts, pagination, isLoading, category, showingWorkouts]);

  const handleSelectCategory = useCallback(
    (value: string | undefined) => {
      setCategory(value);
      if (value === WORKOUTS) return;
      const nextKey = getFeedCategoryKey(value);
      if (!postsByCategory[nextKey]) fetchPosts(1, value);
    },
    [fetchPosts, postsByCategory],
  );

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onPress={() => router.push(`/(app)/(feed)/${item._id}` as any)}
        onLike={() => likePost(item._id)}
      />
    ),
    [likePost],
  );

  const renderFooter = useCallback(() => {
    if (!isLoading || posts.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary.yellow} />
      </View>
    );
  }, [isLoading, posts.length]);

  return (
    <SafeScreen>
      <AppTopBar title="Community" showCommunity={false} />

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={styles.categoryRowContent}
      >
        {CATEGORIES.map((item) => {
          const active = category === item.value;
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => handleSelectCategory(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.listContainer}>
        {showingWorkouts ? (
          <WorkoutsList
            isAdmin={isAdmin}
            onAdminAdd={() => router.push('/(app)/(health)/workout/create' as any)}
          />
        ) : (
        <FlashList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && posts.length > 0}
              onRefresh={load}
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
                icon="people-outline"
                title="No posts yet"
                message="Be the first to share something with the community."
              />
            )
          }
        />
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    // No fixed height. A hard height clipped the chip text once the OS font
    // scale pushed the label past it — which is why the labels looked cropped on
    // device but fine in the simulator at default text size. flexGrow: 0 stops
    // the row stretching inside the parent flex column.
    flexGrow: 0,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  categoryRowContent: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary.yellow,
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    // Deliberately no lineHeight. fontSize scales with the OS text-size setting
    // but a hard lineHeight does not, so the glyphs outgrow their line box and
    // get cropped top and bottom. Single-line pills don't need one.
    color: colors.text.secondary,
    includeFontPadding: false,
  },
  chipTextActive: {
    color: colors.text.onPrimary,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    paddingHorizontal: spacing.xl,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
