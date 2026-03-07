import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../../src/components/layout/Header';
import { Button } from '../../../../../src/components/ui/Button';
import { SkeletonLoader } from '../../../../../src/components/ui/SkeletonLoader';
import { Badge } from '../../../../../src/components/ui/Badge';
import { Avatar } from '../../../../../src/components/ui/Avatar';
import { RoleGuard } from '../../../../../src/components/guards/RoleGuard';
import { useMembershipStore } from '../../../../../src/stores/useMembershipStore';
import { showAppAlert } from '../../../../../src/stores/useUIStore';
import { formatCurrency, formatDate } from '../../../../../src/utils/formatters';
import {
  colors,
  fontFamily,
  spacing,
  borderRadius,
  layout,
  shadows,
} from '../../../../../src/theme';
import type {
  User,
  MembershipPlan,
  Gym,
  MembershipStatus,
} from '../../../../../src/types/models';

export default function MembershipDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    selectedMembership,
    membershipsLoading,
    fetchMembershipById,
    cancelMembership,
    clearSelectedMembership,
  } = useMembershipStore();

  useEffect(() => {
    if (id) {
      fetchMembershipById(id);
    }
    return () => {
      clearSelectedMembership();
    };
  }, [id]);

  const handleCancel = () => {
    showAppAlert(
      'Cancel Membership',
      'Are you sure you want to cancel this membership? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMembership(id);
              showAppAlert('Success', 'Membership cancelled successfully');
            } catch (err: any) {
              showAppAlert('Error', err.message || 'Failed to cancel membership');
            }
          },
        },
      ]
    );
  };

  const getStatusVariant = (
    status: MembershipStatus
  ): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (membershipsLoading || !selectedMembership) {
    return (
      <RoleGuard allowedRoles={['admin', 'superadmin']}>
        <SafeScreen>
          <Header title="Membership Details" showBack onBack={() => router.back()} />
          <View style={styles.skeletonContainer}>
            <SkeletonLoader width="100%" height={180} borderRadius={16} />
            <SkeletonLoader width="100%" height={150} borderRadius={16} />
            <SkeletonLoader width="100%" height={120} borderRadius={16} />
          </View>
        </SafeScreen>
      </RoleGuard>
    );
  }

  const user =
    typeof selectedMembership.userId === 'object'
      ? (selectedMembership.userId as User)
      : null;
  const plan =
    typeof selectedMembership.planId === 'object'
      ? (selectedMembership.planId as MembershipPlan)
      : null;
  const gym =
    typeof selectedMembership.gymId === 'object'
      ? (selectedMembership.gymId as Gym)
      : null;

  const canCancel = selectedMembership.status === 'active';

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Membership Details" showBack onBack={() => router.back()} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <Badge
              text={selectedMembership.status.toUpperCase()}
              variant={getStatusVariant(selectedMembership.status)}
              size="md"
            />
          </View>

          {/* User Info */}
          {user && (
            <View style={[styles.card, shadows.card]}>
              <Text style={styles.cardTitle}>Member</Text>
              <View style={styles.userRow}>
                <Avatar uri={user.avatar} name={user.name} size={56} />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  {user.phone && (
                    <Text style={styles.userPhone}>{user.phone}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Plan Details */}
          {plan && (
            <View style={[styles.card, shadows.card]}>
              <Text style={styles.cardTitle}>Plan Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plan Name</Text>
                <Text style={styles.infoValue}>{plan.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Price</Text>
                <Text style={styles.infoValue}>{formatCurrency(plan.price)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{plan.durationDays} days</Text>
              </View>
              {gym && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Gym</Text>
                  <Text style={styles.infoValue}>{gym.name}</Text>
                </View>
              )}
            </View>
          )}

          {/* Membership Period */}
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Membership Period</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <Text style={styles.dateLabel}>Start Date</Text>
                <Text style={styles.dateValue}>
                  {formatDate(selectedMembership.startDate)}
                </Text>
              </View>
              <View style={styles.dateItem}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <Text style={styles.dateLabel}>End Date</Text>
                <Text style={styles.dateValue}>
                  {formatDate(selectedMembership.endDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Meta Info */}
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {formatDate(selectedMembership.createdAt)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {formatDate(selectedMembership.updatedAt)}
              </Text>
            </View>
          </View>

          {/* Cancel Button */}
          {canCancel && (
            <View style={styles.actionContainer}>
              <Button
                title="Cancel Membership"
                onPress={handleCancel}
                variant="outline"
                size="lg"
                fullWidth
                leftIcon={
                  <Ionicons name="close-circle-outline" size={20} color={colors.status.error} />
                }
              />
            </View>
          )}
        </ScrollView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  skeletonContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  userPhone: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  infoValue: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
  },
  dateValue: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  actionContainer: {
    marginTop: spacing.xl,
  },
});
