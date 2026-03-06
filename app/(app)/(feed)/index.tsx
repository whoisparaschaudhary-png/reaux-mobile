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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { PostCard } from '../../../src/components/cards/PostCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonCard } from '../../../src/components/ui/SkeletonLoader';
import { useFeedStore, getFeedCategoryKey } from '../../../src/stores/useFeedStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import {
  colors,
  fontFamily,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../../src/theme';
import type { Post } from '../../../src/types/models';

const CATEGORIES = ['For You', 'My Admins', 'Workouts', 'Nutrition'] as const;
type Category = (typeof CATEGORIES)[number];

const categoryToApi: Record<Category, string | undefined> = {
  'For You': undefined,
  'My Admins': 'admin',
  Workouts: 'workouts', // must match post category value (upload uses "workouts")
  Nutrition: 'nutrition',
};

export default function FeedScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>('For You');
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Hide "My Admins" and "Nutrition" tabs for admin users
  const visibleCategories = isAdmin
    ? (CATEGORIES.filter((c) => c !== 'My Admins' && c !== 'Nutrition') as Category[])
    : [...CATEGORIES];

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

  // When user is admin, "My Admins" and "Nutrition" are hidden — switch to "For You" if either was selected
  useEffect(() => {
    if (isAdmin && (activeCategory === 'My Admins' || activeCategory === 'Nutrition')) {
      setActiveCategory('For You');
    }
  }, [isAdmin, activeCategory]);

  // Fetch only when this category has no cached data, so tab switch shows cached list (data persists)
  useEffect(() => {
    const key = getFeedCategoryKey(categoryToApi[activeCategory]);
    const hasCache = useFeedStore.getState().postsByCategory[key]?.posts?.length;
    if (!hasCache) fetchPosts(1, categoryToApi[activeCategory]);
  }, [activeCategory, fetchPosts]);

  const handleRefresh = useCallback(() => {
    refreshPosts(categoryApiParam);
  }, [categoryApiParam, refreshPosts]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || pagination.page >= pagination.pages) return;
    fetchPosts(pagination.page + 1, categoryApiParam);
  }, [isLoading, pagination, categoryApiParam, fetchPosts]);

  const handleCategoryChange = useCallback((cat: Category) => {
    setActiveCategory(cat);
  }, []);

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
            onPress={() => router.push('/(app)/(feed)/upload')}
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

      {/* Feed list */}
      <View style={styles.listContainer}>
        {isLoading && posts.length === 0 ? (
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

      {/* FAB for new post - Admin only */}
      {isAdmin && (
        <Pressable
          onPress={() => router.push('/(app)/(feed)/upload')}
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
});
