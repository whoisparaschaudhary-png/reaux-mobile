import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Badge } from '../../../src/components/ui/Badge';
import { CommentCard } from '../../../src/components/cards/CommentCard';
import { ContentModerationSheet, ModerationTarget } from '../../../src/components/moderation/ContentModerationSheet';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { postsApi } from '../../../src/api/endpoints/posts';
import { useFeedStore } from '../../../src/stores/useFeedStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { formatRelative, formatNumber } from '../../../src/utils/formatters';
import {
  colors,
  typography,
  fontFamily,
  spacing,
  borderRadius,
} from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';
import type { Post, Comment, User, Role } from '../../../src/types/models';

interface PostHeaderProps {
  post: Post;
  isLiked: boolean;
  onLike: () => void;
  onDelete: () => void;
  onAnalytics?: () => void;
  isSuperAdmin: boolean;
}

const PostHeader = React.memo(({ post, isLiked, onLike, onDelete, onAnalytics, isSuperAdmin }: PostHeaderProps) => {
  const author = typeof post.author === 'object' ? (post.author as User) : null;
  const authorName = author?.name ?? 'Unknown';
  const authorAvatar = author?.avatar;
  const authorRole = author?.role as Role | undefined;
  const hasImage = post.mediaType === 'image' && post.mediaUrl;

  return (
    <View>
      {hasImage && (
        <Image
          source={{ uri: post.mediaUrl }}
          style={styles.postImage}
          contentFit="cover"
          transition={300}
        />
      )}

      <View style={styles.authorRow}>
        <Avatar uri={authorAvatar} name={authorName} size={44} />
        <View style={styles.authorInfo}>
          <View style={styles.authorNameRow}>
            <Text style={styles.authorName}>{authorName}</Text>
            {authorRole === 'admin' && (
              <Badge text="Admin" variant="primary" size="sm" />
            )}
            {authorRole === 'superadmin' && (
              <Badge text="Coach" variant="success" size="sm" />
            )}
          </View>
          <Text style={styles.timestamp}>{formatRelative(post.createdAt)}</Text>
        </View>
      </View>

      {post.content ? (
        <Text style={styles.content}>{post.content}</Text>
      ) : null}

      {post.hashtags && post.hashtags.length > 0 && (
        <View style={styles.hashtagRow}>
          {post.hashtags.map((tag) => (
            <Text key={tag} style={styles.hashtag}>#{tag}</Text>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={onLike}
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? colors.status.error : colors.text.secondary}
          />
          <Text style={styles.actionCount}>{formatNumber(post.likesCount)}</Text>
        </TouchableOpacity>

        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.text.secondary} />
          <Text style={styles.actionCount}>{formatNumber(post.commentsCount)}</Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => {
            const storeUrl = Platform.OS === 'ios'
              ? 'https://apps.apple.com/app/id' + 'YOUR_APP_STORE_ID'
              : 'https://play.google.com/store/apps/details?id=com.babbaranish.reauxlabsmobile';
            Share.share({
              message: post.content
                ? `${post.content}\n\n— Shared from REAUX Labs\nFollow us: https://www.instagram.com/reauxlabs/\nDownload: ${storeUrl}`
                : `Check out REAUX Labs – your fitness community!\nFollow us: https://www.instagram.com/reauxlabs/\nDownload: ${storeUrl}`,
            });
          }}
        >
          <Ionicons name="share-outline" size={22} color={colors.text.secondary} />
        </TouchableOpacity>

        {onAnalytics && (
          <TouchableOpacity
            onPress={onAnalytics}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="bar-chart-outline" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
        )}

        {isSuperAdmin && (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={22} color={colors.status.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>Comments</Text>
      </View>
    </View>
  );
});

interface CommentInputProps {
  onSend: (text: string) => Promise<void>;
}

const CommentInput = React.memo(({ onSend }: CommentInputProps) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    setIsSending(true);
    try {
      await onSend(text.trim());
      setText('');
    } finally {
      setIsSending(false);
    }
  }, [text, onSend]);

  return (
    <View style={styles.commentInputContainer}>
      <TextInput
        style={styles.commentInput}
        placeholder="Write a comment..."
        placeholderTextColor={colors.text.light}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim() || isSending}
        style={[
          styles.sendButton,
          (!text.trim() || isSending) && styles.sendButtonDisabled,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={colors.text.onPrimary} />
        ) : (
          <Ionicons name="send" size={20} color={colors.text.onPrimary} />
        )}
      </TouchableOpacity>
    </View>
  );
});

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const likePost = useFeedStore((s) => s.likePost);
  const deletePost = useFeedStore((s) => s.deletePost);
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moderationTarget, setModerationTarget] = useState<ModerationTarget | null>(null);

  const loadPost = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await postsApi.getById(id);
      setPost(response.data.post ?? null);
      // Backend may return comments as undefined for a post with none; guard so
      // adding the first comment ([...prev]) doesn't crash.
      setComments(response.data.comments ?? []);
    } catch {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleLike = useCallback(async () => {
    if (!id || !post) return;
    const prev = post;
    setPost((p) =>
      p
        ? {
            ...p,
            isLiked: !p.isLiked,
            likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
          }
        : p,
    );
    try {
      await likePost(id);
    } catch {
      setPost(prev);
    }
  }, [id, post, likePost]);

  const handleSendComment = useCallback(async (text: string) => {
    if (!id) return;
    const response = await postsApi.comment(id, text);
    setComments((prev) => [...prev, response.data]);
    setPost((prev) =>
      prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev,
    );
  }, [id]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(id);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ],
    );
  }, [id, deletePost, router]);

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!id) return;
      Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await postsApi.deleteComment(id, commentId);
              setComments((prev) => prev.filter((c) => c._id !== commentId));
              setPost((prev) =>
                prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : prev,
              );
            } catch {
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            }
          },
        },
      ]);
    },
    [id],
  );

  const openPostOptions = useCallback(() => {
    if (!post) return;
    const author = typeof post.author === 'object' ? (post.author as User) : null;
    setModerationTarget({
      contentType: 'post',
      contentId: post._id,
      authorId: author?._id,
      authorName: author?.name,
    });
  }, [post]);

  const openCommentOptions = useCallback(
    (commentId: string) => {
      const comment = comments.find((c) => c._id === commentId);
      if (!comment) return;
      const author = typeof comment.author === 'object' ? (comment.author as User) : null;
      setModerationTarget({
        contentType: 'comment',
        contentId: commentId,
        authorId: author?._id,
        authorName: author?.name,
      });
    },
    [comments],
  );

  // Blocking from the post header means the whole post is gone — leave the
  // screen. Blocking a commenter just refetches so their comments vanish.
  const handleBlocked = useCallback(() => {
    if (moderationTarget?.contentType === 'post') {
      router.back();
    } else {
      loadPost();
    }
  }, [moderationTarget?.contentType, router, loadPost]);

  const isOwnContent = useCallback(
    (author: Comment['author'] | Post['author']) => {
      const ownerId = typeof author === 'object' ? (author as User)?._id : author;
      return !!user?._id && ownerId === user._id;
    },
    [user?._id],
  );

  const headerElement = useMemo(() => {
    if (!post) return null;
    const author = typeof post.author === 'object' ? (post.author as User) : null;
    const isAuthor = !!author && !!user && author._id === user._id;
    const canViewAnalytics = isAdmin || isAuthor;
    return (
      <PostHeader
        post={post}
        isLiked={post.isLiked ?? false}
        onLike={handleLike}
        onDelete={handleDelete}
        onAnalytics={canViewAnalytics ? () => router.push(`/(app)/(feed)/analytics/${post._id}` as any) : undefined}
        isSuperAdmin={isSuperAdmin}
      />
    );
  }, [post, handleLike, handleDelete, isSuperAdmin, isAdmin, user, router]);

  if (isLoading) {
    return (
      <SafeScreen>
        <Header title="Post" showBack onBack={() => router.back()} />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  if (!post) {
    return (
      <SafeScreen>
        <Header title="Post" showBack onBack={() => router.back()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Post not found"
          message="This post may have been deleted."
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <Header
        title="Post"
        showBack
        onBack={() => router.back()}
        rightAction={
          !isOwnContent(post.author) ? (
            <TouchableOpacity
              onPress={openPostOptions}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ContentModerationSheet
        visible={moderationTarget !== null}
        onClose={() => setModerationTarget(null)}
        target={moderationTarget}
        onBlocked={handleBlocked}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <CommentCard
              comment={item}
              showDelete={isSuperAdmin}
              onDelete={handleDeleteComment}
              onOptions={isOwnContent(item.author) ? undefined : openCommentOptions}
            />
          )}
          ListHeaderComponent={() => headerElement}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={styles.emptyText}>
                No comments yet. Be the first to comment.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <CommentInput onSend={handleSendComment} />
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Post image
  postImage: {
    width: '100%',
    aspectRatio: 4 / 5,
  },

  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  authorInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorName: {
    fontFamily: fontFamily.medium,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
  timestamp: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
    marginTop: 2,
  },

  // Content
  content: {
    ...typography.body,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // Hashtags
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  hashtag: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.primary.yellowDark,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCount: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
  },

  // Comments
  commentsHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  commentsTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  emptyComments: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.light,
    textAlign: 'center',
  },

  // Comment input
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
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.primary,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    maxHeight: ms(100),
    minHeight: ms(40),
  },
  sendButton: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: colors.primary.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
