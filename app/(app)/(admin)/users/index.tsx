import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { SearchBar } from '../../../../src/components/ui/SearchBar';
import { Button } from '../../../../src/components/ui/Button';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { UserCard } from '../../../../src/components/cards/UserCard';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { useAdminStore } from '../../../../src/stores/useAdminStore';
import { useAuthStore } from '../../../../src/stores/useAuthStore';
import { useUIStore } from '../../../../src/stores/useUIStore';
import { exportUsersListPDF } from '../../../../src/utils/pdfExport';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import type { User, Role } from '../../../../src/types/models';

type TabFilter = 'all' | 'admin' | 'user';

const SUPERADMIN_TABS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'admin', label: 'Admins' },
  { key: 'user', label: 'Users' },
];

export default function UsersScreen() {
  const router = useRouter();
  const { backRoute } = useLocalSearchParams<{ backRoute?: string }>();
  const handleBack = () => backRoute === 'profile' ? router.navigate('/(app)/(profile)') : router.back();
  const { users, isLoading, pagination, fetchUsers, updateUserStatus } = useAdminStore();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const showToast = useUIStore((s) => s.showToast);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const filteredUsers = users.filter((user) => {
    // Admins should only see regular users (safety net for backend filtering)
    if (!isSuperAdmin && user.role !== 'user') return false;

    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'admin' && (user.role === 'admin' || user.role === 'superadmin')) ||
      (activeTab === 'user' && user.role === 'user');

    return matchesSearch && matchesTab;
  });

  const handleLoadMore = useCallback(() => {
    if (!isLoading && pagination.page < pagination.pages) {
      fetchUsers(pagination.page + 1);
    }
  }, [isLoading, pagination]);

  const handleDeactivate = useCallback((user: User) => {
    router.push({
      pathname: '/(app)/(admin)/users/deactivate',
      params: { userId: user._id, userName: user.name, userEmail: user.email },
    });
  }, [router]);

  const handleUserPress = useCallback((user: User) => {
    router.push({ pathname: '/(app)/(admin)/users/[id]', params: { id: user._id, backRoute: 'admin' } });
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: User }) => (
      <UserCard
        user={item}
        onPress={handleUserPress}
        onDeactivate={handleDeactivate}
      />
    ),
    [handleUserPress, handleDeactivate],
  );

  const handleExportPDF = async () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      showToast('No users to export', 'error');
      return;
    }

    setIsExporting(true);
    try {
      await exportUsersListPDF(filteredUsers);
      showToast('PDF exported successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Users"
          showBack
          onBack={handleBack}
          rightAction={
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(app)/(admin)/users/create', params: { backRoute: 'admin' } })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="person-add-outline"
                size={24}
                color={colors.text.primary}
              />
            </TouchableOpacity>
          }
        />

        <View style={styles.container}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search users..."
            />
          </View>

          {/* Tabs — only for superadmin (admins only see their gym's regular users) */}
          {isSuperAdmin && (
            <View style={styles.tabRow}>
              {SUPERADMIN_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.key && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* User List */}
          <View style={styles.listContainer}>
            <FlashList
              data={filteredUsers}
              renderItem={renderItem}

              keyExtractor={(item) => item._id}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary.yellow} />
                  </View>
                ) : (
                  <EmptyState
                    icon="people-outline"
                    title="No users found"
                    message="Try adjusting your search or filter"
                  />
                )
              }
              ListFooterComponent={
                isLoading && users.length > 0 ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator size="small" color={colors.primary.yellow} />
                  </View>
                ) : null
              }
            />
          </View>

          {/* Export Button */}
          <View style={styles.exportContainer}>
            <Button
              title="Export as PDF"
              onPress={handleExportPDF}
              variant="secondary"
              size="lg"
              fullWidth
              loading={isExporting}
              disabled={isExporting}
              leftIcon={
                <Ionicons name="document-text-outline" size={20} color={colors.text.white} />
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
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  tabActive: {
    backgroundColor: colors.background.dark,
  },
  tabText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.white,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  footerLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  exportContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
});
