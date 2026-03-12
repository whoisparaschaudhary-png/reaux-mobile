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
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Avatar } from '../../../src/components/ui/Avatar';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { CommentCard } from '../../../src/components/cards/CommentCard';
import { reelsApi } from '../../../src/api/endpoints/reels';
import { useReelStore } from '../../../src/stores/useReelStore';
import { formatRelative, formatNumber } from '../../../src/utils/formatters';
import { STORE_URLS } from '../../../src/utils/constants';
import { colors, fontFamily, spacing, borderRadius } from '../../../src/theme';
import { useUIStore } from '../../../src/stores/useUIStore';
import type { Reel, User } from '../../../src/types/models';

export default function ReelDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = typeof idParam === 'string' ? idParam : idParam?.[0];
  const router = useRouter();
  const likeReel = useReelStore((s) => s.likeReel);
  const comments = useReelStore((s) => s.comments);
  const commentsLoading = useReelStore((s) => s.commentsLoading);
  const fetchComments = useReelStore((s) => s.fetchComments);
  const addComment = useReelStore((s) => s.addComment);
  const clearComments = useReelStore((s) => s.clearComments);
  const showToast = useUIStore((s) => s.showToast);

  const [reel, setReel] = useState<Reel | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
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

  useFocusEffect(
    useCallback(() => {
      loadReel();
      if (id) {
        clearComments();
        fetchComments(id);
      }
      return () => {
        clearComments();
      };
    }, [id, loadReel, fetchComments, clearComments])
  );

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

  const handleSendComment = useCallback(async () => {
    if (!id || !commentText.trim()) return;
    setIsSendingComment(true);
    try {
      await addComment(id, commentText.trim());
      setCommentText('');
    } catch (err: any) {
      const message = err?.message || err?.response?.data?.message;
      showToast(message || "Couldn't post comment. Try again.", 'error');
    } finally {
      setIsSendingComment(false);
    }
  }, [id, commentText, addComment, showToast]);

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
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
            {commentsLoading && comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <ActivityIndicator size="small" color={colors.primary.yellow} />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyText}>No comments yet. Be the first to comment.</Text>
              </View>
            ) : (
              comments.map((c) => <CommentCard key={c._id} comment={c} />)
            )}
          </View>
        </ScrollView>
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor={colors.text.light}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendComment}
            disabled={!commentText.trim() || isSendingComment}
            style={[
              styles.sendButton,
              (!commentText.trim() || isSendingComment) && styles.sendButtonDisabled,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isSendingComment ? (
              <ActivityIndicator size="small" color={colors.text.onPrimary} />
            ) : (
              <Ionicons name="send" size={20} color={colors.text.onPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
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
    backgroundColor: colors.background.white,
  },
  commentsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyComments: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.light,
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.white,
  },
  commentInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
