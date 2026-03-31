import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Card } from '../../../src/components/ui/Card';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { useAdminStore } from '../../../src/stores/useAdminStore';
import { formatNumber } from '../../../src/utils/formatters';
import { colors, fontFamily, spacing } from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  iconColor: string;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, iconColor, iconBg }) => (
  <Card style={styles.statCard}>
    <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={22} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{formatNumber(value)}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Card>
);

export default function AnalyticsScreen() {
  const router = useRouter();
  const { stats, isLoading, fetchStats } = useAdminStore();

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Analytics"
          showBack
          onBack={() => router.back()}
        />

        {isLoading && !stats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
          </View>
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.heading}>Platform Overview</Text>

            <View style={styles.grid}>
              <StatCard
                icon="people-outline"
                label="Total Users"
                value={stats?.totalUsers ?? 0}
                iconColor="#3b82f6"
                iconBg="#dbeafe"
              />
              <StatCard
                icon="document-text-outline"
                label="Total Posts"
                value={stats?.totalPosts ?? 0}
                iconColor="#8b5cf6"
                iconBg="#ede9fe"
              />
              <StatCard
                icon="cart-outline"
                label="Total Orders"
                value={stats?.totalOrders ?? 0}
                iconColor="#22c55e"
                iconBg="#dcfce7"
              />
              <StatCard
                icon="cube-outline"
                label="Total Products"
                value={stats?.totalProducts ?? 0}
                iconColor="#f59e0b"
                iconBg="#fef3c7"
              />
              <StatCard
                icon="trophy-outline"
                label="Total Challenges"
                value={stats?.totalChallenges ?? 0}
                iconColor="#ef4444"
                iconBg="#fee2e2"
              />
            </View>
          </ScrollView>
        )}
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: ms(40),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: ms(20),
    lineHeight: ms(28),
    color: colors.text.primary,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: ms(28),
    lineHeight: ms(34),
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
  },
});
