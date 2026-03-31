import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, withSequence, withSpring, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, fontFamily, spacing, borderRadius } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { formatRelative, formatNumber } from '../../utils/formatters';
import { ms } from '../../utils/responsive';
import type { Post, User, Role } from '../../types/models';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

const getRoleBadge = (role: Role): { text: string; variant: 'primary' | 'success' | 'info' } | null => {
  if (role === 'admin') return { text: 'Admin', variant: 'primary' };
  if (role === 'superadmin') return { text: 'Coach', variant: 'success' };
  return null;
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onShare,
}) => {
  const { width: screenW } = useWindowDimensions();
  const cardMargin = spacing.lg;

  const author = typeof post.author === 'object' ? post.author as User : null;
  const authorName = author?.name ?? 'Unknown';
  const authorAvatar = author?.avatar;
  const authorRole = author?.role as Role | undefined;
  const roleBadge = authorRole ? getRoleBadge(authorRole) : null;
  const hasImage = post.mediaType === 'image' && post.mediaUrl;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const likeScale = useSharedValue(1);
  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const handleLike = () => {
    likeScale.value = withSequence(
      withSpring(1.3, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onLike?.();
  };

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.card, { marginHorizontal: cardMargin }]}
      >
        {hasImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: post.mediaUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
            <View style={styles.imageOverlay} />
            <View style={styles.authorOverlay}>
              <Avatar uri={authorAvatar} name={authorName} size={ms(36)} />
              <View style={styles.authorInfo}>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorNameLight} numberOfLines={1}>
                    {authorName}
                  </Text>
                  {roleBadge && (
                    <Badge text={roleBadge.text} variant={roleBadge.variant} size="sm" />
                  )}
                </View>
                <Text style={styles.timestampLight}>
                  {formatRelative(post.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.authorRow}>
            <Avatar uri={authorAvatar} name={authorName} size={ms(40)} />
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName} numberOfLines={1}>
                  {authorName}
                </Text>
                {roleBadge && (
                  <Badge text={roleBadge.text} variant={roleBadge.variant} size="sm" />
                )}
              </View>
              <Text style={styles.timestamp}>
                {formatRelative(post.createdAt)}
              </Text>
            </View>
          </View>
        )}

        {post.content ? (
          <View style={styles.contentContainer}>
            <Text style={styles.content} numberOfLines={3}>
              {post.content}
            </Text>
          </View>
        ) : null}

        {post.hashtags && post.hashtags.length > 0 && (
          <View style={styles.hashtagRow}>
            {post.hashtags.slice(0, 4).map((tag) => (
              <Text key={tag} style={styles.hashtag}>
                #{tag}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleLike}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={likeAnimatedStyle}>
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={ms(22)}
                color={post.isLiked ? colors.status.error : colors.text.secondary}
              />
            </Animated.View>
            <Text style={styles.actionCount}>
              {formatNumber(post.likesCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onComment}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={ms(20)}
              color={colors.text.secondary}
            />
            <Text style={styles.actionCount}>
              {formatNumber(post.commentsCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onShare}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="share-outline"
              size={ms(20)}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {post.category && (
            <Badge text={post.category} variant="default" size="sm" />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },

  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },

  authorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.overlay.medium,
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
  authorNameLight: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.white,
  },
  timestampLight: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: 'rgba(255,255,255,0.7)',
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  authorName: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
  },
  timestamp: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },

  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  content: {
    ...typography.body,
    color: colors.text.primary,
  },

  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  hashtag: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.primary.yellowDark,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCount: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
  },
});
