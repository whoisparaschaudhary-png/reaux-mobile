import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Avatar } from '../../../src/components/ui/Avatar';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Input } from '../../../src/components/ui/Input';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { useMembershipStore } from '../../../src/stores/useMembershipStore';
import { formatCurrency, formatDate } from '../../../src/utils/formatters';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../../src/theme';
import type { Membership, User, MembershipPlan } from '../../../src/types/models';

function getUserName(membership: Membership): string {
  if (typeof membership.userId === 'object' && membership.userId !== null) {
    return (membership.userId as User).name ?? 'Unknown';
  }
  return 'Unknown';
}

function getUserAvatar(membership: Membership): string | undefined {
  if (typeof membership.userId === 'object' && membership.userId !== null) {
    return (membership.userId as User).avatar;
  }
  return undefined;
}

function getPlanName(membership: Membership): string {
  if (typeof membership.planId === 'object' && membership.planId !== null) {
    return (membership.planId as MembershipPlan).name ?? 'Unknown Plan';
  }
  return 'Unknown Plan';
}

function getPlanPrice(membership: Membership): number {
  if (typeof membership.planId === 'object' && membership.planId !== null) {
    return (membership.planId as MembershipPlan).price ?? 0;
  }
  return 0;
}

type FeeTab = 'all' | 'pending' | 'paid' | 'credit' | 'upcoming';
type SortOption = 'default' | 'endDate' | 'feesDue';

const FEE_TABS: { key: FeeTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'credit', label: 'Credit' },
  { key: 'upcoming', label: 'Upcoming' },
];

export default function FeesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; backRoute?: string }>();
  const {
    memberships,
    membershipsLoading,
    fetchMemberships,
    recordFees,
  } = useMembershipStore();

  const initialTab = (params.tab as FeeTab) || 'all';
  const [activeTab, setActiveTab] = useState<FeeTab>(initialTab);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{
    membership: Membership;
    amount: string;
    note: string;
  } | null>(null);
  const [creditModal, setCreditModal] = useState<{
    membership: Membership;
    amount: string;
    note: string;
  } | null>(null);
  const [recording, setRecording] = useState(false);

  const fetchWithSort = useCallback((sort: SortOption) => {
    const sortParams: Record<string, string> = { status: 'active' };
    if (sort === 'endDate') { sortParams.sortBy = 'endDate'; sortParams.order = 'asc'; }
    else if (sort === 'feesDue') { sortParams.sortBy = 'feesDue'; sortParams.order = 'desc'; }
    fetchMemberships(1, sortParams as any);
  }, [fetchMemberships]);

  useFocusEffect(
    useCallback(() => {
      fetchWithSort(sortBy);
    }, [fetchWithSort, sortBy])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWithSort(sortBy);
    setRefreshing(false);
  }, [fetchWithSort, sortBy]);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    fetchWithSort(newSort);
  }, [fetchWithSort]);

  const { duePending, fullyPaid, withCredit, upcoming, totalDue, totalCollected, totalCredit } = useMemo(() => {
    const filtered = memberships.filter((m) => {
      const name = getUserName(m);
      return name.toLowerCase().includes(search.toLowerCase());
    });

    const due: Membership[] = [];
    const paid: Membership[] = [];
    const credited: Membership[] = [];
    const upcomingList: Membership[] = [];
    let dueSum = 0;
    let collectedSum = 0;
    let creditSum = 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    filtered.forEach((m) => {
      const totalFee = m.feesAmount ?? getPlanPrice(m);
      const paidAmount = m.feesPaid ?? 0;
      const feesDue = m.feesDue ?? (totalFee - paidAmount);

      // Credit = amount overpaid (from backend field or computed)
      const credit = m.advanceCredit ?? (paidAmount > totalFee && feesDue <= 0 ? paidAmount - totalFee : 0);

      collectedSum += paidAmount;

      if (feesDue > 0) {
        due.push(m);
        dueSum += feesDue;
      } else {
        paid.push(m);
      }

      if (credit > 0) {
        credited.push(m);
        creditSum += credit;
      }

      // Upcoming = membership ending within 30 days
      const endDate = new Date(m.endDate);
      if (endDate >= now && endDate <= thirtyDaysFromNow) {
        upcomingList.push(m);
      }
    });

    return { duePending: due, fullyPaid: paid, withCredit: credited, upcoming: upcomingList, totalDue: dueSum, totalCollected: collectedSum, totalCredit: creditSum };
  }, [memberships, search]);

  const handleRecordPayment = useCallback((membership: Membership) => {
    const totalFee = membership.feesAmount ?? getPlanPrice(membership);
    const feesDue = membership.feesDue ?? (totalFee - (membership.feesPaid ?? 0));
    setPaymentModal({
      membership,
      amount: feesDue > 0 ? String(feesDue) : '',
      note: '',
    });
  }, []);

  const handleSubmitPayment = useCallback(async () => {
    if (!paymentModal) return;
    const amount = parseFloat(paymentModal.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    setRecording(true);
    try {
      await recordFees(paymentModal.membership._id, {
        amount,
        note: paymentModal.note || undefined,
      });
      setPaymentModal(null);
      await fetchMemberships(1, { status: 'active' });
    } catch {
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setRecording(false);
    }
  }, [paymentModal, recordFees, fetchMemberships]);

  const handleEditCredit = useCallback((membership: Membership) => {
    const totalFee = membership.feesAmount ?? getPlanPrice(membership);
    const paidAmount = membership.feesPaid ?? 0;
    const due = membership.feesDue ?? (totalFee - paidAmount);
    const currentCredit = membership.advanceCredit ?? (paidAmount > totalFee && due <= 0 ? paidAmount - totalFee : 0);
    setCreditModal({
      membership,
      amount: '',
      note: '',
    });
  }, []);

  const handleSubmitCredit = useCallback(async () => {
    if (!creditModal) return;
    const creditAmount = parseFloat(creditModal.amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a positive amount to add as credit.');
      return;
    }

    setRecording(true);
    try {
      // Backend is additive — recording a payment that exceeds feesAmount stores surplus as advanceCredit
      await recordFees(creditModal.membership._id, {
        amount: creditAmount,
        note: creditModal.note || `Advance credit added: ${formatCurrency(creditAmount)}`,
      });
      setCreditModal(null);
      await fetchMemberships(1, { status: 'active' });
    } catch {
      Alert.alert('Error', 'Failed to update credit. Please try again.');
    } finally {
      setRecording(false);
    }
  }, [creditModal, recordFees, fetchMemberships]);

  const renderMembershipRow = useCallback(
    (membership: Membership, showRecordButton: boolean, showCreditInfo = false) => {
      const name = getUserName(membership);
      const avatar = getUserAvatar(membership);
      const planName = getPlanName(membership);
      const totalFee = membership.feesAmount ?? getPlanPrice(membership);
      const paidAmount = membership.feesPaid ?? 0;
      const due = membership.feesDue ?? (totalFee - paidAmount);
      const credit = membership.advanceCredit ?? (paidAmount > totalFee && due <= 0 ? paidAmount - totalFee : 0);

      return (
        <TouchableOpacity
          key={membership._id}
          style={styles.feeRow}
          onPress={() => router.push(`/(app)/(admin)/memberships/memberships/${membership._id}`)}
          activeOpacity={0.7}
        >
          <Avatar name={name} uri={avatar} size={40} />
          <View style={styles.feeInfo}>
            <Text style={styles.feeName} numberOfLines={1}>{name}</Text>
            <Text style={styles.feePlan} numberOfLines={1}>{planName}</Text>
            <View style={styles.feeAmounts}>
              <Text style={styles.feeAmountLabel}>
                Total: {formatCurrency(totalFee)}
              </Text>
              {showCreditInfo ? (
                <Text style={[styles.feeAmountLabel, { color: colors.status.info }]}>
                  Credit: {formatCurrency(credit)}
                </Text>
              ) : showRecordButton ? (
                <Text style={[styles.feeAmountLabel, { color: colors.status.error }]}>
                  Due: {formatCurrency(due)}
                </Text>
              ) : (
                <Text style={[styles.feeAmountLabel, { color: colors.status.success }]}>
                  Paid: {formatCurrency(paidAmount)}
                </Text>
              )}
            </View>
            {credit > 0 && !showCreditInfo && (
              <Text style={[styles.feeAmountLabel, { color: colors.status.info, marginTop: 2 }]}>
                Credit: {formatCurrency(credit)}
              </Text>
            )}
            {membership.lastPaymentDate && (
              <Text style={styles.feeDate}>
                Last payment: {formatDate(membership.lastPaymentDate)}
              </Text>
            )}
          </View>
          {showRecordButton && (
            <Button
              title="Record"
              onPress={() => handleRecordPayment(membership)}
              variant="primary"
              size="sm"
            />
          )}
          {showCreditInfo && (
            <Button
              title="Add"
              onPress={() => handleEditCredit(membership)}
              variant="outline"
              size="sm"
            />
          )}
          {!showRecordButton && !showCreditInfo && due <= 0 && (
            <TouchableOpacity
              onPress={() => handleEditCredit(membership)}
              style={styles.addCreditBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="wallet-outline" size={16} color={colors.status.info} />
              <Text style={styles.addCreditText}>Add Credit</Text>
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.text.light} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      );
    },
    [handleRecordPayment, handleEditCredit],
  );

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Fees"
          showBack
          onBack={() => params.backRoute === 'feed' ? router.navigate('/(app)/(feed)') : router.back()}
        />

        {membershipsLoading && memberships.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
          </View>
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary.yellow}
              />
            }
          >
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.status.warning} />
                <Text style={styles.summaryLabel}>Total Due</Text>
                <Text style={[styles.summaryValue, { color: colors.status.error }]}>
                  {formatCurrency(totalDue)}
                </Text>
                <Text style={styles.summaryCount}>{duePending.length} members</Text>
              </Card>
              <Card style={styles.summaryCard}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.status.success} />
                <Text style={styles.summaryLabel}>Collected</Text>
                <Text style={[styles.summaryValue, { color: colors.status.success }]}>
                  {formatCurrency(totalCollected)}
                </Text>
                <Text style={styles.summaryCount}>{fullyPaid.length} cleared</Text>
              </Card>
            </View>
            {totalCredit > 0 && (
              <TouchableOpacity
                style={styles.creditBanner}
                activeOpacity={0.7}
                onPress={() => setActiveTab('credit')}
              >
                <Ionicons name="wallet-outline" size={22} color={colors.status.info} />
                <View style={styles.creditBannerInfo}>
                  <Text style={styles.creditBannerTitle}>Member Credit</Text>
                  <Text style={styles.creditBannerSubtitle}>
                    {withCredit.length} {withCredit.length === 1 ? 'member has' : 'members have'} extra amount paid
                  </Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.status.info, fontSize: 18 }]}>
                  {formatCurrency(totalCredit)}
                </Text>
              </TouchableOpacity>
            )}

            {/* Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
            >
              {FEE_TABS.map((tab) => {
                const isActive = tab.key === activeTab;
                const count = tab.key === 'pending' ? duePending.length
                  : tab.key === 'paid' ? fullyPaid.length
                  : tab.key === 'credit' ? withCredit.length
                  : tab.key === 'upcoming' ? upcoming.length
                  : memberships.length;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.filterTab, isActive && styles.filterTabActive]}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                      {tab.label} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Sort + Search row */}
            <View style={styles.sortSearchRow}>
              <View style={styles.searchFlex}>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search members..."
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortChips}>
                {([
                  { key: 'default', label: 'Default' },
                  { key: 'endDate', label: 'Renewal' },
                  { key: 'feesDue', label: 'Dues ↓' },
                ] as { key: SortOption; label: string }[]).map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.sortChip, sortBy === s.key && styles.sortChipActive]}
                    onPress={() => handleSortChange(s.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sortChipText, sortBy === s.key && styles.sortChipTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tab Content */}
            {(activeTab === 'all' || activeTab === 'pending') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {activeTab === 'pending' ? 'Pending Fees' : 'Fees Due'}
                </Text>
                {duePending.length > 0 ? (
                  duePending.map((m) => renderMembershipRow(m, true))
                ) : (
                  <Text style={styles.emptyText}>No pending fees</Text>
                )}
              </View>
            )}

            {(activeTab === 'all' || activeTab === 'paid') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {activeTab === 'paid' ? 'Fees Paid' : 'Fully Paid'}
                </Text>
                {fullyPaid.length > 0 ? (
                  fullyPaid.map((m) => renderMembershipRow(m, false))
                ) : (
                  <Text style={styles.emptyText}>No fully paid memberships</Text>
                )}
              </View>
            )}

            {(activeTab === 'all' || activeTab === 'credit') && withCredit.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {activeTab === 'credit' ? 'Members with Credit' : 'Credit (Overpaid)'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Extra amount paid by members beyond their fee
                </Text>
                {withCredit.map((m) => renderMembershipRow(m, false, true))}
              </View>
            )}

            {activeTab === 'credit' && withCredit.length === 0 && (
              <Text style={styles.emptyText}>No members with credit balance</Text>
            )}

            {(activeTab === 'all' || activeTab === 'upcoming') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Renewals</Text>
                <Text style={styles.sectionSubtitle}>Memberships expiring within 30 days</Text>
                {upcoming.length > 0 ? (
                  upcoming.map((m) => renderMembershipRow(m, true))
                ) : (
                  <Text style={styles.emptyText}>No upcoming renewals</Text>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* Credit Edit Modal */}
        {creditModal && (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => !recording && setCreditModal(null)}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={() => {}}
            >
              <Text style={styles.modalTitle}>Add Advance Credit</Text>
              <Text style={styles.modalSubtitle}>
                {getUserName(creditModal.membership)} — {getPlanName(creditModal.membership)}
              </Text>

              {/* Credit breakdown */}
              {(() => {
                const m = creditModal.membership;
                const totalFee = m.feesAmount ?? getPlanPrice(m);
                const paidAmount = m.feesPaid ?? 0;
                const due = m.feesDue ?? (totalFee - paidAmount);
                const currentCredit = m.advanceCredit ?? (paidAmount > totalFee && due <= 0 ? paidAmount - totalFee : 0);
                const autoCredit = paidAmount > totalFee ? paidAmount - totalFee : 0;

                return (
                  <View style={styles.modalFeeBreakdown}>
                    <View style={styles.modalFeeRow}>
                      <Text style={styles.modalFeeLabel}>Total Fee</Text>
                      <Text style={styles.modalFeeValue}>{formatCurrency(totalFee)}</Text>
                    </View>
                    <View style={styles.modalFeeRow}>
                      <Text style={styles.modalFeeLabel}>Total Paid</Text>
                      <Text style={[styles.modalFeeValue, { color: colors.status.success }]}>{formatCurrency(paidAmount)}</Text>
                    </View>
                    {autoCredit > 0 && (
                      <View style={styles.modalFeeRow}>
                        <Text style={styles.modalFeeLabel}>Auto-calculated Credit</Text>
                        <Text style={[styles.modalFeeValue, { color: colors.status.info }]}>{formatCurrency(autoCredit)}</Text>
                      </View>
                    )}
                    {currentCredit > 0 && currentCredit !== autoCredit && (
                      <View style={styles.modalFeeRow}>
                        <Text style={styles.modalFeeLabel}>Current Credit</Text>
                        <Text style={[styles.modalFeeValue, { color: colors.status.info }]}>{formatCurrency(currentCredit)}</Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              <View style={styles.creditNotice}>
                <Ionicons name="information-circle" size={16} color={colors.status.info} />
                <Text style={styles.creditNoticeText}>
                  Amount is added on top of existing credit. Credit builds when total paid exceeds the fee.
                </Text>
              </View>

              <Input
                label="Amount to Add (₹)"
                placeholder="e.g. 500"
                value={creditModal.amount}
                onChangeText={(text: string) =>
                  setCreditModal((prev) => prev ? { ...prev, amount: text } : null)
                }
              />

              <Input
                label="Note (optional)"
                placeholder="Reason for credit adjustment"
                value={creditModal.note}
                onChangeText={(text: string) =>
                  setCreditModal((prev) => prev ? { ...prev, note: text } : null)
                }
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setCreditModal(null)}
                  variant="outline"
                  size="md"
                  disabled={recording}
                />
                <Button
                  title="Save Credit"
                  onPress={handleSubmitCredit}
                  variant="primary"
                  size="md"
                  loading={recording}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Payment Recording Modal */}
        {paymentModal && (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => !recording && setPaymentModal(null)}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={() => {}}
            >
              <Text style={styles.modalTitle}>Record Payment</Text>
              <Text style={styles.modalSubtitle}>
                {getUserName(paymentModal.membership)} — {getPlanName(paymentModal.membership)}
              </Text>

              {/* Fee breakdown */}
              {(() => {
                const m = paymentModal.membership;
                const totalFee = m.feesAmount ?? getPlanPrice(m);
                const paidAmount = m.feesPaid ?? 0;
                const due = m.feesDue ?? (totalFee - paidAmount);
                const credit = m.advanceCredit ?? (paidAmount > totalFee && due <= 0 ? paidAmount - totalFee : 0);
                const enteredAmount = parseFloat(paymentModal.amount) || 0;
                const willCredit = due > 0 && enteredAmount > due ? enteredAmount - due : 0;

                return (
                  <View style={styles.modalFeeBreakdown}>
                    <View style={styles.modalFeeRow}>
                      <Text style={styles.modalFeeLabel}>Total Fee</Text>
                      <Text style={styles.modalFeeValue}>{formatCurrency(totalFee)}</Text>
                    </View>
                    <View style={styles.modalFeeRow}>
                      <Text style={styles.modalFeeLabel}>Paid</Text>
                      <Text style={[styles.modalFeeValue, { color: colors.status.success }]}>{formatCurrency(paidAmount)}</Text>
                    </View>
                    {due > 0 && (
                      <View style={styles.modalFeeRow}>
                        <Text style={styles.modalFeeLabel}>Due</Text>
                        <Text style={[styles.modalFeeValue, { color: colors.status.error }]}>{formatCurrency(due)}</Text>
                      </View>
                    )}
                    {credit > 0 && (
                      <View style={styles.modalFeeRow}>
                        <Text style={styles.modalFeeLabel}>Existing Credit</Text>
                        <Text style={[styles.modalFeeValue, { color: colors.status.info }]}>{formatCurrency(credit)}</Text>
                      </View>
                    )}
                    {willCredit > 0 && (
                      <View style={styles.creditNotice}>
                        <Ionicons name="information-circle" size={16} color={colors.status.info} />
                        <Text style={styles.creditNoticeText}>
                          {formatCurrency(willCredit)} will be added as credit
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              <Input
                label="Amount (₹)"
                placeholder="Enter payment amount"
                value={paymentModal.amount}
                onChangeText={(text: string) =>
                  setPaymentModal((prev) => prev ? { ...prev, amount: text } : null)
                }
              />

              <Input
                label="Note (optional)"
                placeholder="Payment note"
                value={paymentModal.note}
                onChangeText={(text: string) =>
                  setPaymentModal((prev) => prev ? { ...prev, note: text } : null)
                }
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setPaymentModal(null)}
                  variant="outline"
                  size="md"
                  disabled={recording}
                />
                <Button
                  title="Record Payment"
                  onPress={handleSubmitPayment}
                  variant="primary"
                  size="md"
                  loading={recording}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text.primary,
  },
  summaryCount: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
  },
  tabsRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterTabActive: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
  filterTabText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.text.onPrimary,
  },
  searchContainer: {
    marginBottom: spacing.xl,
  },
  sortSearchRow: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  searchFlex: {
    marginBottom: spacing.sm,
  },
  sortChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  sortChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  sortChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  sortChipText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.text.secondary,
  },
  sortChipTextActive: {
    color: colors.text.onPrimary,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.light,
    marginBottom: spacing.lg,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  feeInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  feeName: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  feePlan: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
    marginTop: 1,
  },
  feeAmounts: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 2,
  },
  feeAmountLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  feeDate: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text.light,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.light,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.card,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
    ...shadows.large,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    justifyContent: 'flex-end',
  },
  modalFeeBreakdown: {
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  modalFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFeeLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.text.secondary,
  },
  modalFeeValue: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
  creditNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  creditNoticeText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.status.info,
    flex: 1,
  },
  creditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.info,
    ...shadows.card,
  },
  creditBannerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  creditBannerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
  creditBannerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 1,
  },
  addCreditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.status.info,
  },
  addCreditText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.status.info,
  },
});
