import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ViewToken,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { ReelCard } from '../../../src/components/cards/ReelCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useReelStore } from '../../../src/stores/useReelStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { colors, fontFamily, typography, spacing, shadows } from '../../../src/theme';
import { STORE_URLS } from '../../../src/utils/constants';
import type { Reel } from '../../../src/types/models';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelsScreen() {
  const router = useRouter();
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const [reelHeight, setReelHeight] = useState(SCREEN_HEIGHT);
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

  // Refresh reels on every focus, pause videos on unfocus
  useFocusEffect(
    useCallback(() => {
      fetchReels(1);
      return () => {
        setVisibleId(null);
      };
    }, [fetchReels])
  );

  const handleRefresh = useCallback(() => {
    refreshReels();
  }, [refreshReels]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || pagination.page >= pagination.pages) return;
    fetchReels(pagination.page + 1);
  }, [isLoading, pagination, fetchReels]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setVisibleId(viewableItems[0].item._id);
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

  const handleShareReel = useCallback(() => {
    const storeUrl = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
    Linking.openURL(storeUrl).catch(() => {});
  }, []);

  const renderReel = useCallback(
    ({ item }: { item: Reel }) => (
      <ReelCard
        reel={item}
        isVisible={item._id === visibleId}
        onLike={() => likeReel(item._id)}
        onComment={() => router.push(`/(app)/(reels)/${item._id}`)}
        onShare={() => handleShareReel(item)}
        height={reelHeight}
      />
    ),
    [visibleId, likeReel, reelHeight, handleShareReel, router],
  );

  const renderFooter = useCallback(() => {
    if (!isLoading || reels.length === 0) return null;
    return (
      <View style={[styles.footerLoader, { height: reelHeight }]}>
        <ActivityIndicator size="large" color={colors.primary.yellow} />
      </View>
    );
  }, [isLoading, reels.length, reelHeight]);

  return (
    <SafeScreen>
      <View
        style={styles.container}
        onLayout={(e) => setReelHeight(e.nativeEvent.layout.height)}
      >
        {isLoading && reels.length === 0 ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
            <Text style={styles.loadingText}>Loading reels...</Text>
          </View>
        ) : !isLoading && reels.length === 0 && !error ? (
          <EmptyState
            icon="videocam-outline"
            title="No reels yet"
            message={isSuperAdmin ? "Be the first to share a reel with the community." : "Check back later for new reels."}
            actionLabel={isSuperAdmin ? "Create Reel" : undefined}
            onAction={isSuperAdmin ? () => router.push('/(app)/(feed)/new-reel') : undefined}
          />
        ) : (
          <FlatList
            data={reels}
            renderItem={renderReel}
            keyExtractor={(item) => item._id}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            pagingEnabled
            snapToInterval={reelHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            getItemLayout={getItemLayout}
            windowSize={3}
            maxToRenderPerBatch={2}
            initialNumToRender={1}
            removeClippedSubviews
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
