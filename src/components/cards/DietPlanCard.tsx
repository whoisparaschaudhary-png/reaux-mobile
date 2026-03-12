import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, withSpring, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../theme';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatNumber } from '../../utils/formatters';
import type { DietPlan, DietCategory, User } from '../../types/models';

interface DietPlanCardProps {
  plan: DietPlan;
  onPress: () => void;
}

const categoryBadgeVariant: Record<DietCategory, { variant: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'default'; label: string }> = {
  'weight-loss': { variant: 'error', label: 'Weight Loss' },
  'muscle-gain': { variant: 'success', label: 'Muscle Gain' },
  'bulking': { variant: 'warning', label: 'Bulking' },
  'cutting': { variant: 'info', label: 'Cutting' },
  'other': { variant: 'default', label: 'Other' },
};

export const DietPlanCard: React.FC<DietPlanCardProps> = ({ plan, onPress }) => {
  const author = typeof plan.createdBy === 'object' ? (plan.createdBy as User) : null;
  const categoryInfo = categoryBadgeVariant[plan.category] || categoryBadgeVariant.other;

  // Card fade-in animation on mount
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
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.container, shadows.card]}
      >
      {/* Image */}
      <View style={styles.imageContainer}>
        {plan.image ? (
          <Image
            source={{ uri: plan.image }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant-outline" size={32} color={colors.text.light} />
          </View>
        )}
        <View style={styles.badgeOverlay}>
          <Badge text={categoryInfo.label} variant={categoryInfo.variant} size="sm" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {plan.title}
        </Text>
        {plan.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {plan.description}
          </Text>
        ) : null}

        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={styles.authorInfo}>
            <Avatar
              uri={author?.avatar}
              name={author?.name || 'Unknown'}
              size={28}
            />
            <Text style={styles.authorName} numberOfLines={1}>
              {author?.name || 'Unknown'}
            </Text>
            {author?.role === 'admin' || author?.role === 'superadmin' ? (
              <Ionicons name="checkmark-circle" size={14} color={colors.status.info} />
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="heart" size={14} color={colors.status.error} />
            <Text style={styles.statText}>{formatNumber(plan.likesCount ?? 0)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="people" size={14} color={colors.text.secondary} />
            <Text style={styles.statText}>{formatNumber(plan.followersCount ?? 0)}</Text>
          </View>
          {plan.totalCalories ? (
            <View style={styles.stat}>
              <Ionicons name="flame" size={14} color={colors.status.warning} />
              <Text style={styles.statText}>{plan.totalCalories} cal</Text>
            </View>
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
    height: 160,
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
  badgeOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  authorName: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.primary,
    flexShrink: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
});
