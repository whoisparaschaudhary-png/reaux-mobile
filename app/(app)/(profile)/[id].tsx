import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Badge } from '../../../src/components/ui/Badge';
import { usersApi } from '../../../src/api/endpoints/users';
import { formatDate } from '../../../src/utils/formatters';
import {
  colors,
  typography,
  fontFamily,
  spacing,
  borderRadius,
  layout,
} from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';
import type { User, Role } from '../../../src/types/models';

const roleBadgeVariant: Record<Role, 'primary' | 'success' | 'info'> = {
  user: 'primary',
  admin: 'success',
  superadmin: 'info',
};

const roleLabel: Record<Role, string> = {
  user: 'Member',
  admin: 'Admin',
  superadmin: 'Super Admin',
};

export default function ViewProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await usersApi.getUserById(id);
        setUser(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [id]);

  if (isLoading) {
    return (
      <SafeScreen>
        <Header title="Profile" showBack onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  if (error || !user) {
    return (
      <SafeScreen>
        <Header title="Profile" showBack onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'User not found'}</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <Header title="Profile" showBack onBack={() => router.back()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar & Name */}
        <View style={styles.profileHeader}>
          <Avatar uri={user.avatar} name={user.name} size={100} />
          <Text style={styles.name}>{user.name}</Text>
          <Badge
            text={roleLabel[user.role]}
            variant={roleBadgeVariant[user.role]}
          />
        </View>

        {/* Info Rows */}
        <View style={styles.infoSection}>
          <InfoRow label="Email" value={user.email} />
          {user.phone && <InfoRow label="Phone" value={user.phone} />}
          {user.gender && (
            <InfoRow
              label="Gender"
              value={user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
            />
          )}
          <InfoRow label="Joined" value={formatDate(user.createdAt)} />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: ms(40),
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(16),
    color: colors.status.error,
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  name: {
    ...typography.h2,
    color: colors.text.primary,
  },
  infoSection: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
  },
  infoValue: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.lg,
  },
});
