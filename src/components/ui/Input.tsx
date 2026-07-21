import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { colors, typography, fontFamily, borderRadius, spacing } from '../theme';
import { ms, mvs } from '../../utils/responsive';

interface InputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize,
  multiline = false,
  numberOfLines,
  maxLength,
  leftIcon,
  rightIcon,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyles: ViewStyle[] = [
    styles.inputContainer,
    isFocused && styles.inputFocused,
    error ? styles.inputError : undefined,
    multiline && styles.multiline,
  ].filter(Boolean) as ViewStyle[];

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={inputContainerStyles}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            multiline && styles.multilineInput,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.light}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Filled, borderless resting state (premium; matches the Figma). A yellow
    // border appears on focus (see inputFocused — paint-only, no shadow).
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.border.light,
    minHeight: mvs(52),
  },
  inputFocused: {
    // Paint-only change on focus (border color). Do NOT add a shadow or swap the
    // background here: on the New Architecture, adding a shadow can force the
    // container view to un-flatten and re-create its native children, which resigns
    // the TextInput's first responder the instant it focuses — the keyboard opens and
    // immediately closes. Keeping this to a paint prop avoids that.
    borderColor: colors.primary.yellow,
  },
  inputError: {
    borderColor: colors.status.error,
    backgroundColor: colors.background.white,
  },
  multiline: {
    minHeight: mvs(100),
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: ms(16),
    lineHeight: ms(24),
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },
  multilineInput: {
    paddingTop: spacing.md,
    minHeight: mvs(96),
  },
  iconLeft: {
    paddingLeft: spacing.md,
  },
  iconRight: {
    paddingRight: spacing.md,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.status.error,
    marginTop: spacing.xs,
  },
});
