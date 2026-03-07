import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, fontFamily, borderRadius, spacing } from '../theme';

type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'default';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: {
    bg: colors.primary.yellowLight,
    text: colors.text.primary,
  },
  success: {
    bg: '#dcfce7',
    text: '#166534',
  },
  error: {
    bg: '#fee2e2',
    text: '#991b1b',
  },
  warning: {
    bg: '#fef3c7',
    text: '#92400e',
  },
  info: {
    bg: '#dbeafe',
    text: '#1e40af',
  },
  default: {
    bg: colors.border.light,
    text: colors.text.secondary,
  },
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'md',
}) => {
  const resolvedVariant = variant && variantColors[variant] ? variant : 'default';
  const colorScheme = variantColors[resolvedVariant];

  const containerStyle: ViewStyle = {
    backgroundColor: colorScheme.bg ?? colors.border.light,
  };

  const textStyle: TextStyle = {
    color: colorScheme.text ?? colors.text.secondary,
  };

  return (
    <View style={[styles.base, sizeStyles[size], containerStyle]}>
      <Text style={[styles.text, textSizeStyles[size], textStyle]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.pill,
  },
  text: {
    fontFamily: fontFamily.medium,
  },
});

const sizeStyles: Record<BadgeSize, ViewStyle> = {
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
};

const textSizeStyles: Record<BadgeSize, TextStyle> = {
  sm: {
    fontSize: 10,
    lineHeight: 14,
  },
  md: {
    fontSize: 12,
    lineHeight: 16,
  },
};
