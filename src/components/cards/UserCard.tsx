import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { colors, fontFamily, spacing } from '../../theme';
import { formatDate } from '../../utils/formatters';
import { ms, mvs } from '../../utils/responsive';
import type { User } from '../../types/models';

interface UserCardProps {
  user: User;
  onDeactivate?: (user: User) => void;
  onPress?: (user: User) => void;
  membershipEndDate?: string;
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

export const UserCard: React.FC<UserCardProps> = ({ user, onDeactivate, onPress, membershipEndDate }) => {
  const isActive = user.status === 'active';

  return (
    <Card
      style={styles.card}
      onPress={onPress ? () => onPress(user) : undefined}
    >
      <View style={styles.row}>
        <Avatar uri={user.avatar} name={user.name} size={ms(44)} />

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
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
          {(user.dateOfJoining || user.createdAt) && (
            <Text style={styles.doj} numberOfLines={1}>
              DOJ: {formatDate(user.dateOfJoining || user.createdAt)}
            </Text>
          )}
        </View>

        <View style={styles.rightSection}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? colors.status.success : colors.status.error },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isActive ? colors.status.success : colors.status.error },
              ]}
            >
              {isActive ? 'Active' : 'Disabled'}
            </Text>
          </View>

          {membershipEndDate && (
            <Text style={[styles.expiryText, { color: getExpiryColor(membershipEndDate) }]}>
              Exp: {formatDate(membershipEndDate)}
            </Text>
          )}

          {onDeactivate && (
            <TouchableOpacity
              onPress={() => onDeactivate(user)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.removeButton}
            >
              <Ionicons name="close" size={ms(18)} color={colors.status.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
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
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: mvs(2),
  },
  name: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.primary,
    flexShrink: 1,
  },
  email: {
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
    marginTop: mvs(1),
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  statusDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(11),
    lineHeight: ms(14),
  },
  expiryText: {
    fontFamily: fontFamily.regular,
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
