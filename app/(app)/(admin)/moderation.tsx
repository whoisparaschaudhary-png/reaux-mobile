import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useModerationStore } from '../../../src/stores/useModerationStore';
import { useUIStore } from '../../../src/stores/useUIStore';
import { formatRelative } from '../../../src/utils/formatters';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';
import type { ContentReport, ReportStatus, User } from '../../../src/types/models';

const STATUS_TABS: { key: ReportStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'removed', label: 'Removed' },
  { key: 'dismissed', label: 'Dismissed' },
];

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam or misleading',
  harassment: 'Harassment or bullying',
  nudity: 'Nudity or sexual content',
  violence: 'Violence or dangerous acts',
  hate_speech: 'Hate speech',
  false_information: 'False information',
  blocked_user: 'User blocked',
  other: 'Other',
};

const CONTENT_LABELS: Record<string, string> = {
  post: 'Post',
  reel: 'Reel',
  comment: 'Comment',
  reelComment: 'Reel comment',
  user: 'User',
};

const userName = (value: string | User | undefined): string =>
  typeof value === 'object' && value ? value.name : 'Unknown';

export default function ModerationScreen() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState<ReportStatus>('pending');
  const reports = useModerationStore((s) => s.reports);
  const reportsLoading = useModerationStore((s) => s.reportsLoading);
  const reportsPagination = useModerationStore((s) => s.reportsPagination);
  const fetchReports = useModerationStore((s) => s.fetchReports);
  const resolveReport = useModerationStore((s) => s.resolveReport);
  const showToast = useUIStore((s) => s.showToast);

  useFocusEffect(
    useCallback(() => {
      fetchReports(1, activeStatus);
    }, [fetchReports, activeStatus])
  );

  const handleLoadMore = useCallback(() => {
    if (reportsLoading || reportsPagination.page >= reportsPagination.pages) return;
    fetchReports(reportsPagination.page + 1, activeStatus);
  }, [reportsLoading, reportsPagination, fetchReports, activeStatus]);

  const act = useCallback(
    (report: ContentReport, action: 'remove' | 'dismiss', ejectUser: boolean) => {
      const isUserReport = report.contentType === 'user';
      const title =
        action === 'dismiss'
          ? 'Dismiss report?'
          : ejectUser
            ? isUserReport
              ? 'Eject this user?'
              : 'Remove content and eject user?'
            : 'Remove content?';
      const message =
        action === 'dismiss'
          ? 'The report will be closed with no action taken.'
          : ejectUser
            ? 'The offending content is removed and the user’s account is disabled.'
            : 'The offending content is permanently removed.';
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'dismiss' ? 'Dismiss' : ejectUser ? 'Remove & Eject' : 'Remove',
          style: action === 'dismiss' ? 'default' : 'destructive',
          onPress: () => {
            resolveReport(report._id, action, ejectUser)
              .then(() => showToast(action === 'dismiss' ? 'Report dismissed' : 'Content removed', 'success'))
              .catch((err: any) => showToast(err.message || 'Failed to resolve report', 'error'));
          },
        },
      ]);
    },
    [resolveReport, showToast],
  );

  const renderReport = useCallback(
    ({ item }: { item: ContentReport }) => (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Badge
            text={CONTENT_LABELS[item.contentType] ?? item.contentType}
            variant={item.contentType === 'user' ? 'warning' : 'info'}
            size="sm"
          />
          <Badge text={REASON_LABELS[item.reason] ?? item.reason} variant="error" size="sm" />
          <Text style={styles.timestamp}>{formatRelative(item.createdAt)}</Text>
        </View>

        {item.contentSnapshot ? (
          <Text style={styles.snapshot} numberOfLines={4}>
            “{item.contentSnapshot}”
          </Text>
        ) : (
          <Text style={styles.snapshotEmpty}>No text content (media only)</Text>
        )}

        <Text style={styles.metaLine}>
          Reported by <Text style={styles.metaName}>{userName(item.reporter)}</Text>
          {'  ·  '}Author <Text style={styles.metaName}>{userName(item.contentAuthor)}</Text>
        </Text>

        {item.status === 'pending' ? (
          <View style={styles.actionsRow}>
            {item.contentType !== 'user' && (
              <TouchableOpacity style={[styles.actionButton, styles.removeButton]} onPress={() => act(item, 'remove', false)}>
                <Ionicons name="trash-outline" size={ms(15)} color={colors.text.white} />
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionButton, styles.ejectButton]} onPress={() => act(item, 'remove', true)}>
              <Ionicons name="person-remove-outline" size={ms(15)} color={colors.text.white} />
              <Text style={styles.removeText}>
                {item.contentType === 'user' ? 'Eject User' : 'Remove + Eject'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.dismissButton]} onPress={() => act(item, 'dismiss', false)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.resolvedLine}>
            {item.status === 'removed' ? 'Removed' : 'Dismissed'} by {userName(item.reviewedBy as User)}
            {item.reviewedAt ? ` · ${formatRelative(item.reviewedAt)}` : ''}
          </Text>
        )}
      </View>
    ),
    [act],
  );

  return (
    <SafeScreen>
      <Header title="Reports & Moderation" showBack onBack={() => router.back()} />

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeStatus === tab.key && styles.tabActive]}
              onPress={() => setActiveStatus(tab.key)}
            >
              <Text style={[styles.tabText, activeStatus === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.slaNote}>
        Reports must be actioned within 24 hours — remove violating content and eject repeat offenders.
      </Text>

      {reportsLoading && reports.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={renderReport}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={reportsLoading}
          onRefresh={() => fetchReports(1, activeStatus)}
          ListEmptyComponent={
            <EmptyState
              icon="shield-checkmark-outline"
              title={activeStatus === 'pending' ? 'No pending reports' : 'Nothing here'}
              message={
                activeStatus === 'pending'
                  ? 'All reports have been handled. New reports also arrive by email.'
                  : 'Resolved reports will appear here.'
              }
            />
          }
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    flexGrow: 0,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background.white,
    borderWidth: 1,
    borderColor: colors.border.gray,
  },
  tabActive: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
  tabText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.onPrimary,
  },
  slaNote: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(17),
    color: colors.text.light,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.button,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timestamp: {
    marginLeft: 'auto',
    fontFamily: fontFamily.regular,
    fontSize: ms(11),
    color: colors.text.light,
  },
  snapshot: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  snapshotEmpty: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    fontStyle: 'italic',
    color: colors.text.light,
    marginBottom: spacing.sm,
  },
  metaLine: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(17),
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  metaName: {
    fontFamily: fontFamily.medium,
    color: colors.text.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  removeButton: {
    backgroundColor: colors.status.error,
  },
  ejectButton: {
    backgroundColor: colors.background.dark,
  },
  removeText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    color: colors.text.white,
  },
  dismissButton: {
    backgroundColor: colors.border.light,
  },
  dismissText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    color: colors.text.primary,
  },
  resolvedLine: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    color: colors.text.light,
  },
});
