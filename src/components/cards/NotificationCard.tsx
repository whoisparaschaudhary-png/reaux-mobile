import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import { formatRelative } from '../../utils/formatters';
import { ms, mvs } from '../../utils/responsive';
import type { Notification, NotificationType } from '../../types/models';

interface NotificationCardProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onMarkAsRead?: (id: string) => void;
}

const iconMap: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  order:        'cart-outline',
  challenge:    'trophy-outline',
  community:    'people-outline',
  diet:         'leaf-outline',
  system:       'settings-outline',
  announcement: 'megaphone-outline',
};

const iconColorMap: Record<NotificationType, string> = {
  order:        colors.status.info,
  challenge:    colors.status.warning,
  community:    colors.status.success,
  diet:         '#22c55e',
  system:       colors.text.secondary,
  announcement: colors.primary.yellowDark,
};

const iconBgMap: Record<NotificationType, string> = {
  order:        '#dbeafe',
  challenge:    '#fef3c7',
  community:    '#dcfce7',
  diet:         '#dcfce7',
  announcement: colors.primary.yellowLight,
  system:       colors.border.light,
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onMarkAsRead,
}) => {
  const { _id, title, message, type, isRead, createdAt } = notification;
  const iconName  = iconMap[type]  || 'notifications-outline';
  const iconColor = iconColorMap[type] || colors.text.secondary;
  const iconBg    = iconBgMap[type] ?? colors.border.light;

  const handlePress = () => {
    if (!isRead && onMarkAsRead) onMarkAsRead(_id);
    onPress?.(notification);
  };

  return (
    <TouchableOpacity
      style={[styles.container, !isRead && styles.unreadContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg || colors.border.light }]}>
        <Ionicons name={iconName} size={ms(20)} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, !isRead && styles.titleUnread]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {!isRead && <View style={styles.unreadDot} />}
        </View>

        {message && (
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        )}

        {type === 'order' && notification.metadata && (
          <View style={styles.metadataRow}>
            {notification.metadata.orderId && (
              <Text style={styles.metadataText}>
                Order #{notification.metadata.orderId.slice(-6).toUpperCase()}
              </Text>
            )}
            {notification.metadata.amount != null && (
              <Text style={styles.metadataText}>
                {'\u20B9'}{notification.metadata.amount}
              </Text>
            )}
          </View>
        )}

        <Text style={styles.timestamp}>{formatRelative(createdAt)}</Text>
      </View>

      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={ms(16)} color={colors.text.light} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.white,
  },
  unreadContainer: {
    backgroundColor: colors.primary.yellowLight + '20',
  },
  iconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
    flex: 1,
  },
  titleUnread: {
    fontFamily: fontFamily.bold,
  },
  unreadDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: colors.primary.yellow,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
    marginTop: mvs(2),
  },
  metadataRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: mvs(2),
  },
  metadataText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.status.info,
  },
  timestamp: {
    fontFamily: fontFamily.regular,
    fontSize: ms(11),
    lineHeight: ms(16),
    color: colors.text.light,
    marginTop: spacing.xs,
  },
  chevron: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
