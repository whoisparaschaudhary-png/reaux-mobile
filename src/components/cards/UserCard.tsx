import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { colors, fontFamily, spacing } from '../../theme';
import { formatDate } from '../../utils/formatters';
import type { User } from '../../types/models';

interface UserCardProps {
  user: User;
  onDeactivate?: (user: User) => void;
  onPress?: (user: User) => void;
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'superadmin':
      return 'error' as const;
    case 'admin':
      return 'warning' as const;
    default:
      return 'default' as const;
  }
};

export const UserCard: React.FC<UserCardProps> = ({ user, onDeactivate, onPress }) => {
  const isActive = user.status === 'active';

  return (
    <Card
      style={styles.card}
      onPress={onPress ? () => onPress(user) : undefined}
    >
      <View style={styles.row}>
        <Avatar uri={user.avatar} name={user.name} size={44} />

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

          {onDeactivate && (
            <TouchableOpacity
              onPress={() => onDeactivate(user)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.removeButton}
            >
              <Ionicons name="close" size={18} color={colors.status.error} />
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
    marginBottom: 2,
  },
  name: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
    flexShrink: 1,
  },
  email: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  doj: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.light,
    marginTop: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
