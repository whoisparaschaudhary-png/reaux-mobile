import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Avatar } from '../../../../src/components/ui/Avatar';
import { Badge } from '../../../../src/components/ui/Badge';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { usersApi } from '../../../../src/api/endpoints/users';
import { gymsApi } from '../../../../src/api/endpoints/gyms';
import { membershipsApi } from '../../../../src/api/endpoints/memberships';
import { useMembershipStore } from '../../../../src/stores/useMembershipStore';
import { useAuthStore } from '../../../../src/stores/useAuthStore';
import { useUIStore, showAppAlert } from '../../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius, typography } from '../../../../src/theme';
import { ms, mvs } from '../../../../src/utils/responsive';
import { formatCurrency } from '../../../../src/utils/formatters';
import type { User, Role, Gym, Membership, MembershipPlan } from '../../../../src/types/models';

const ROLES: { value: Role; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
];

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

export default function UserDetailScreen() {
  const { id, backRoute } = useLocalSearchParams<{ id: string; backRoute?: string }>();
  const router = useRouter();
  const handleBack = () => backRoute === 'feed' ? router.navigate('/(app)/(feed)') : router.back();
  const showToast = useUIStore((s) => s.showToast);
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [membership, setMembership] = useState<Membership | null>(null);

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('user');
  const [selectedGymIds, setSelectedGymIds] = useState<string[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoadingGyms, setIsLoadingGyms] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeNote, setFeeNote] = useState('');
  const [feeExtendDays, setFeeExtendDays] = useState('');
  const [feeExtend, setFeeExtend] = useState(false);
  const [feeSubmitting, setFeeSubmitting] = useState(false);
  const { recordFees } = useMembershipStore();

  const handleRecordFee = async () => {
    const amount = parseFloat(feeAmount);
    if (!feeAmount || isNaN(amount) || amount <= 0) {
      showAppAlert('Invalid Amount', 'Please enter a positive amount.');
      return;
    }
    if (!membership) return;
    setFeeSubmitting(true);
    try {
      const extendDays = feeExtend && feeExtendDays ? parseInt(feeExtendDays, 10) : undefined;
      await recordFees(membership._id, { amount, note: feeNote.trim() || undefined, extendDays });
      setShowFeeModal(false);
      setFeeAmount('');
      setFeeNote('');
      setFeeExtendDays('');
      setFeeExtend(false);
      // Refresh membership data
      const res = await membershipsApi.list({ userId: id, limit: 1 });
      if (res.data?.length) setMembership(res.data[0]);
      showAppAlert('Success', extendDays ? `Payment recorded. Membership extended by ${extendDays} days.` : 'Payment recorded successfully.');
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to record payment.');
    } finally {
      setFeeSubmitting(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [userRes, membershipRes] = await Promise.all([
          usersApi.getUserById(id),
          membershipsApi.list({ userId: id, limit: 1 }).catch(() => null),
        ]);
        const u = userRes.data;
        setUser(u);
        setEditName(u.name);
        setEditPhone(u.phone ?? '');
        setSelectedRole(u.role);
        // Initialize gymIds from gymIds array (multi-gym) or fall back to gymId
        const ids: string[] = u.gymIds?.map((g) =>
          typeof g === 'string' ? g : (g as Gym)._id
        ) ?? (u.gymId ? [typeof u.gymId === 'string' ? u.gymId : u.gymId._id] : []);
        setSelectedGymIds(ids);
        if (membershipRes?.data?.length) {
          setMembership(membershipRes.data[0]);
        }
      } catch {
        showToast('Failed to load user', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch gyms for superadmin gym picker
  useEffect(() => {
    if (!isSuperAdmin) return;
    const fetchGyms = async () => {
      setIsLoadingGyms(true);
      try {
        const res = await gymsApi.list({ page: 1, limit: 100 });
        setGyms(res.data ?? []);
      } catch {
        // ignore
      } finally {
        setIsLoadingGyms(false);
      }
    };
    fetchGyms();
  }, [isSuperAdmin]);

  const mappedGymIds: string[] = (user?.gymIds ?? []).map((g) =>
    typeof g === 'string' ? g : (g as Gym)._id,
  );
  const originalGymIds: string[] =
    mappedGymIds.length > 0
      ? mappedGymIds
      : user?.gymId
        ? [typeof user.gymId === 'string' ? user.gymId : (user.gymId as Gym)._id]
        : [];

  const hasChanges =
    user &&
    (editName.trim() !== user.name ||
      editPhone.trim() !== (user.phone ?? '') ||
      selectedRole !== user.role ||
      JSON.stringify([...selectedGymIds].sort()) !== JSON.stringify([...originalGymIds].sort()));

  const handleSave = async () => {
    if (!user || !id) return;
    setIsSaving(true);
    try {
      const payload: Record<string, any> = {};
      if (editName.trim() !== user.name) payload.name = editName.trim();
      if (editPhone.trim() !== (user.phone ?? '')) payload.phone = editPhone.trim();
      if (selectedRole !== user.role) payload.role = selectedRole;
      if (JSON.stringify([...selectedGymIds].sort()) !== JSON.stringify([...originalGymIds].sort())) {
        payload.gymIds = selectedGymIds;
      }
      const res = await usersApi.updateUser(id, payload);
      setUser(res.data);
      showToast('User updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update user', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = () => {
    if (!user || !id) return;
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    const action = newStatus === 'disabled' ? 'Deactivate' : 'Activate';
    showAppAlert(
      `${action} User`,
      `Are you sure you want to ${action.toLowerCase()} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: newStatus === 'disabled' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const res = await usersApi.updateUserStatus(id, newStatus);
              setUser(res.data);
              showToast(`User ${action.toLowerCase()}d successfully`, 'success');
            } catch (error: any) {
              showToast(error.message || `Failed to ${action.toLowerCase()} user`, 'error');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['admin', 'superadmin']}>
        <SafeScreen>
          <Header title="User Details" showBack onBack={handleBack} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
          </View>
        </SafeScreen>
      </RoleGuard>
    );
  }

  if (!user) {
    return (
      <RoleGuard allowedRoles={['admin', 'superadmin']}>
        <SafeScreen>
          <Header title="User Details" showBack onBack={handleBack} />
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>User not found</Text>
          </View>
        </SafeScreen>
      </RoleGuard>
    );
  }

  const isActive = user.status === 'active';

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="User Details" showBack onBack={handleBack} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Header */}
          <View style={styles.profileSection}>
            <Avatar uri={user.avatar} name={user.name} size={80} />
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.badgeRow}>
              <Badge
                text={user.role}
                variant={getRoleBadgeVariant(user.role)}
                size="md"
              />
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isActive ? '#dcfce7' : '#fee2e2' },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isActive ? colors.status.success : colors.status.error },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: isActive ? colors.status.success : colors.status.error },
                  ]}
                >
                  {isActive ? 'Active' : 'Disabled'}
                </Text>
              </View>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Email" value={user.email} />
              <View style={styles.infoDivider} />
              <InfoRow label="Gender" value={user.gender || 'Not set'} />
              <View style={styles.infoDivider} />
              <InfoRow
                label="Date of Birth"
                value={
                  user.dateOfBirth
                    ? new Date(user.dateOfBirth).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Not set'
                }
              />
            </View>
            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Full name"
              placeholderTextColor={colors.text.light}
            />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.textInput}
              value={editPhone}
              onChangeText={(v) => setEditPhone(v.replace(/[^0-9+\-\s]/g, ''))}
              placeholder="Phone number"
              placeholderTextColor={colors.text.light}
              keyboardType="phone-pad"
            />
          </View>

          {/* Membership & Fees */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membership & Fees</Text>
            {membership ? (() => {
              const plan = membership.planId && typeof membership.planId !== 'string'
                ? membership.planId as MembershipPlan
                : null;
              const totalFee = membership.feesAmount ?? plan?.price ?? 0;
              const paid = membership.feesPaid ?? 0;
              const due = membership.feesDue ?? Math.max(0, totalFee - paid);
              const credit = membership.advanceCredit ?? 0;
              const statusColor =
                membership.status === 'active' ? colors.status.success :
                membership.status === 'expired' ? colors.status.warning :
                colors.status.error;
              return (
                <View style={styles.infoCard}>
                  {plan && (
                    <>
                      <InfoRow label="Plan" value={plan.name} />
                      <View style={styles.infoDivider} />
                    </>
                  )}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <View style={[styles.membershipStatusBadge, { backgroundColor: statusColor + '22' }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.membershipStatusText, { color: statusColor }]}>
                        {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoDivider} />
                  <InfoRow
                    label="Start Date"
                    value={new Date(membership.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  />
                  <View style={styles.infoDivider} />
                  <InfoRow
                    label="End Date"
                    value={new Date(membership.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  />
                  <View style={styles.infoDivider} />
                  <InfoRow label="Total Fee" value={formatCurrency(totalFee)} />
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fees Paid</Text>
                    <Text style={[styles.infoValue, { color: colors.status.success }]}>
                      {formatCurrency(paid)}
                    </Text>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fees Pending</Text>
                    <Text style={[styles.infoValue, { color: due > 0 ? colors.status.error : colors.text.primary }]}>
                      {formatCurrency(due)}
                    </Text>
                  </View>
                  {credit > 0 && (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Advance Credit</Text>
                        <Text style={[styles.infoValue, { color: colors.status.info }]}>
                          {formatCurrency(credit)}
                        </Text>
                      </View>
                    </>
                  )}
                  {membership.lastPaymentDate && (
                    <>
                      <View style={styles.infoDivider} />
                      <InfoRow
                        label="Last Payment"
                        value={new Date(membership.lastPaymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      />
                    </>
                  )}
                  <View style={styles.membershipActions}>
                    <TouchableOpacity
                      style={styles.recordPaymentBtn}
                      onPress={() => {
                        const plan = membership.planId && typeof membership.planId !== 'string' ? membership.planId as MembershipPlan : null;
                        const due = membership.feesDue ?? Math.max(0, (membership.feesAmount ?? plan?.price ?? 0) - (membership.feesPaid ?? 0));
                        setFeeAmount(due > 0 ? String(due) : '');
                        setFeeNote('');
                        setShowFeeModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="cash-outline" size={15} color={colors.background.white} />
                      <Text style={styles.recordPaymentBtnText}>Record Payment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.viewHistoryBtn}
                      onPress={() => router.push(`/(app)/(admin)/memberships/records/${membership._id}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="time-outline" size={15} color={colors.status.info} />
                      <Text style={styles.viewHistoryBtnText}>Payment History</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })() : (
              <View style={styles.noMembershipCard}>
                <Ionicons name="card-outline" size={32} color={colors.text.light} />
                <Text style={styles.noMembershipText}>No active membership</Text>
                <TouchableOpacity
                  style={styles.assignMembershipBtn}
                  onPress={() => router.push(
                    `/(app)/(admin)/memberships/records/assign?preselectedUserId=${id}&preselectedUserName=${encodeURIComponent(user?.name ?? '')}` as any
                  )}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={16} color={colors.primary.yellowDark} />
                  <Text style={styles.assignMembershipBtnText}>Assign Membership</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Gym Assignment - Superadmin only */}
          {isSuperAdmin && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gym Assignment</Text>
              <Text style={styles.sectionDescription}>
                Select one or more gyms for this user (admins manage all assigned gyms)
              </Text>

              {isLoadingGyms ? (
                <View style={styles.gymLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary.yellow} />
                  <Text style={styles.gymLoadingText}>Loading gyms...</Text>
                </View>
              ) : (
                <View style={styles.gymList}>
                  {gyms.map((gym) => {
                    const isChecked = selectedGymIds.includes(gym._id);
                    return (
                      <TouchableOpacity
                        key={gym._id}
                        style={[styles.gymItem, isChecked && styles.gymItemActive]}
                        onPress={() => {
                          setSelectedGymIds((prev) =>
                            isChecked ? prev.filter((gid) => gid !== gym._id) : [...prev, gym._id]
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.gymItemName, isChecked && styles.gymItemNameActive]}>
                            {gym.name}
                          </Text>
                          {gym.address?.city && (
                            <Text style={styles.gymItemCity}>{gym.address.city}</Text>
                          )}
                        </View>
                        <View style={[styles.gymCheckbox, isChecked && styles.gymCheckboxActive]}>
                          {isChecked && <Ionicons name="checkmark" size={14} color={colors.text.onPrimary} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {gyms.length === 0 && (
                    <View style={styles.gymLoadingContainer}>
                      <Text style={styles.gymLoadingText}>No gyms found</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Role - Superadmin only */}
          {isSuperAdmin && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Role</Text>
              <Text style={styles.sectionDescription}>
                Change the user's role
              </Text>
              <View style={styles.roleGrid}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleCard,
                      selectedRole === role.value && styles.roleCardActive,
                    ]}
                    onPress={() => setSelectedRole(role.value)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.roleRadio,
                        selectedRole === role.value && styles.roleRadioActive,
                      ]}
                    >
                      {selectedRole === role.value && (
                        <View style={styles.roleRadioInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.roleLabel,
                        selectedRole === role.value && styles.roleLabelActive,
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Save Button */}
          {hasChanges && (
            <View style={styles.saveContainer}>
              <Button
                title="Save Changes"
                onPress={handleSave}
                variant="primary"
                size="lg"
                fullWidth
                loading={isSaving}
                disabled={isSaving}
              />
            </View>
          )}

          {/* Status Toggle */}
          <View style={styles.statusSection}>
            <Button
              title={isActive ? 'Deactivate User' : 'Activate User'}
              onPress={handleToggleStatus}
              variant="outline"
              size="lg"
              fullWidth
            />
          </View>
        </ScrollView>

        {/* Record Payment Modal */}
        <Modal visible={showFeeModal} transparent animationType="slide" onRequestClose={() => setShowFeeModal(false)}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <Text style={styles.modalHint}>
                {user?.name} — record a fee payment
              </Text>
              <Text style={styles.inputLabel}>Amount (₹) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 1500"
                placeholderTextColor={colors.text.light}
                keyboardType="numeric"
                value={feeAmount}
                onChangeText={(v) => setFeeAmount(v.replace(/[^0-9.]/g, ''))}
              />
              <Text style={styles.inputLabel}>Note (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMulti]}
                placeholder="e.g. Monthly payment, Cash"
                placeholderTextColor={colors.text.light}
                value={feeNote}
                onChangeText={setFeeNote}
                multiline
                numberOfLines={2}
              />
              {/* Extend membership toggle */}
              <TouchableOpacity
                style={styles.extendToggleRow}
                onPress={() => setFeeExtend((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.toggleTrack, feeExtend && styles.toggleTrackActive]}>
                  <View style={[styles.toggleThumb, feeExtend && styles.toggleThumbActive]} />
                </View>
                <Text style={styles.extendToggleLabel}>Extend membership end date</Text>
              </TouchableOpacity>
              {feeExtend && (
                <>
                  <Text style={styles.inputLabel}>Extend by (days)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 30"
                    placeholderTextColor={colors.text.light}
                    keyboardType="numeric"
                    value={feeExtendDays}
                    onChangeText={(v) => setFeeExtendDays(v.replace(/[^0-9]/g, ''))}
                  />
                </>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowFeeModal(false)} disabled={feeSubmitting}>
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={handleRecordFee} disabled={feeSubmitting}>
                  {feeSubmitting ? <ActivityIndicator size="small" color={colors.text.onPrimary} /> : <Text style={styles.modalBtnConfirmText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeScreen>
    </RoleGuard>
  );
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(16),
    color: colors.text.secondary,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  userName: {
    fontFamily: fontFamily.bold,
    fontSize: ms(22),
    lineHeight: ms(28),
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(18),
    lineHeight: ms(24),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    color: colors.text.secondary,
  },
  infoValue: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    color: colors.text.primary,
    maxWidth: '60%',
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.border.light,
  },
  roleGrid: {
    gap: spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardActive: {
    borderColor: colors.primary.yellow,
    backgroundColor: colors.background.light,
  },
  roleRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  roleRadioActive: {
    borderColor: colors.primary.yellow,
  },
  roleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.yellow,
  },
  roleLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
  roleLabelActive: {
    fontFamily: fontFamily.bold,
  },
  gymLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  gymLoadingText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    color: colors.text.secondary,
  },
  gymSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gymList: {
    marginTop: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
  },
  gymItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  gymItemActive: {
    backgroundColor: colors.background.light,
  },
  gymItemName: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    color: colors.text.primary,
  },
  gymItemNameActive: {
    fontFamily: fontFamily.bold,
  },
  gymItemCity: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    color: colors.text.secondary,
    marginTop: 2,
  },
  gymCheckbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymCheckboxActive: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
  extendToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  extendToggleLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    color: colors.text.primary,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border.gray,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: colors.primary.yellow,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  saveContainer: {
    marginBottom: spacing.lg,
  },
  statusSection: {
    marginBottom: spacing.xxl,
  },
  membershipStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  membershipStatusText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
  },
  noMembershipCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  noMembershipText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    color: colors.text.light,
    marginTop: spacing.sm,
  },
  assignMembershipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.primary.yellowDark,
    backgroundColor: colors.primary.yellowLight,
  },
  assignMembershipBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    color: colors.primary.yellowDark,
  },
  membershipActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  recordPaymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.status.success,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  recordPaymentBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    color: colors.background.white,
  },
  viewHistoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.status.info,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  viewHistoryBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    color: colors.status.info,
  },
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
    fontSize: ms(18),
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalHint: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
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
    fontSize: ms(15),
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  textInputMulti: {
    height: 70,
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
    fontSize: ms(15),
    color: colors.text.primary,
  },
  modalBtnConfirm: {
    backgroundColor: colors.primary.yellow,
  },
  modalBtnConfirmText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    color: colors.text.onPrimary,
  },
});
