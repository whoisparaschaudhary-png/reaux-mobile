import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useUIStore } from '../../stores/useUIStore';
import type { AlertButton } from '../../stores/useUIStore';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../theme';

export function AppAlert() {
  const alert = useUIStore((s) => s.alert);
  const hideAlert = useUIStore((s) => s.hideAlert);

  if (!alert) return null;

  const handlePress = (button: AlertButton) => {
    button.onPress?.();
    hideAlert();
  };

  return (
    <Modal
      visible={!!alert}
      transparent
      animationType="fade"
      onRequestClose={hideAlert}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={hideAlert}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {alert.title ? (
            <Text style={styles.title} numberOfLines={1}>
              {alert.title}
            </Text>
          ) : null}
          {alert.message ? (
            <Text style={styles.message} numberOfLines={5}>
              {alert.message}
            </Text>
          ) : null}
          <View style={styles.buttons}>
            {alert.buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    !isCancel && !isDestructive && styles.buttonPrimary,
                  ]}
                  onPress={() => handlePress(btn)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextDestructive,
                      !isCancel && !isDestructive && styles.buttonTextPrimary,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay.medium,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.card,
    padding: spacing.xxl,
    ...shadows.large,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary.yellow,
  },
  buttonCancel: {
    backgroundColor: colors.border.light,
  },
  buttonDestructive: {
    backgroundColor: colors.status.error,
  },
  buttonText: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
  },
  buttonTextPrimary: {
    color: colors.text.onPrimary,
  },
  buttonTextCancel: {
    color: colors.text.secondary,
  },
  buttonTextDestructive: {
    color: colors.text.white,
  },
});
