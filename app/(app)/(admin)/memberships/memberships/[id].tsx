import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
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
    recordFees,
    applyCredit,
    clearSelectedMembership,
  } = useMembershipStore();

  const [feeModalMode, setFeeModalMode] = useState<'payment' | 'advance' | 'apply' | null>(null);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeNote, setFeeNote] = useState('');
  const [feeSubmitting, setFeeSubmitting] = useState(false);

  const openFeeModal = (mode: 'payment' | 'advance' | 'apply') => {
    setFeeAmount('');
    setFeeNote('');
    setFeeModalMode(mode);
  };
  const closeFeeModal = () => { setFeeModalMode(null); setFeeAmount(''); setFeeNote(''); };

  useEffect(() => {
    if (id) {
      fetchMembershipById(id);
    }
    return () => {
      clearSelectedMembership();
    };
  }, [id]);

  const handleRecordFee = async () => {
    const abs = parseFloat(feeAmount);
    if (!feeAmount || isNaN(abs) || abs <= 0) {
      showAppAlert('Invalid Amount', 'Please enter a positive amount.');
      return;
    }
    // Guard: cannot use more advance credit than available
    if (feeModalMode === 'advance') {
      const available = selectedMembership?.advanceCredit ?? 0;
      if (abs > available) {
        showAppAlert(
          'Insufficient Credit',
          `Only ${formatCurrency(available)} available. Enter ₹${available} or less.`
        );
        return;
      }
    }
    setFeeSubmitting(true);
    try {
      if (feeModalMode === 'apply') {
        await applyCredit(id, abs);
      } else {
        // 'advance' = use advance credit → negative amount per API spec
        const amount = feeModalMode === 'advance' ? -abs : abs;
        await recordFees(id, { amount, note: feeNote.trim() || undefined });
      }
      closeFeeModal();
      const msg = feeModalMode === 'payment' ? 'Payment recorded.'
        : feeModalMode === 'apply' ? 'Credit applied to fees.'
        : 'Advance credit used.';
      showAppAlert('Success', msg);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to record fee.');
    } finally {
      setFeeSubmitting(false);
    }
  };

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

          {/* Fees */}
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>Fees</Text>
            <View style={styles.feeBtnsRow}>
              <TouchableOpacity style={styles.feeBtn} onPress={() => openFeeModal('payment')}>
                <Ionicons name="cash-outline" size={14} color={colors.background.white} />
                <Text style={styles.feeBtnText}>Record Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.feeBtn,
                  styles.feeBtnAdvance,
                  (selectedMembership.advanceCredit ?? 0) <= 0 && styles.feeBtnDisabled,
                ]}
                onPress={() => openFeeModal('advance')}
                disabled={(selectedMembership.advanceCredit ?? 0) <= 0}
              >
                <Ionicons name="wallet-outline" size={14} color={colors.background.white} />
                <Text style={styles.feeBtnText}>Use Advance</Text>
              </TouchableOpacity>
            </View>
            {(selectedMembership.feesDue ?? 0) > 0 && (selectedMembership.advanceCredit ?? 0) > 0 && (
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  const suggested = Math.min(
                    selectedMembership.feesDue ?? 0,
                    selectedMembership.advanceCredit ?? 0
                  );
                  setFeeAmount(String(suggested));
                  setFeeNote('Applied advance credit to fees');
                  setFeeModalMode('apply');
                }}
              >
                <Ionicons name="swap-horizontal-outline" size={14} color={colors.status.info} />
                <Text style={styles.applyBtnText}>
                  Apply {formatCurrency(Math.min(selectedMembership.feesDue ?? 0, selectedMembership.advanceCredit ?? 0))} credit to fees
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Fee</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(selectedMembership.feesAmount ?? 0)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fees Paid</Text>
              <Text style={[styles.infoValue, { color: colors.status.success }]}>
                {formatCurrency(selectedMembership.feesPaid ?? 0)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fees Pending</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      (selectedMembership.feesDue ?? 0) > 0
                        ? colors.status.error
                        : colors.text.primary,
                  },
                ]}
              >
                {formatCurrency(selectedMembership.feesDue ?? 0)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Advance Credit</Text>
              <Text style={[styles.infoValue, { color: colors.status.info }]}>
                {formatCurrency(selectedMembership.advanceCredit ?? 0)}
              </Text>
            </View>
            {selectedMembership.lastPaymentDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Payment</Text>
                <Text style={styles.infoValue}>
                  {formatDate(selectedMembership.lastPaymentDate)}
                </Text>
              </View>
            )}
            {(selectedMembership.paymentHistory?.length ?? 0) > 0 && (
              <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>Payment History</Text>
                {selectedMembership.paymentHistory?.map((p, i) => (
                  <View key={i} style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <Ionicons
                        name={p.amount >= 0 ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                        size={16}
                        color={p.amount >= 0 ? colors.status.success : colors.status.warning}
                      />
                      <View>
                        <Text style={styles.historyAmount}>
                          {p.amount >= 0 ? '+' : ''}{formatCurrency(p.amount)}
                        </Text>
                        {p.note ? (
                          <Text style={styles.historyNote}>{p.note}</Text>
                        ) : null}
                      </View>
                    </View>
                    <Text style={styles.historyDate}>{formatDate(p.paidAt)}</Text>
                  </View>
                ))}
              </View>
            )}
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
        {/* Record Fee Modal */}
        <Modal
          visible={feeModalMode !== null}
          transparent
          animationType="slide"
          onRequestClose={closeFeeModal}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>
                {feeModalMode === 'payment'
                  ? 'Record Payment'
                  : feeModalMode === 'apply'
                  ? 'Apply Credit to Fees'
                  : 'Use Advance Credit'}
              </Text>
              <Text style={styles.modalHint}>
                {feeModalMode === 'payment'
                  ? 'Enter the payment amount received from the member. feesPaid will increase.'
                  : feeModalMode === 'apply'
                  ? `Applies advance credit toward pending fees. feesPaid ↑, advanceCredit ↓. Available: ${formatCurrency(selectedMembership?.advanceCredit ?? 0)}.`
                  : `Available: ${formatCurrency(selectedMembership?.advanceCredit ?? 0)}. Entered amount will be deducted from both feesPaid and advanceCredit.`}
              </Text>

              <Text style={styles.inputLabel}>Amount (₹)*</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 500"
                placeholderTextColor={colors.text.light}
                keyboardType="numeric"
                value={feeAmount}
                onChangeText={setFeeAmount}
              />

              <Text style={styles.inputLabel}>Note (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMulti]}
                placeholder="e.g. Monthly payment, Used advance..."
                placeholderTextColor={colors.text.light}
                value={feeNote}
                onChangeText={setFeeNote}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={closeFeeModal}
                  disabled={feeSubmitting}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                  onPress={handleRecordFee}
                  disabled={feeSubmitting}
                >
                  {feeSubmitting ? (
                    <ActivityIndicator size="small" color={colors.text.onPrimary} />
                  ) : (
                    <Text style={styles.modalBtnConfirmText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  feeBtnsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  feeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.status.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  feeBtnAdvance: {
    backgroundColor: colors.status.warning,
  },
  feeBtnDisabled: {
    opacity: 0.4,
  },
  feeBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.background.white,
  },
  historyContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  historyTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
  },
  historyAmount: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
  historyNote: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.secondary,
  },
  historyDate: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.light,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: colors.background.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    paddingBottom: 36,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalHint: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.gray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  textInputMulti: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    borderWidth: 1,
    borderColor: colors.border.gray,
  },
  modalBtnCancelText: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.text.primary,
  },
  modalBtnConfirm: {
    backgroundColor: colors.primary.yellow,
  },
  modalBtnConfirmText: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.text.onPrimary,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.status.info,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  applyBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.status.info,
  },
});
