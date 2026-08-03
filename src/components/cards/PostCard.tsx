import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSequence, withSpring, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, fontFamily, spacing, borderRadius } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { formatRelative, formatNumber } from '../../utils/formatters';
import { haptics } from '../../utils/haptics';
import { ms } from '../../utils/responsive';
import type { Post, User, Role } from '../../types/models';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  /** Opens the report/block sheet. Omitted for the viewer's own posts. */
  onOptions?: () => void;
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
  onOptions,
}) => {
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
    haptics.medium();
    likeScale.value = withSequence(
      withSpring(1.3, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onLike?.();
  };

  // A vertical action rail overlaid on image posts (matches the redesign).
  const railButton = (
    icon: keyof typeof Ionicons.glyphMap,
    activeIcon: keyof typeof Ionicons.glyphMap,
    active: boolean,
    activeColor: string,
    onPress: (() => void) | undefined,
    label?: string,
    animated?: boolean,
  ) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.railItem}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      activeOpacity={0.8}
    >
      <View style={styles.railCircle}>
        {animated ? (
          <Animated.View style={likeAnimatedStyle}>
            <Ionicons name={active ? activeIcon : icon} size={ms(20)} color={active ? activeColor : colors.text.white} />
          </Animated.View>
        ) : (
          <Ionicons name={active ? activeIcon : icon} size={ms(20)} color={active ? activeColor : colors.text.white} />
        )}
      </View>
      {label ? <Text style={styles.railLabel}>{label}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.card, { marginHorizontal: cardMargin }]}
      >
        {hasImage ? (
          <>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: post.mediaUrl }}
                style={styles.image}
                contentFit="cover"
                transition={300}
                placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.65)']}
                style={styles.gradient}
                pointerEvents="none"
              />

              {/* Floating action rail */}
              <View style={styles.rail}>
                {railButton('heart-outline', 'heart', !!post.isLiked, colors.status.error, handleLike, formatNumber(post.likesCount), true)}
                {railButton('chatbubble-outline', 'chatbubble', false, colors.text.white, onComment, formatNumber(post.commentsCount))}
                {railButton('share-social-outline', 'share-social', false, colors.text.white, onShare, 'Share')}
                {onOptions && railButton('ellipsis-horizontal', 'ellipsis-horizontal', false, colors.text.white, onOptions)}
              </View>

              {/* Author overlay */}
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
          </>
        ) : (
          <>
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

            {post.content ? (
              <View style={styles.contentContainer}>
                <Text style={styles.content} numberOfLines={4}>
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
                <Text style={styles.actionCount}>{formatNumber(post.likesCount)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onComment}
                style={styles.actionButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chatbubble-outline" size={ms(20)} color={colors.text.secondary} />
                <Text style={styles.actionCount}>{formatNumber(post.commentsCount)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onShare}
                style={styles.actionButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-outline" size={ms(20)} color={colors.text.secondary} />
              </TouchableOpacity>

              <View style={{ flex: 1 }} />

              {post.category && (
                <Badge text={post.category} variant="default" size="sm" />
              )}

              {onOptions && (
                <TouchableOpacity
                  onPress={onOptions}
                  style={styles.actionButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="ellipsis-horizontal" size={ms(20)} color={colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
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
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },

  rail: {
    position: 'absolute',
    right: spacing.md,
    bottom: ms(76),
    alignItems: 'center',
    gap: spacing.md,
  },
  railItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  railCircle: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(11),
    lineHeight: ms(15),
    color: colors.text.white,
  },

  authorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.white,
  },
  timestampLight: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: 'rgba(255,255,255,0.75)',
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
    paddingTop: spacing.md,
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
    paddingBottom: spacing.md,
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
