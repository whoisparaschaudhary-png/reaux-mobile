import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUIStore } from '../../stores/useUIStore';
import { colors, fontFamily, borderRadius, spacing, shadows } from '../../theme';

const ICON_MAP = {
  success: 'checkmark-circle' as const,
  error: 'alert-circle' as const,
  info: 'information-circle' as const,
};

const COLOR_MAP = {
  success: colors.status.success,
  error: colors.status.error,
  info: colors.status.info,
};

export const Toast: React.FC = () => {
  const { toast, hideToast } = useUIStore();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out AND slide fully off-screen so nothing lingers regardless of
      // insets/height on a given device.
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -200,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toast.visible, translateY, opacity]);

  if (!toast.message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + spacing.sm, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents={toast.visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={[styles.toast, shadows.card]}
        activeOpacity={0.9}
        onPress={hideToast}
      >
        <Ionicons
          name={ICON_MAP[toast.type]}
          size={22}
          color={COLOR_MAP[toast.type]}
        />
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  message: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
});
