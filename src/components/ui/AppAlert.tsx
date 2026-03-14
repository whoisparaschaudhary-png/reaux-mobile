import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '../../stores/useUIStore';
import type { AlertButton } from '../../stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';

export function AppAlert() {
  const alert = useUIStore((s) => s.alert);
  const hideAlert = useUIStore((s) => s.hideAlert);

  if (!alert) return null;

  const handlePress = (button: AlertButton) => {
    button.onPress?.();
    hideAlert();
  };

  const cancelButton = alert.buttons.find((b) => b.style === 'cancel');
  const actionButtons = alert.buttons.filter((b) => b.style !== 'cancel');

  return (
    <Modal
      visible={!!alert}
      transparent
      animationType="slide"
      onRequestClose={hideAlert}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={hideAlert}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          {(alert.title || alert.message) && (
            <View style={styles.header}>
              {alert.title ? (
                <Text style={styles.title}>{alert.title}</Text>
              ) : null}
              {alert.message ? (
                <Text style={styles.message}>{alert.message}</Text>
              ) : null}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {actionButtons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    isDestructive && styles.actionButtonDestructive,
                    index < actionButtons.length - 1 && styles.actionButtonBorder,
                  ]}
                  onPress={() => handlePress(btn)}
                  activeOpacity={0.7}
                >
                  {btn.icon ? (
                    <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
                      <Ionicons
                        name={btn.icon as any}
                        size={22}
                        color={isDestructive ? colors.status.error : colors.text.primary}
                      />
                    </View>
                  ) : null}
                  <View style={styles.actionTextGroup}>
                    <Text style={[styles.actionText, isDestructive && styles.actionTextDestructive]}>
                      {btn.text}
                    </Text>
                    {btn.subtitle ? (
                      <Text style={styles.actionSubtitle}>{btn.subtitle}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.text.light} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cancel button */}
          {cancelButton && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handlePress(cancelButton)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{cancelButton.text}</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.gray,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  actions: {
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.white,
  },
  actionButtonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  actionButtonDestructive: {
    backgroundColor: '#fff5f5',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDestructive: {
    backgroundColor: '#ffe4e4',
  },
  actionTextGroup: {
    flex: 1,
  },
  actionText: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  actionTextDestructive: {
    color: colors.status.error,
  },
  actionSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
    marginTop: 2,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.card,
    backgroundColor: colors.border.light,
  },
  cancelText: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.text.secondary,
  },
});
