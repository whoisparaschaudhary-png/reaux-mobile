import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { Avatar } from '../../../../src/components/ui/Avatar';
import { SearchBar } from '../../../../src/components/ui/SearchBar';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { useAuthStore } from '../../../../src/stores/useAuthStore';
import { membershipsApi } from '../../../../src/api/endpoints/memberships';
import { useUIStore, showAppAlert } from '../../../../src/stores/useUIStore';
import { formatCurrency, formatDate } from '../../../../src/utils/formatters';
import { useRefreshOnFocus } from '../../../../src/hooks/useRefreshOnFocus';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../../../src/theme';
import { ms } from '../../../../src/utils/responsive';
import type { Membership, Gym, User } from '../../../../src/types/models';

type Tab = 'all' | 'fees';

const getMember = (m: Membership): User | null =>
  m.userId && typeof m.userId === 'object' ? (m.userId as User) : null;

function membershipDuration(startDate?: string): string {
  if (!startDate) return '';
  const days = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000));
  if (days < 1) return 'Today';
  if (days < 30) return `${days} Day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} Month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  return `${years}+ Year${years === 1 ? '' : 's'}`;
}

export default function CandidatesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);

  const adminGymId = user?.gymId
    ? typeof user.gymId === 'string'
      ? user.gymId
      : (user.gymId as Gym)._id
    : undefined;

  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toRemove, setToRemove] = useState<Membership | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await membershipsApi.list({ gymId: adminGymId, limit: 200, page: 1 });
      setMemberships(res.data ?? []);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, [adminGymId]);

  useRefreshOnFocus(load);
  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memberships.filter((m) => {
      if (tab === 'fees' && (m.feesDue ?? 0) <= 0) return false;
      if (!q) return true;
      const u = getMember(m);
      return (u?.name ?? '').toLowerCase().includes(q) || (u?.phone ?? '').toLowerCase().includes(q);
    });
  }, [memberships, tab, query]);

  const handleRemove = useCallback(async () => {
    if (!toRemove) return;
    setRemoving(true);
    try {
      await membershipsApi.cancel(toRemove._id);
      setMemberships((prev) => prev.filter((m) => m._id !== toRemove._id));
      showToast('Candidate removed', 'success');
      setToRemove(null);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to remove candidate');
    } finally {
      setRemoving(false);
    }
  }, [toRemove, showToast]);

  const handleExport = useCallback(async () => {
    if (filtered.length === 0) {
      showAppAlert('No Data', 'No candidates to export');
      return;
    }
    setExporting(true);
    try {
      const rows = filtered
        .map((m, i) => {
          const u = getMember(m);
          const due = m.feesDue ?? 0;
          return `<tr><td>${i + 1}</td><td>${u?.name ?? '—'}</td><td>${u?.phone ?? '—'}</td><td>${formatDate(m.startDate)}</td><td>${m.feesAmount != null ? '₹' + m.feesAmount.toLocaleString('en-IN') : '—'}</td><td style="color:${due > 0 ? '#ef4444' : '#22c55e'}">${due > 0 ? '₹' + due.toLocaleString('en-IN') : 'Nil'}</td></tr>`;
        })
        .join('');
      const html = `<html><head><meta charset="utf-8"/><style>body{font-family:Arial;font-size:12px;color:#1c1c0d}.h{background:#f9f506;padding:16px 20px;font-size:18px;font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#1c1c0d;color:#fff;padding:8px;text-align:left}td{padding:7px 8px;border-bottom:1px solid #eee}</style></head><body><div class="h">REAUX LABS — My Candidates (${filtered.length})</div><table><thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Start</th><th>Fee</th><th>Due</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Candidates' });
      } else {
        showAppAlert('Exported', `PDF saved to: ${uri}`);
      }
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to export');
    } finally {
      setExporting(false);
    }
  }, [filtered]);

  const renderItem = ({ item }: { item: Membership }) => {
    const u = getMember(item);
    const due = item.feesDue ?? 0;
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => router.push(`/(app)/(admin)/memberships/records/${item._id}` as any)}
      >
        <Avatar uri={u?.avatar} name={u?.name || 'Member'} size={ms(48)} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>
            {u?.name ?? 'Unknown'}
          </Text>
          {tab === 'fees' && due > 0 ? (
            <Text style={styles.rowDue}>Due {formatCurrency(due)}</Text>
          ) : (
            <Text style={styles.rowSub}>{membershipDuration(item.startDate)}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setToRemove(item)} hitSlop={10} style={styles.removeBtn}>
          <Ionicons name="close" size={ms(22)} color={colors.text.secondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const removeMember = toRemove ? getMember(toRemove) : null;

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="My Candidates" showBack onBack={() => router.back()} />

        {/* All / Fees toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, tab === 'all' && styles.toggleBtnActive]}
            onPress={() => setTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, tab === 'all' && styles.toggleTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, tab === 'fees' && styles.toggleBtnActive]}
            onPress={() => setTab('fees')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, tab === 'fees' && styles.toggleTextActive]}>Fees</Text>
          </TouchableOpacity>
        </View>

        {/* Add Candidate */}
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/(app)/(admin)/candidates/add' as any)}
        >
          <Text style={styles.addBtnText}>Add Candidate</Text>
        </TouchableOpacity>

        {/* Search */}
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search Candidates" />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title={tab === 'fees' ? 'No pending fees' : 'No candidates yet'}
                message={tab === 'fees' ? 'Members with dues will appear here.' : 'Add your first gym candidate to get started.'}
              />
            }
          />
        )}

        {/* Export Data FAB */}
        {filtered.length > 0 && (
          <TouchableOpacity
            style={[styles.exportFab, shadows.large]}
            activeOpacity={0.85}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.text.onPrimary} />
            ) : (
              <Text style={styles.exportFabText}>Export Data</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Remove confirm bottom-sheet */}
        <Modal visible={!!toRemove} transparent animationType="fade" onRequestClose={() => setToRemove(null)} statusBarTranslucent>
          <View style={styles.sheetRoot}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => (removing ? null : setToRemove(null))} />
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Remove Candidate</Text>
                <TouchableOpacity onPress={() => setToRemove(null)} hitSlop={8} disabled={removing}>
                  <Ionicons name="close" size={ms(22)} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetBody}>
                This will remove the user from your gym data; all their associated data will be removed too.
              </Text>
              {removeMember && (
                <View style={styles.sheetMember}>
                  <Avatar uri={removeMember.avatar} name={removeMember.name} size={ms(44)} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{removeMember.name}</Text>
                    <Text style={styles.rowSub}>{membershipDuration(toRemove?.startDate)}</Text>
                  </View>
                </View>
              )}
              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={[styles.sheetBtn, styles.sheetCancel]}
                  onPress={() => setToRemove(null)}
                  disabled={removing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sheetBtn, styles.sheetRemove]}
                  onPress={handleRemove}
                  disabled={removing}
                  activeOpacity={0.85}
                >
                  {removing ? (
                    <ActivityIndicator size="small" color={colors.text.white} />
                  ) : (
                    <Text style={styles.sheetRemoveText}>Remove</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    padding: spacing.xs,
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.pill,
    ...shadows.button,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary.yellow,
  },
  toggleText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: colors.text.onPrimary,
  },
  addBtn: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    alignItems: 'center',
  },
  addBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    color: colors.text.primary,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: ms(100),
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    color: colors.text.primary,
  },
  rowSub: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    color: colors.text.light,
    marginTop: 1,
  },
  rowDue: {
    fontFamily: fontFamily.bold,
    fontSize: ms(13),
    color: colors.status.error,
    marginTop: 1,
  },
  removeBtn: {
    width: ms(32),
    height: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportFab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    backgroundColor: colors.primary.yellow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
  },
  exportFabText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    color: colors.text.onPrimary,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay.medium,
  },
  sheet: {
    backgroundColor: colors.background.light,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  sheetBody: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  sheetMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sheetBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    minHeight: ms(48),
  },
  sheetCancel: {
    backgroundColor: colors.primary.yellowLight,
  },
  sheetCancelText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    color: colors.text.primary,
  },
  sheetRemove: {
    backgroundColor: colors.status.error,
  },
  sheetRemoveText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    color: colors.text.white,
  },
});
