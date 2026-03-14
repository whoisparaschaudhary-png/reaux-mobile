import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Badge } from '../../../src/components/ui/Badge';
import { CommentCard } from '../../../src/components/cards/CommentCard';
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
import type { Post, Comment, User, Role } from '../../../src/types/models';

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

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPost = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await postsApi.getById(id);
      setPost(response.data.post);
      setComments(response.data.comments);
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
    if (!id) return;
    await likePost(id);
    // Re-fetch to get updated post
    try {
      const response = await postsApi.getById(id);
      setPost(response.data.post);
    } catch {
      // Ignore
    }
  }, [id, likePost]);

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

  const author =
    typeof post.author === 'object' ? (post.author as User) : null;
  const authorName = author?.name ?? 'Unknown';
  const authorAvatar = author?.avatar;
  const authorRole = author?.role as Role | undefined;
  const hasImage = post.mediaType === 'image' && post.mediaUrl;

  // Check if current user has liked this post
  const isLiked = user && post.isLiked !== undefined
    ? post.isLiked
    : user && post.likes?.includes(user._id);

  const renderHeader = () => (
    <View>
      {/* Post image */}
      {hasImage && (
        <Image
          source={{ uri: post.mediaUrl }}
          style={styles.postImage}
          contentFit="cover"
          transition={300}
        />
      )}

      {/* Author info */}
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
          <Text style={styles.timestamp}>
            {formatRelative(post.createdAt)}
          </Text>
        </View>
      </View>

      {/* Content */}
      {post.content ? (
        <Text style={styles.content}>{post.content}</Text>
      ) : null}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <View style={styles.hashtagRow}>
          {post.hashtags.map((tag) => (
            <Text key={tag} style={styles.hashtag}>
              #{tag}
            </Text>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={handleLike}
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={
              isLiked
                ? colors.status.error
                : colors.text.secondary
            }
          />
          <Text style={styles.actionCount}>
            {formatNumber(post.likesCount)}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionButton}>
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color={colors.text.secondary}
          />
          <Text style={styles.actionCount}>
            {formatNumber(post.commentsCount)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => {
            Share.share({
              message: post.caption
                ? `${post.caption} — shared from REAUX Labs`
                : 'Check out this post on REAUX Labs!',
            });
          }}
        >
          <Ionicons
            name="share-outline"
            size={22}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Comments header */}
      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>Comments</Text>
      </View>
    </View>
  );

  return (
    <SafeScreen>
      <Header
        title="Post"
        showBack
        onBack={() => router.back()}
        rightAction={
          isSuperAdmin ? (
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={22} color={colors.status.error} />
            </TouchableOpacity>
          ) : undefined
        }
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
            />
          )}
          ListHeaderComponent={renderHeader}
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
    height: 300,
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
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  timestamp: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
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
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 14,
    lineHeight: 20,
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
