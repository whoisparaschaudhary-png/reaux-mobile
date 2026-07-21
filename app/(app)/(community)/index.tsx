import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { AppTopBar } from '../../../src/components/layout/AppTopBar';
import { PostCard } from '../../../src/components/cards/PostCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonCard } from '../../../src/components/ui/SkeletonLoader';
import { useFeedStore, getFeedCategoryKey } from '../../../src/stores/useFeedStore';
import { useRefreshOnFocus } from '../../../src/hooks/useRefreshOnFocus';
import { colors, fontFamily, spacing, borderRadius } from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';
import type { Post } from '../../../src/types/models';

const CATEGORIES: { label: string; value: string | undefined }[] = [
  { label: 'All Posts', value: undefined },
  { label: 'My Admin', value: 'admin' },
  { label: 'Workouts', value: 'workouts' },
  { label: 'Nutrition', value: 'nutrition' },
];

export default function CommunityScreen() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { postsByCategory, isLoading, fetchPosts, likePost } = useFeedStore();

  const key = getFeedCategoryKey(category);
  const cache = postsByCategory[key];
  const posts = useMemo(() => cache?.posts ?? [], [cache]);
  const pagination = cache?.pagination;

  const load = useCallback(() => {
    fetchPosts(1, category);
  }, [fetchPosts, category]);

  useRefreshOnFocus(load);

  const handleLoadMore = useCallback(() => {
    if (pagination && pagination.page < pagination.pages && !isLoading) {
      fetchPosts(pagination.page + 1, category);
    }
  }, [fetchPosts, pagination, isLoading, category]);

  const handleSelectCategory = useCallback(
    (value: string | undefined) => {
      setCategory(value);
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
      <View style={styles.categoryRow}>
        <FlashList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = category === item.value;
            return (
              <TouchableOpacity
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleSelectCategory(item.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.label}
        />
      </View>

      <View style={styles.listContainer}>
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
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    height: ms(40),
    marginBottom: spacing.md,
    paddingLeft: spacing.xl,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    marginRight: spacing.sm,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary.yellow,
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
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
