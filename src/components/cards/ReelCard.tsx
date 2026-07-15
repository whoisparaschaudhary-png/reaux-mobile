import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { formatRelative, formatNumber } from '../../utils/formatters';
import { colors, fontFamily, spacing } from '../../theme';
import { ms, mvs } from '../../utils/responsive';
import type { Reel, User } from '../../types/models';

interface ReelCardProps {
  reel: Reel;
  isVisible: boolean;
  onLike: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  height: number;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  isVisible,
  onLike,
  onComment,
  onShare,
  onDelete,
  height,
}) => {
  const { width: screenW } = useWindowDimensions();
  const [isMuted, setIsMuted] = React.useState(false);
  const author = typeof reel.author === 'object' ? (reel.author as User) : null;
  const authorName = author?.name ?? 'Unknown';
  const authorAvatar = author?.avatar;
  const isLiked = reel.isLiked;

  const player = useVideoPlayer(reel.videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    try {
      if (isVisible) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // Player may not be ready yet
    }
    return () => {
      try { player.pause(); } catch { /* noop */ }
    };
  }, [isVisible, player]);

  useEffect(() => {
    try { player.muted = isMuted; } catch { /* noop */ }
  }, [isMuted, player]);

  return (
    <View style={[styles.card, { height, width: screenW }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      <TouchableOpacity
        style={styles.muteButton}
        onPress={() => setIsMuted((p) => !p)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons
          name={isMuted ? 'volume-mute' : 'volume-high'}
          size={ms(20)}
          color={colors.text.white}
        />
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onLike} style={styles.actionItem}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={ms(28)}
            color={isLiked ? colors.status.error : colors.text.white}
          />
          <Text style={styles.actionText}>{formatNumber(reel.likesCount)}</Text>
        </TouchableOpacity>
        {onComment != null && (
          <TouchableOpacity onPress={onComment} style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={ms(26)} color={colors.text.white} />
            <Text style={styles.actionText}>{formatNumber(reel.commentsCount ?? 0)}</Text>
          </TouchableOpacity>
        )}
        {onShare != null && (
          <TouchableOpacity onPress={onShare} style={styles.actionItem}>
            <Ionicons name="share-outline" size={ms(26)} color={colors.text.white} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        )}
        {onDelete != null && (
          <TouchableOpacity onPress={onDelete} style={styles.actionItem}>
            <Ionicons name="trash-outline" size={ms(26)} color={colors.status.error} />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomInfo}>
        <View style={styles.authorRow}>
          <Avatar uri={authorAvatar} name={authorName} size={ms(36)} />
          <Text style={styles.authorName}>{authorName}</Text>
        </View>
        {reel.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {reel.caption}
          </Text>
        ) : null}
        <Text style={styles.timestamp}>{formatRelative(reel.createdAt)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.dark,
    overflow: 'hidden',
  },

  muteButton: {
    position: 'absolute',
    top: mvs(80),
    right: spacing.md,
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: colors.overlay.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actions: {
    position: 'absolute',
    right: spacing.md,
    bottom: mvs(120),
    alignItems: 'center',
    gap: spacing.xl,
  },
  actionItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(12),
    color: colors.text.white,
  },

  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: ms(60),
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  authorName: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    color: colors.text.white,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  timestamp: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    color: 'rgba(255,255,255,0.6)',
  },
});
