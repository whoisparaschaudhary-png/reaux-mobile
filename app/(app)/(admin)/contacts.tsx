import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { contactsApi } from '../../../src/api/endpoints/contacts';
import { formatDate } from '../../../src/utils/formatters';
import { colors, fontFamily, spacing, borderRadius } from '../../../src/theme';
import { ms, mvs } from '../../../src/utils/responsive';
import type { Contact, ContactStatus } from '../../../src/types/models';

type StatusFilter = 'all' | ContactStatus;

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
];

export default function AdminContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('open');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchContacts = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      try {
        const params: any = { page: pageNum, limit: 10 };
        if (activeFilter !== 'all') {
          params.status = activeFilter;
        }
        const res = await contactsApi.list(params);
        const list = res.data ?? [];
        if (refresh || pageNum === 1) {
          setContacts(list);
        } else {
          setContacts((prev) => [...prev, ...list]);
        }
        setTotalPages(res.pagination?.pages ?? 1);
        setPage(pageNum);
      } catch {
        // silently fail
      }
    },
    [activeFilter],
  );

  useEffect(() => {
    setIsLoading(true);
    setContacts([]);
    fetchContacts(1).finally(() => setIsLoading(false));
  }, [fetchContacts]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchContacts(1, true);
    setIsRefreshing(false);
  }, [fetchContacts]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    await fetchContacts(page + 1);
    setIsLoadingMore(false);
  }, [isLoadingMore, page, totalPages, fetchContacts]);

  const renderContactItem = ({ item }: { item: Contact }) => {
    const isOpen = item.status === 'open';

    return (
      <Card style={styles.contactCard}>
        <View style={styles.cardHeader}>
          <View style={styles.senderInfo}>
            <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.senderName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <Badge
            text={isOpen ? 'Open' : 'Resolved'}
            variant={isOpen ? 'warning' : 'success'}
            size="sm"
          />
        </View>

        {item.subject ? (
          <Text style={styles.subject} numberOfLines={1}>
            {item.subject}
          </Text>
        ) : null}

        <Text style={styles.message} numberOfLines={3}>
          {item.message}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.email} numberOfLines={1}>
            {item.email}
          </Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.phone ? (
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={12} color={colors.text.light} />
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <SafeScreen>
        <Header title="Contact Messages" showBack onBack={() => router.back()} />

        <View style={styles.container}>
          {/* Filter Tabs */}
          <View style={styles.tabScrollContainer}>
            <FlashList
              data={FILTER_TABS}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabContent}
              renderItem={({ item: tab }) => (
                <TouchableOpacity
                  style={[styles.tab, activeFilter === tab.key && styles.tabActive]}
                  onPress={() => setActiveFilter(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeFilter === tab.key && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Contact List */}
          <View style={styles.listContainer}>
            <FlashList
              data={contacts}
              renderItem={renderContactItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary.yellow} />
                  </View>
                ) : (
                  <EmptyState
                    icon="mail-outline"
                    title="No messages"
                    message={
                      activeFilter === 'all'
                        ? 'Contact messages will appear here'
                        : `No ${activeFilter} messages`
                    }
                  />
                )
              }
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator size="small" color={colors.primary.yellow} />
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabScrollContainer: {
    height: 44,
    paddingLeft: spacing.xl,
    marginBottom: spacing.md,
  },
  tabContent: {
    paddingRight: spacing.xl,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    marginRight: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.background.dark,
  },
  tabText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.white,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  footerLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  contactCard: {
    marginTop: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  senderName: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.primary,
    flex: 1,
  },
  subject: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  email: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
    flex: 1,
    marginRight: spacing.sm,
  },
  date: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  phone: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },
});
