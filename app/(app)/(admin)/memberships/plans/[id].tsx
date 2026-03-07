import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../../src/components/layout/Header';
import { Button } from '../../../../../src/components/ui/Button';
import { SkeletonLoader } from '../../../../../src/components/ui/SkeletonLoader';
import { Badge } from '../../../../../src/components/ui/Badge';
import { RoleGuard } from '../../../../../src/components/guards/RoleGuard';
import { useMembershipStore } from '../../../../../src/stores/useMembershipStore';
import { useAuthStore } from '../../../../../src/stores/useAuthStore';
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
import type { Gym } from '../../../../../src/types/models';

export default function MembershipPlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { selectedPlan, plansLoading, fetchPlanById, deletePlan, clearSelectedPlan } =
    useMembershipStore();

  const isSuperadmin = user?.role === 'superadmin';

  useEffect(() => {
    if (id) {
      fetchPlanById(id);
    }
    return () => {
      clearSelectedPlan();
    };
  }, [id]);

  const handleEdit = () => {
    router.push({
      pathname: '/(app)/(admin)/memberships/plans/edit',
      params: { id },
    });
  };

  const handleDelete = () => {
    showAppAlert(
      'Delete Plan',
      'Are you sure you want to delete this membership plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan(id);
              showAppAlert('Success', 'Plan deleted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              showAppAlert('Error', err.message || 'Failed to delete plan');
            }
          },
        },
      ]
    );
  };

  const getDurationText = (days: number): string => {
    if (days === 30) return '1 Month';
    if (days === 90) return '3 Months';
    if (days === 180) return '6 Months';
    if (days === 365) return '1 Year';
    return `${days} Days`;
  };

  if (plansLoading || !selectedPlan) {
    return (
      <RoleGuard allowedRoles={['admin', 'superadmin']}>
        <SafeScreen>
          <Header title="Plan Details" showBack onBack={() => router.back()} />
          <View style={styles.skeletonContainer}>
            <SkeletonLoader width="100%" height={200} borderRadius={16} />
            <SkeletonLoader width="100%" height={150} borderRadius={16} />
            <SkeletonLoader width="100%" height={100} borderRadius={16} />
          </View>
        </SafeScreen>
      </RoleGuard>
    );
  }

  const gymName =
    typeof selectedPlan.gymId === 'object'
      ? (selectedPlan.gymId as Gym).name
      : 'Unknown Gym';

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Plan Details"
          showBack
          onBack={() => router.back()}
          rightAction={
            isSuperadmin ? (
              <TouchableOpacity
                onPress={handleEdit}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="create-outline"
                  size={24}
                  color={colors.text.primary}
                />
              </TouchableOpacity>
            ) : undefined
          }
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View style={[styles.card, shadows.card]}>
            <View style={styles.cardHeader}>
              <Text style={styles.planName}>{selectedPlan.name}</Text>
              <Badge
                text={selectedPlan.isActive ? 'Active' : 'Inactive'}
                variant={selectedPlan.isActive ? 'success' : 'error'}
              />
            </View>
            <Text style={styles.gymName}>{gymName}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatCurrency(selectedPlan.price)}</Text>
              <Text style={styles.duration}>
                {getDurationText(selectedPlan.durationDays)}
              </Text>
            </View>
          </View>

          {/* Description */}
          {selectedPlan.description && (
            <View style={[styles.card, shadows.card]}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.description}>{selectedPlan.description}</Text>
            </View>
          )}

          {/* Features */}
          {selectedPlan.features && selectedPlan.features.length > 0 && (
            <View style={[styles.card, shadows.card]}>
              <Text style={styles.cardTitle}>Features</Text>
              {selectedPlan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary.yellow}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Meta Info */}
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>
                {selectedPlan.durationDays} days
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {formatDate(selectedPlan.createdAt)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {formatDate(selectedPlan.updatedAt)}
              </Text>
            </View>
          </View>

          {/* Delete Button (superadmin only) */}
          {isSuperadmin && (
            <View style={styles.dangerZone}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color={colors.status.error} />
                <Text style={styles.deleteButtonText}>Delete Plan</Text>
              </TouchableOpacity>
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
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  planName: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  gymName: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  price: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.primary.yellow,
  },
  duration: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  cardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  featureText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
    flex: 1,
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
  dangerZone: {
    marginTop: spacing.xl,
  },
  dangerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.status.error,
    marginBottom: spacing.md,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.status.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  deleteButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.status.error,
  },
});
