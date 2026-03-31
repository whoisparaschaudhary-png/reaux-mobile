import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, fontFamily, spacing } from '../theme';
import { Button } from './Button';
import { ScaleEntranceView, SlideInUpView } from '../animated/AnimatedComponents';
import { ms, mvs } from '../../utils/responsive';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <ScaleEntranceView delay={0}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={ms(48)}
            color={colors.text.light}
          />
        </View>
      </ScaleEntranceView>

      <SlideInUpView delay={100}>
        <Text style={styles.title}>{title}</Text>
      </SlideInUpView>

      {message && (
        <SlideInUpView delay={200}>
          <Text style={styles.message}>{message}</Text>
        </SlideInUpView>
      )}

      {actionLabel && onAction && (
        <SlideInUpView delay={300} style={styles.actionContainer}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
          />
        </SlideInUpView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    backgroundColor: colors.border.light,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionContainer: {
    marginTop: spacing.sm,
  },
});
