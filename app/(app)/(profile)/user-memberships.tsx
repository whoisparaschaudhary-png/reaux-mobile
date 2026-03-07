import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { useMembershipStore } from '../../../src/stores/useMembershipStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { showAppAlert } from '../../../src/stores/useUIStore';
import { formatCurrency, formatDate } from '../../../src/utils/formatters';
import { Badge } from '../../../src/components/ui/Badge';
import {
  colors,
  fontFamily,
  spacing,
  borderRadius,
  layout,
  shadows,
} from '../../../src/theme';
import type {
  MembershipPlan,
  Gym,
  MembershipStatus,
  Membership,
  User,
} from '../../../src/types/models';
import { TouchableOpacity } from 'react-native';

function UserMembershipsContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {
    memberships,
    membershipsLoading,
    membershipsPagination,
    fetchMemberships,
    cancelMembership,
    clearSelectedMembership,
  } = useMembershipStore();
  const [refreshing, setRefreshing] = useState(false);

  const isSuperadmin = user?.role === 'superadmin';
  const gymId = typeof user?.gymId === 'object' ? (user.gymId as Gym)?._id : user?.gymId;

  useEffect(() => {
    clearSelectedMembership();
    // Admin sees only their gym's memberships, superadmin sees all
    const filters = isSuperadmin ? {} : { gymId: gymId || undefined };
    fetchMemberships(1, filters);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const filters = isSuperadmin ? {} : { gymId: gymId || undefined };
    await fetchMemberships(1, filters);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (
      !membershipsLoading &&
      membershipsPagination.page < membershipsPagination.pages
    ) {
      const filters = isSuperadmin ? {} : { gymId: gymId || undefined };
      fetchMemberships(membershipsPagination.page + 1, filters);
    }
  };

  const handleCancelMembership = (membership: Membership) => {
    showAppAlert(
      'Cancel Membership',
      'Are you sure you want to cancel this membership?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMembership(membership._id);
              showAppAlert('Success', 'Membership cancelled successfully');
            } catch {
              showAppAlert('Error', 'Failed to cancel membership');
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

  const getDurationText = (days: number): string => {
    if (days === 30) return '1 Month';
    if (days === 90) return '3 Months';
    if (days === 180) return '6 Months';
    if (days === 365) return '1 Year';
    return `${days} Days`;
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <SkeletonLoader key={i} width="100%" height={220} borderRadius={16} />
      ))}
    </View>
  );

  const renderMembershipCard = (membership: Membership) => {
    const plan =
      typeof membership.planId === 'object'
        ? (membership.planId as MembershipPlan)
        : null;
    const gym =
      typeof membership.gymId === 'object' ? (membership.gymId as Gym) : null;
    const member =
      typeof membership.userId === 'object' ? (membership.userId as User) : null;

    // Check if membership is expiring soon (within 7 days)
    const isExpiringSoon = () => {
      if (membership.status !== 'active') return false;
      const endDate = new Date(membership.endDate);
      const today = new Date();
      const daysLeft = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 7 && daysLeft > 0;
    };

    return (
      <TouchableOpacity
        style={[styles.card, shadows.card]}
        activeOpacity={0.9}
        onPress={() => {}}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary.yellow} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.memberName}>{member?.name || 'Unknown User'}</Text>
              <Text style={styles.planName}>{plan?.name || 'Unknown Plan'}</Text>
            </View>
          </View>
          <Badge
            text={membership.status.toUpperCase()}
            variant={getStatusVariant(membership.status)}
            size="sm"
          />
        </View>

        {/* Member Email */}
        {member && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{member.email}</Text>
          </View>
        )}

        {/* Gym */}
        {gym && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{gym.name}</Text>
          </View>
        )}

        {/* Dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateColumn}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <Text style={styles.dateValue}>{formatDate(membership.startDate)}</Text>
          </View>
          <View style={styles.dateColumn}>
            <Text style={styles.dateLabel}>End Date</Text>
            <Text style={styles.dateValue}>{formatDate(membership.endDate)}</Text>
          </View>
        </View>

        {/* Expiring Soon Warning */}
        {isExpiringSoon() && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={16} color={colors.status.warning} />
            <Text style={styles.warningText}>Membership expiring soon!</Text>
          </View>
        )}

        {/* Price & Duration */}
        {plan && (
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Duration</Text>
              <Text style={styles.priceValue}>
                {getDurationText(plan.durationDays)}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Amount</Text>
              <Text style={styles.priceValue}>{formatCurrency(plan.price)}</Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        {membership.status === 'active' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelMembership(membership)}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.status.error} />
            <Text style={styles.cancelButtonText}>Cancel Membership</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeScreen>
      <Header title="User Memberships" showBack onBack={() => router.back()} />

      {membershipsLoading && memberships.length === 0 ? (
        renderSkeleton()
      ) : (
        <FlashList
          data={memberships}
          renderItem={({ item }) => renderMembershipCard(item)}
          estimatedItemSize={220}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.yellow}
              colors={[colors.primary.yellow]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              icon="card-outline"
              title="No Memberships"
              message={
                isSuperadmin
                  ? "No memberships found in the system."
                  : "No memberships found for your gym."
              }
            />
          }
        />
      )}
    </SafeScreen>
  );
}

export default function UserMembershipsScreen() {
  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']} fallbackRoute="/(app)/(profile)">
      <UserMembershipsContent />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  skeletonContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  cardHeaderText: {
    flex: 1,
  },
  memberName: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  planName: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  datesRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
    marginBottom: 2,
  },
  dateValue: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.light,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  warningText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.status.warning,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
    marginBottom: 2,
  },
  priceValue: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  cancelButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.status.error,
  },
});
