import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, withSpring, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { ms, mvs } from '../../utils/responsive';
import type { CyclePlan, CycleLevel, User } from '../../types/models';

interface CyclePlanCardProps {
  cycle: CyclePlan;
  onPress: () => void;
}

const LEVEL_LABEL: Record<CycleLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const CyclePlanCard: React.FC<CyclePlanCardProps> = ({ cycle, onPress }) => {
  const author = typeof cycle.createdBy === 'object' ? (cycle.createdBy as User) : null;
  const isVerified = author?.role === 'admin' || author?.role === 'superadmin';

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.container, shadows.card]}>
        <View style={styles.imageContainer}>
          {cycle.image ? (
            <Image
              source={{ uri: cycle.image }}
              style={styles.image}
              contentFit="cover"
              transition={250}
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="flask-outline" size={ms(32)} color={colors.text.light} />
            </View>
          )}

          {/* Bookmark / saved indicator */}
          {cycle.isFollowed ? (
            <View style={styles.bookmark}>
              <Ionicons name="bookmark" size={ms(16)} color={colors.primary.yellow} />
            </View>
          ) : null}

          {/* Duration + level badges */}
          <View style={styles.badgeRow}>
            {cycle.durationWeeks ? (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{cycle.durationWeeks} Weeks</Text>
              </View>
            ) : null}
            {cycle.level ? (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{LEVEL_LABEL[cycle.level]}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {cycle.title}
            </Text>
            <Ionicons name="chevron-forward" size={ms(20)} color={colors.text.light} />
          </View>

          {cycle.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {cycle.description}
            </Text>
          ) : null}

          <View style={styles.authorRow}>
            <Avatar uri={author?.avatar} name={author?.name || 'Unknown'} size={ms(24)} />
            <Text style={styles.authorName} numberOfLines={1}>
              By {author?.name || 'Unknown'}
            </Text>
            {isVerified ? (
              <Ionicons name="checkmark-circle" size={ms(14)} color={colors.status.info} />
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  imageContainer: {
    width: '100%',
    height: mvs(150),
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: colors.overlay.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  durationBadge: {
    backgroundColor: colors.overlay.dark,
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(4),
    borderRadius: borderRadius.pill,
  },
  durationText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(11),
    lineHeight: ms(15),
    color: colors.text.white,
  },
  levelBadge: {
    backgroundColor: colors.primary.yellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(4),
    borderRadius: borderRadius.pill,
  },
  levelText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(11),
    lineHeight: ms(15),
    color: colors.text.onPrimary,
  },
  content: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    flex: 1,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorName: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.primary,
    flexShrink: 1,
  },
});
