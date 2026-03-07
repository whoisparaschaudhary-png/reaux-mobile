import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ViewToken,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { ReelCard } from '../../../src/components/cards/ReelCard';
import { ReelCommentsSheet } from '../../../src/components/cards/ReelCommentsSheet';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useReelStore } from '../../../src/stores/useReelStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { colors, fontFamily, spacing } from '../../../src/theme';
import type { Reel } from '../../../src/types/models';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelsScreen() {
  const router = useRouter();
  const [visibleIndex, setVisibleIndex] = useState<number>(0);
  const [reelHeight, setReelHeight] = useState(SCREEN_HEIGHT);
  const [commentReel, setCommentReel] = useState<{ id: string; count: number } | null>(null);
  // Extra copies of the reel list appended for looping
  const [loopedCopies, setLoopedCopies] = useState<Reel[]>([]);
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'superadmin';

  const {
    reels,
    isLoading,
    isRefreshing,
    error,
    pagination,
    fetchReels,
    refreshReels,
    likeReel,
  } = useReelStore();

  // Combined list: original pages + any looped copies
  const displayReels = useMemo(() => [...reels, ...loopedCopies], [reels, loopedCopies]);

  useEffect(() => {
    fetchReels(1);
  }, []);

  // Pause all videos when navigating away
  useFocusEffect(
    useCallback(() => {
      return () => {
        setVisibleIndex(-1);
      };
    }, [])
  );

  const handleRefresh = useCallback(() => {
    setLoopedCopies([]);
    refreshReels();
  }, [refreshReels]);

  const loopingRef = useRef(false);
  const handleLoadMore = useCallback(() => {
    if (isLoading) return;
    if (pagination.page < pagination.pages) {
      fetchReels(pagination.page + 1);
    } else if (reels.length > 0 && !loopingRef.current) {
      // All pages loaded — loop back by appending reels again
      loopingRef.current = true;
      setLoopedCopies((prev) => [...prev, ...reels]);
      setTimeout(() => { loopingRef.current = false; }, 2000);
    }
  }, [isLoading, pagination, fetchReels, reels]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setVisibleIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: reelHeight,
      offset: reelHeight * index,
      index,
    }),
    [reelHeight],
  );

  const renderReel = useCallback(
    ({ item, index }: { item: Reel; index: number }) => (
      <ReelCard
        reel={item}
        isVisible={index === visibleIndex}
        onLike={() => likeReel(item._id)}
        onComment={() => setCommentReel({ id: item._id, count: item.commentsCount ?? 0 })}
        height={reelHeight}
      />
    ),
    [visibleIndex, likeReel, reelHeight],
  );

  const renderFooter = useCallback(() => {
    if (!isLoading || displayReels.length === 0) return null;
    return (
      <View style={[styles.footerLoader, { height: reelHeight }]}>
        <ActivityIndicator size="large" color={colors.primary.yellow} />
      </View>
    );
  }, [isLoading, displayReels.length, reelHeight]);

  return (
    <SafeScreen>
      <View
        style={styles.container}
        onLayout={(e) => setReelHeight(e.nativeEvent.layout.height)}
      >
        {isLoading && displayReels.length === 0 ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
            <Text style={styles.loadingText}>Loading reels...</Text>
          </View>
        ) : !isLoading && displayReels.length === 0 && !error ? (
          <EmptyState
            icon="videocam-outline"
            title="No reels yet"
            message={isSuperAdmin ? 'Be the first to share a reel with the community.' : 'Check back later for new reels.'}
            actionLabel={isSuperAdmin ? 'Create Reel' : undefined}
            onAction={isSuperAdmin ? () => router.push('/(app)/(feed)/new-reel') : undefined}
          />
        ) : (
          <FlatList
            data={displayReels}
            renderItem={renderReel}
            keyExtractor={(_, index) => String(index)}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            pagingEnabled
            snapToInterval={reelHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            getItemLayout={getItemLayout}
            windowSize={5}
            maxToRenderPerBatch={2}
            initialNumToRender={1}
          />
        )}

        {/* Overlay header */}
        <View style={styles.overlayHeader} pointerEvents="box-none">
          <Text style={styles.headerTitle}>Reels</Text>
          {isSuperAdmin && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/(feed)/new-reel')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="videocam-outline" size={26} color={colors.text.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ReelCommentsSheet
        visible={commentReel !== null}
        reelId={commentReel?.id ?? null}
        commentsCount={commentReel?.count ?? 0}
        onClose={() => setCommentReel(null)}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.text.white,
  },
  footerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.light,
  },
});
