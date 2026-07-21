import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import { formatDate } from '../../utils/formatters';
import { ms, mvs } from '../../utils/responsive';
import type { User } from '../../types/models';

interface UserCardProps {
  user: User;
  onDeactivate?: (user: User) => void;
  onPress?: (user: User) => void;
  membershipEndDate?: string;
  /** Position in the list — drives the staggered entrance animation. */
  index?: number;
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'superadmin': return 'error' as const;
    case 'admin':      return 'warning' as const;
    default:           return 'default' as const;
  }
};

const getExpiryColor = (endDate: string) => {
  const daysLeft = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0)  return colors.status.error;
  if (daysLeft <= 7) return colors.status.warning;
  return colors.text.light;
};

export const UserCard: React.FC<UserCardProps> = ({ user, onDeactivate, onPress, membershipEndDate, index = 0 }) => {
  const isActive = user.status === 'active';
  const statusColor = isActive ? colors.status.success : colors.status.error;

  return (
    <Animated.View entering={FadeInDown.duration(300).delay((index % 8) * 45)}>
      <Card
        style={styles.card}
        onPress={onPress ? () => onPress(user) : undefined}
      >
        <View style={styles.row}>
          <Avatar uri={user.avatar} name={user.name} size={ms(48)} borderColor={statusColor} />

          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {user.name}
              </Text>
              <Badge
                text={user.role}
                variant={getRoleBadgeVariant(user.role)}
                size="sm"
              />
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="mail-outline" size={ms(12)} color={colors.text.light} />
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
            </View>

            {(user.dateOfJoining || user.createdAt) && (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={ms(12)} color={colors.text.light} />
                <Text style={styles.doj} numberOfLines={1}>
                  Joined {formatDate(user.dateOfJoining || user.createdAt)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.rightSection}>
            <View style={[styles.statusPill, { backgroundColor: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {isActive ? 'Active' : 'Disabled'}
              </Text>
            </View>

            {membershipEndDate && (
              <View style={styles.expiryRow}>
                <Ionicons name="time-outline" size={ms(11)} color={getExpiryColor(membershipEndDate)} />
                <Text style={[styles.expiryText, { color: getExpiryColor(membershipEndDate) }]}>
                  {formatDate(membershipEndDate)}
                </Text>
              </View>
            )}

            {onDeactivate ? (
              <TouchableOpacity
                onPress={() => onDeactivate(user)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.removeButton}
                accessibilityLabel="Deactivate user"
              >
                <Ionicons name="close" size={ms(18)} color={colors.status.error} />
              </TouchableOpacity>
            ) : onPress ? (
              <Ionicons name="chevron-forward" size={ms(18)} color={colors.text.light} />
            ) : null}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
    gap: mvs(3),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.primary,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
  },
  email: {
    flexShrink: 1,
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
  },
  doj: {
    fontFamily: fontFamily.regular,
    fontSize: ms(11),
    lineHeight: ms(16),
    color: colors.text.light,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    paddingHorizontal: spacing.sm,
    paddingVertical: mvs(4),
    borderRadius: borderRadius.pill,
  },
  statusDot: {
    width: ms(7),
    height: ms(7),
    borderRadius: ms(4),
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(11),
    lineHeight: ms(14),
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(3),
  },
  expiryText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(10),
    lineHeight: ms(14),
    textAlign: 'right',
  },
  removeButton: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
