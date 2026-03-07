import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { formatRelative, formatNumber } from '../../utils/formatters';
import { colors, fontFamily, spacing } from '../../theme';
import type { Reel, User } from '../../types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReelCardProps {
  reel: Reel;
  isVisible: boolean;
  onLike: () => void;
  onComment: () => void;
  height: number;
}

export const ReelCard: React.FC<ReelCardProps> = ({ reel, isVisible, onLike, onComment, height }) => {
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

    // Cleanup: pause video when component unmounts
    return () => {
      try {
        player.pause();
      } catch {
        // Player may not be available
      }
    };
  }, [isVisible, player]);

  useEffect(() => {
    try {
      player.muted = isMuted;
    } catch {
      // Player may not be ready yet
    }
  }, [isMuted, player]);

  return (
    <View style={[styles.card, { height }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Mute toggle */}
      <TouchableOpacity
        style={styles.muteButton}
        onPress={() => setIsMuted((p) => !p)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons
          name={isMuted ? 'volume-mute' : 'volume-high'}
          size={20}
          color={colors.text.white}
        />
      </TouchableOpacity>

      {/* Bottom section: info (left) + actions (right) */}
      <View style={styles.bottomSection}>
        <View style={styles.bottomLeft}>
          <View style={styles.authorRow}>
            <Avatar uri={authorAvatar} name={authorName} size={36} />
            <Text style={styles.authorName}>{authorName}</Text>
          </View>
          {reel.caption ? (
            <Text style={styles.caption} numberOfLines={2}>
              {reel.caption}
            </Text>
          ) : null}
          <Text style={styles.timestamp}>{formatRelative(reel.createdAt)}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onLike} style={styles.actionItem}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={28}
              color={isLiked ? colors.status.error : colors.text.white}
            />
            <Text style={styles.actionText}>{formatNumber(reel.likesCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={26} color={colors.text.white} />
            <Text style={styles.actionText}>{formatNumber(reel.commentsCount ?? 0)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH,
    backgroundColor: colors.background.dark,
    overflow: 'hidden',
  },

  // Mute
  muteButton: {
    position: 'absolute',
    top: spacing.xxl + spacing.xl,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.overlay.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom section
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  bottomLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  actions: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.xs,
  },
  actionItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.text.white,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  authorName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.text.white,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.white,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  timestamp: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
