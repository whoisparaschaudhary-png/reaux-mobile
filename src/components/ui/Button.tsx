import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, typography, fontFamily, borderRadius, spacing, shadows } from '../theme';
import { useScalePress } from '../../hooks/useAnimations';
import { haptics } from '../../utils/haptics';
import { ms, mvs } from '../../utils/responsive';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  style,
}) => {
  const isDisabled = disabled || loading;
  const { animatedStyle, onPressIn: handlePressIn, onPressOut: handlePressOut } = useScalePress();

  const containerStyles: ViewStyle[] = [
    styles.base,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    variant === 'primary' && !isDisabled && shadows.button,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    textVariantStyles[variant],
    textSizeStyles[size],
    isDisabled && styles.disabledText,
  ].filter(Boolean) as TextStyle[];

  const spinnerColor =
    variant === 'primary'
      ? colors.text.primary
      : variant === 'secondary'
        ? colors.text.white
        : colors.text.primary;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={isDisabled ? undefined : () => { haptics.light(); handlePressIn(); }}
      onPressOut={isDisabled ? undefined : handlePressOut}
      disabled={isDisabled}
    >
      <Animated.View style={[containerStyles, !isDisabled && animatedStyle]}>
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : (
          <>
            {leftIcon && leftIcon}
            <Text style={textStyles}>{title}</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.pill,
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: fontFamily.medium,
    letterSpacing: 0.2,
  },
  disabledText: {
    opacity: 0.7,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary.yellow,
  },
  secondary: {
    backgroundColor: colors.background.dark,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border.gray,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  primary:   { color: colors.text.onPrimary },
  secondary: { color: colors.text.white },
  outline:   { color: colors.text.primary },
  ghost:     { color: colors.text.primary },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingVertical:   mvs(8),
    paddingHorizontal: ms(16),
    minHeight:         mvs(36),
  },
  md: {
    paddingVertical:   mvs(12),
    paddingHorizontal: ms(20),
    minHeight:         mvs(44),
  },
  lg: {
    paddingVertical:   mvs(16),
    paddingHorizontal: ms(24),
    minHeight:         mvs(52),
  },
};

const textSizeStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: ms(13), lineHeight: ms(18) },
  md: { fontSize: ms(15), lineHeight: ms(20) },
  lg: { fontSize: ms(17), lineHeight: ms(22) },
};
