import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../../src/theme';

interface MenuItemProps {
  label: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
  </TouchableOpacity>
);

function ManageMembershipsContent() {
  const router = useRouter();
  const { backRoute } = useLocalSearchParams<{ backRoute?: string }>();
  const handleBack = () => backRoute === 'profile' ? router.navigate('/(app)/(profile)') : router.back();

  return (
    <SafeScreen>
      <Header title="Manage Memberships" showBack onBack={handleBack} />

      <View style={styles.container}>
        <View style={styles.menuCard}>
          <MenuItem
            label="Membership Plans"
            onPress={() => router.push('/(app)/(admin)/memberships/plans')}
          />
          <View style={styles.divider} />
          <MenuItem
            label="User Memberships"
            onPress={() => router.push('/(app)/(profile)/user-memberships')}
          />
        </View>
      </View>
    </SafeScreen>
  );
}

export default function ManageMembershipsScreen() {
  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']} fallbackRoute="/(app)/(profile)">
      <ManageMembershipsContent />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  menuCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  menuLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.lg,
  },
});
