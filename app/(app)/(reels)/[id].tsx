import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Avatar } from '../../../src/components/ui/Avatar';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { reelsApi } from '../../../src/api/endpoints/reels';
import { useReelStore } from '../../../src/stores/useReelStore';
import { formatRelative, formatNumber } from '../../../src/utils/formatters';
import { STORE_URLS } from '../../../src/utils/constants';
import { colors, fontFamily, spacing } from '../../../src/theme';
import type { Reel, User } from '../../../src/types/models';

export default function ReelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const likeReel = useReelStore((s) => s.likeReel);

  const [reel, setReel] = useState<Reel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReel = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await reelsApi.getById(id);
      setReel(response.data);
    } catch {
      setReel(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReel();
  }, [loadReel]);

  const handleLike = useCallback(async () => {
    if (!id) return;
    setReel((prev) =>
      prev
        ? {
            ...prev,
            isLiked: !prev.isLiked,
            likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
          }
        : null
    );
    await likeReel(id);
  }, [id, likeReel]);

  const handleShare = useCallback(() => {
    const storeUrl = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
    Linking.openURL(storeUrl).catch(() => {});
  }, []);

  if (isLoading) {
    return (
      <SafeScreen>
        <Header title="Reel" showBack onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  if (!reel) {
    return (
      <SafeScreen>
        <Header title="Reel" showBack onBack={() => router.back()} />
        <EmptyState
          icon="videocam-outline"
          title="Reel not found"
          message="This reel may have been removed."
        />
      </SafeScreen>
    );
  }

  const author = typeof reel.author === 'object' ? (reel.author as User) : null;
  const authorName = author?.name ?? 'Unknown';
  const authorAvatar = author?.avatar;

  return (
    <SafeScreen>
      <Header
        title="Reel"
        showBack
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.videoWrapper}>
          <ReelVideo reel={reel} />
        </View>
        <View style={styles.info}>
          <View style={styles.authorRow}>
            <Avatar uri={authorAvatar} name={authorName} size={44} />
            <View style={styles.authorMeta}>
              <Text style={styles.authorName}>{authorName}</Text>
              <Text style={styles.timestamp}>{formatRelative(reel.createdAt)}</Text>
            </View>
            <TouchableOpacity
              onPress={handleLike}
              style={styles.likeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={reel.isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={reel.isLiked ? colors.status.error : colors.text.secondary}
              />
              <Text style={styles.likeCount}>{formatNumber(reel.likesCount)}</Text>
            </TouchableOpacity>
          </View>
          {reel.caption ? (
            <Text style={styles.caption}>{reel.caption}</Text>
          ) : null}
        </View>
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          <EmptyState
            icon="chatbubble-outline"
            title="No comments yet"
            message="Comments on reels may be available in a future update."
          />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

function ReelVideo({ reel }: { reel: Reel }) {
  const player = useVideoPlayer(reel.videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    player.play();
    return () => {
      try {
        player.pause();
      } catch {
        // ignore
      }
    };
  }, [player]);

  return (
    <View style={styles.videoContainer}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 400,
    backgroundColor: colors.background.dark,
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  info: {
    padding: spacing.lg,
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  authorMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  authorName: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.text.primary,
  },
  timestamp: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.light,
    marginTop: 2,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  likeCount: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  commentsSection: {
    padding: spacing.lg,
  },
  commentsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
});
