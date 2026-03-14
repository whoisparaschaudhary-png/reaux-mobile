import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { useAuthStore } from '../../../../src/stores/useAuthStore';
import { membershipsApi } from '../../../../src/api/endpoints/memberships';
import { gymsApi } from '../../../../src/api/endpoints/gyms';
import { showAppAlert } from '../../../../src/stores/useUIStore';
import { formatDate, formatCurrency } from '../../../../src/utils/formatters';
import { colors, fontFamily, spacing, borderRadius, layout } from '../../../../src/theme';
import type { Membership, Gym, MembershipPlan, User } from '../../../../src/types/models';

export default function GymMembersScreen() {
  const router = useRouter();
  const user = useAuthStore((s: any) => s.user);
  const isSuperadmin = user?.role === 'superadmin';

  const adminGymId = user?.gymId
    ? typeof user.gymId === 'string'
      ? user.gymId
      : (user.gymId as Gym)._id
    : null;

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string>(adminGymId ?? '');
  const [selectedGymName, setSelectedGymName] = useState('');
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showGymPicker, setShowGymPicker] = useState(false);

  // Load gyms for superadmin
  useEffect(() => {
    if (isSuperadmin) {
      gymsApi.list({ limit: 100 }).then((res) => {
        const list = res.data ?? [];
        setGyms(list);
        if (list.length > 0 && !selectedGymId) {
          setSelectedGymId(list[0]._id);
          setSelectedGymName(list[0].name);
        }
      }).catch(() => {});
    } else if (adminGymId) {
      // Load gym name for admin
      gymsApi.getById(adminGymId).then((res) => {
        if (res.data) setSelectedGymName(res.data.name);
      }).catch(() => {});
    }
  }, []);

  const loadMembers = useCallback(async (gymId: string) => {
    if (!gymId) return;
    setLoading(true);
    try {
      // Fetch all memberships for the gym (limit 200)
      const res = await membershipsApi.list({ gymId, limit: 200, page: 1 });
      setMemberships(res.data ?? []);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedGymId) loadMembers(selectedGymId);
  }, [selectedGymId]);

  const getUser = (m: Membership): User | null =>
    m.userId && typeof m.userId === 'object' ? (m.userId as User) : null;

  const getPlan = (m: Membership): MembershipPlan | null =>
    m.planId && typeof m.planId === 'object' ? (m.planId as MembershipPlan) : null;

  const getStatusColor = (status: string) => {
    if (status === 'active') return colors.status.success;
    if (status === 'expired') return colors.status.error;
    return colors.text.light;
  };

  const handleExportPDF = async () => {
    if (memberships.length === 0) {
      showAppAlert('No Data', 'No members to export');
      return;
    }
    setExporting(true);
    try {
      const rows = memberships.map((m, i) => {
        const u = getUser(m);
        const p = getPlan(m);
        const feesDue = m.feesDue ?? 0;
        const rowBg = i % 2 === 0 ? '#ffffff' : '#f9f9f6';
        return `
          <tr style="background:${rowBg}">
            <td>${i + 1}</td>
            <td>${u?.name ?? '—'}</td>
            <td>${u?.phone ?? u?.email ?? '—'}</td>
            <td>${p?.name ?? '—'}</td>
            <td>${formatDate(m.startDate)}</td>
            <td>${formatDate(m.endDate)}</td>
            <td style="color:${m.status === 'active' ? '#22c55e' : m.status === 'expired' ? '#ef4444' : '#999'};font-weight:600">${m.status.toUpperCase()}</td>
            <td>${m.feesAmount != null ? '₹' + m.feesAmount.toLocaleString('en-IN') : '—'}</td>
            <td>${m.feesPaid != null ? '₹' + m.feesPaid.toLocaleString('en-IN') : '—'}</td>
            <td style="color:${feesDue > 0 ? '#ef4444' : '#22c55e'};font-weight:600">${feesDue > 0 ? '₹' + feesDue.toLocaleString('en-IN') : 'Nil'}</td>
          </tr>`;
      }).join('');

      const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const activeCount = memberships.filter((m) => m.status === 'active').length;
      const expiredCount = memberships.filter((m) => m.status === 'expired').length;
      const totalDue = memberships.reduce((sum, m) => sum + (m.feesDue ?? 0), 0);

      const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1c1c0d; background: #fff; }
  .header { background: #f9f506; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { font-size: 20px; font-weight: bold; }
  .header p { font-size: 11px; color: #555; margin-top: 2px; }
  .summary { display: flex; gap: 16px; padding: 16px 24px; background: #f8f8f5; border-bottom: 1px solid #e4e4e4; }
  .stat { flex: 1; background: #fff; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #e4e4e4; }
  .stat-val { font-size: 22px; font-weight: bold; color: #1c1c0d; }
  .stat-lbl { font-size: 10px; color: #888; margin-top: 2px; }
  .table-wrap { padding: 16px 24px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1c1c0d; color: #fff; padding: 8px 6px; text-align: left; font-size: 11px; }
  td { padding: 7px 6px; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
  .footer { text-align: center; padding: 12px; font-size: 10px; color: #aaa; border-top: 1px solid #e4e4e4; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>REAUX LABS — Gym Member Report</h1>
    <p>${selectedGymName}</p>
  </div>
  <div style="text-align:right">
    <p style="font-size:13px;font-weight:bold">${today}</p>
    <p>${memberships.length} members</p>
  </div>
</div>
<div class="summary">
  <div class="stat"><div class="stat-val">${memberships.length}</div><div class="stat-lbl">Total Members</div></div>
  <div class="stat"><div class="stat-val" style="color:#22c55e">${activeCount}</div><div class="stat-lbl">Active</div></div>
  <div class="stat"><div class="stat-val" style="color:#ef4444">${expiredCount}</div><div class="stat-lbl">Expired</div></div>
  <div class="stat"><div class="stat-val" style="color:#ef4444">₹${totalDue.toLocaleString('en-IN')}</div><div class="stat-lbl">Total Dues</div></div>
</div>
<div class="table-wrap">
<table>
<thead>
<tr>
  <th>#</th><th>Name</th><th>Phone / Email</th><th>Plan</th>
  <th>Start</th><th>Expiry</th><th>Status</th>
  <th>Total Fee</th><th>Paid</th><th>Due</th>
</tr>
</thead>
<tbody>${rows}</tbody>
</table>
</div>
<div class="footer">Generated by REAUX LABS Admin · ${today}</div>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Gym Members' });
      } else {
        showAppAlert('Exported', `PDF saved to: ${uri}`);
      }
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const renderItem = ({ item, index }: { item: Membership; index: number }) => {
    const u = getUser(item);
    const p = getPlan(item);
    const feesDue = item.feesDue ?? 0;

    return (
      <TouchableOpacity
        style={styles.memberCard}
        onPress={() => router.push(`/(app)/(admin)/memberships/memberships/${item._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.memberIndex}>
          <Text style={styles.memberIndexText}>{index + 1}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{u?.name ?? 'Unknown'}</Text>
          <Text style={styles.memberContact}>{u?.phone || u?.email || '—'}</Text>
          <Text style={styles.memberPlan}>{p?.name ?? '—'}</Text>
          <View style={styles.memberDates}>
            <Text style={styles.memberDate}>
              {formatDate(item.startDate)} → {formatDate(item.endDate)}
            </Text>
          </View>
        </View>
        <View style={styles.memberRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
          {feesDue > 0 && (
            <Text style={styles.dueText}>Due: {formatCurrency(feesDue)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const activeCount = memberships.filter((m) => m.status === 'active').length;

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Gym Members"
          showBack
          onBack={() => router.back()}
          rightAction={
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportPDF}
              disabled={exporting || loading}
              activeOpacity={0.7}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <Ionicons name="download-outline" size={22} color={colors.text.primary} />
              )}
            </TouchableOpacity>
          }
        />

        {/* Gym Selector (superadmin only) */}
        {isSuperadmin && (
          <View style={styles.gymSelector}>
            <TouchableOpacity
              style={styles.gymSelectorBtn}
              onPress={() => setShowGymPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="business-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.gymSelectorText} numberOfLines={1}>
                {selectedGymName || 'Select Gym'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.text.light} />
            </TouchableOpacity>
          </View>
        )}

        {/* Gym name for admin */}
        {!isSuperadmin && selectedGymName ? (
          <View style={styles.gymBanner}>
            <Ionicons name="business-outline" size={16} color={colors.primary.yellowDark} />
            <Text style={styles.gymBannerText}>{selectedGymName}</Text>
          </View>
        ) : null}

        {/* Stats bar */}
        {!loading && memberships.length > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{memberships.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.status.success }]}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.status.error }]}>
                {memberships.length - activeCount}
              </Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
            <Text style={styles.loadingText}>Loading members...</Text>
          </View>
        ) : memberships.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="people-outline" size={48} color={colors.text.light} />
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        ) : (
          <FlatList
            data={memberships}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Gym Picker Modal */}
        {showGymPicker && (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowGymPicker(false)}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select Gym</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {gyms.map((gym) => (
                  <TouchableOpacity
                    key={gym._id}
                    style={[styles.gymOption, selectedGymId === gym._id && styles.gymOptionActive]}
                    onPress={() => {
                      setSelectedGymId(gym._id);
                      setSelectedGymName(gym.name);
                      setShowGymPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gymOptionText, selectedGymId === gym._id && styles.gymOptionTextActive]}>
                      {gym.name}
                    </Text>
                    {selectedGymId === gym._id && (
                      <Ionicons name="checkmark" size={18} color={colors.primary.yellowDark} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        )}
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  gymSelector: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  gymSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  gymSelectorText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.text.primary,
  },
  gymBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: layout.screenPadding,
    marginTop: spacing.sm,
    backgroundColor: colors.primary.yellowLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  gymBannerText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: layout.screenPadding,
    marginTop: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: spacing.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  memberIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberIndexText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.text.secondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.text.primary,
  },
  memberContact: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 1,
  },
  memberPlan: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.primary.yellowDark,
    marginTop: 2,
  },
  memberDates: {
    marginTop: 3,
  },
  memberDate: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.text.light,
  },
  memberRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  dueText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.status.error,
  },
  exportBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text.light,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border.gray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  gymOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  gymOptionActive: {
    backgroundColor: colors.primary.yellowLight,
  },
  gymOptionText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text.primary,
  },
  gymOptionTextActive: {
    fontFamily: fontFamily.medium,
  },
});
