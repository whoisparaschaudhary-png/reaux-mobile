import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Share,
  Pressable,
} from 'react-native';
import Animated, { useSharedValue, withSpring, withSequence, useAnimatedStyle } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { RefreshControl, FlatList } from 'react-native';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { PostCard } from '../../../src/components/cards/PostCard';
import { UserCard } from '../../../src/components/cards/UserCard';
import { Avatar } from '../../../src/components/ui/Avatar';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonCard } from '../../../src/components/ui/SkeletonLoader';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { useFeedStore, getFeedCategoryKey } from '../../../src/stores/useFeedStore';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useAdminStore } from '../../../src/stores/useAdminStore';
import { showAppAlert, useUIStore } from '../../../src/stores/useUIStore';
import { useMembershipStore } from '../../../src/stores/useMembershipStore';
import { usersApi } from '../../../src/api/endpoints/users';
import { promosApi } from '../../../src/api/endpoints/promos';
import { exportUsersPDF } from '../../../src/utils/pdfExport';
import { formatCurrency, formatDate } from '../../../src/utils/formatters';
import {
  colors,
  fontFamily,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../../src/theme';
import type { Post, Workout, WorkoutCategory, WorkoutDifficulty, User, Membership, MembershipPlan, BirthdayUser, UpcomingBirthdayUser, PromoCode } from '../../../src/types/models';

const CATEGORIES = ['For You', 'My Admins', 'Workouts', 'Nutrition'] as const;
const ADMIN_CATEGORIES = ['Members', 'For You', 'Workouts', 'Birthdays', 'Promotions'] as const;
type Category = (typeof CATEGORIES)[number] | 'Members' | 'Birthdays' | 'Promotions';

const categoryToApi: Record<Category, string | undefined> = {
  Members: undefined,
  'For You': undefined,
  'My Admins': 'admin',
  Workouts: 'workouts',
  Nutrition: 'nutrition',
  Birthdays: undefined,
  Promotions: undefined,
};

const WORKOUT_CATEGORIES: { key: WorkoutCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'strength', label: 'Strength' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'hiit', label: 'HIIT' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'flexibility', label: 'Flexibility' },
  { key: 'crossfit', label: 'CrossFit' },
];

const DIFFICULTY_CONFIG: Record<WorkoutDifficulty, { variant: 'success' | 'warning' | 'error' }> = {
  beginner: { variant: 'success' },
  intermediate: { variant: 'warning' },
  advanced: { variant: 'error' },
};

export default function FeedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [activeCategory, setActiveCategory] = useState<Category>(isAdmin ? 'Members' : 'For You');
  const [workoutCategory, setWorkoutCategory] = useState<WorkoutCategory | 'all'>('all');
  const [memberSearch, setMemberSearch] = useState('');

  // Birthdays state
  const [todayBirthdays, setTodayBirthdays] = useState<BirthdayUser[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthdayUser[]>([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(false);

  // Promotions state
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);

  // Admin store for members tab
  const {
    users: adminUsers,
    isLoading: usersLoading,
    pagination: usersPagination,
    fetchUsers,
  } = useAdminStore();

  // Membership store for fees summary
  const {
    memberships,
    membershipsLoading,
    fetchMemberships,
  } = useMembershipStore();

  // Show different categories for admin vs regular user
  const visibleCategories: Category[] = isAdmin
    ? [...ADMIN_CATEGORIES]
    : (CATEGORIES.filter((c) => c !== 'My Admins' && c !== 'Nutrition') as Category[]);

  const categoryApiParam = categoryToApi[activeCategory];
  const categoryKey = getFeedCategoryKey(categoryApiParam);
  const cached = useFeedStore((s) => s.postsByCategory[categoryKey]);
  const posts = cached?.posts ?? [];
  const pagination = cached?.pagination ?? { page: 1, limit: 10, total: 0, pages: 0 };

  const {
    isLoading,
    isRefreshing,
    error,
    fetchPosts,
    refreshPosts,
    likePost,
  } = useFeedStore();

  const {
    workouts,
    isLoading: workoutsLoading,
    isRefreshing: workoutsRefreshing,
    pagination: workoutsPagination,
    fetchWorkouts,
    refreshWorkouts,
  } = useWorkoutStore();

  // FAB animations
  const fabScale = useSharedValue(1);
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleFabPressIn = () => {
    fabScale.value = withSpring(0.9, { damping: 10, stiffness: 400 });
  };

  const handleFabPressOut = () => {
    fabScale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  const handleAdminAdd = useCallback(() => {
    const buttons = [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'New Workout Plan',
        subtitle: 'Create a structured training program',
        icon: 'barbell-outline',
        onPress: () => router.push('/(app)/(health)/workout/create' as any),
      },
    ];
    // Super admin can post; admin cannot (admin only sees New Workout Plan)
    if (!isAdmin || user?.role === 'superadmin') {
      buttons.push({
        text: 'New Post',
        subtitle: 'Share updates, tips or media',
        icon: 'create-outline',
        onPress: () => router.push('/(app)/(feed)/upload'),
      } as any);
    }
    showAppAlert('Add content', 'What would you like to create?', buttons);
  }, [router, isAdmin, user?.role]);

  // Open Workouts tab when navigating from BMI "Explore Workouts" (e.g. ?tab=workouts)
  useEffect(() => {
    if (params.tab === 'workouts') {
      setActiveCategory('Workouts');
    }
  }, [params.tab]);

  // "My Admins" and "Nutrition" are hidden for all — switch to "For You" if either was selected
  useEffect(() => {
    if (activeCategory === 'My Admins' || activeCategory === 'Nutrition') {
      setActiveCategory(isAdmin ? 'Members' : 'For You');
    }
  }, [activeCategory, isAdmin]);

  // Fetch members and memberships when Members tab is active
  useEffect(() => {
    if (activeCategory !== 'Members') return;
    if (adminUsers.length === 0) fetchUsers(1);
    if (memberships.length === 0) fetchMemberships(1, { status: 'active' });
  }, [activeCategory]);

  // Fee summary calculations from memberships
  const feeSummary = useMemo(() => {
    let totalPending = 0;
    let totalPaid = 0;
    let totalCredit = 0;
    let upcomingCount = 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    memberships.forEach((m: Membership) => {
      const planPrice = typeof m.planId === 'object' && m.planId !== null
        ? (m.planId as MembershipPlan).price ?? 0
        : 0;
      const totalFee = m.feesAmount ?? planPrice;
      const paid = m.feesPaid ?? 0;
      const due = m.feesDue ?? (totalFee - paid);
      const credit = m.advanceCredit ?? (paid > totalFee && due <= 0 ? paid - totalFee : 0);

      totalPaid += paid;
      if (due > 0) totalPending += due;
      if (credit > 0) totalCredit += credit;

      // Upcoming = membership ending within 30 days (renewal fees coming up)
      const endDate = new Date(m.endDate);
      if (endDate >= now && endDate <= thirtyDaysFromNow) {
        upcomingCount++;
      }
    });

    return { totalPending, totalPaid, totalCredit, upcomingCount };
  }, [memberships]);

  // Fetch birthdays when Birthdays tab is active
  useEffect(() => {
    if (activeCategory !== 'Birthdays') return;
    setBirthdaysLoading(true);
    Promise.all([
      usersApi.getTodayBirthdays().catch(() => ({ data: [] })),
      usersApi.getUpcomingBirthdays(30).catch(() => ({ data: [] })),
    ]).then(([todayRes, upcomingRes]) => {
      setTodayBirthdays(todayRes.data ?? []);
      setUpcomingBirthdays(upcomingRes.data ?? []);
    }).finally(() => setBirthdaysLoading(false));
  }, [activeCategory]);

  // Fetch promos when Promotions tab is active
  useEffect(() => {
    if (activeCategory !== 'Promotions') return;
    setPromosLoading(true);
    promosApi.list({ page: 1, limit: 50 })
      .then((res) => setPromos(res.data ?? []))
      .catch(() => setPromos([]))
      .finally(() => setPromosLoading(false));
  }, [activeCategory]);

  // Fetch posts only for non-Workouts categories when tab has no cached data
  useEffect(() => {
    if (activeCategory === 'Workouts' || activeCategory === 'Birthdays' || activeCategory === 'Promotions') return;
    const key = getFeedCategoryKey(categoryToApi[activeCategory]);
    const hasCache = useFeedStore.getState().postsByCategory[key]?.posts?.length;
    if (!hasCache) fetchPosts(1, categoryToApi[activeCategory]);
  }, [activeCategory, fetchPosts]);

  // Fetch workouts when Workouts tab is active
  useEffect(() => {
    if (activeCategory !== 'Workouts') return;
    const category = workoutCategory === 'all' ? undefined : workoutCategory;
    fetchWorkouts({ page: 1, category });
  }, [activeCategory, workoutCategory]);

  const handleRefresh = useCallback(() => {
    if (activeCategory === 'Workouts') {
      const category = workoutCategory === 'all' ? undefined : workoutCategory;
      refreshWorkouts({ category });
    } else {
      refreshPosts(categoryApiParam);
    }
  }, [activeCategory, workoutCategory, categoryApiParam, refreshPosts, refreshWorkouts]);

  const handleLoadMore = useCallback(() => {
    if (activeCategory === 'Workouts') {
      if (workoutsLoading || workoutsPagination.page >= workoutsPagination.pages) return;
      const category = workoutCategory === 'all' ? undefined : workoutCategory;
      fetchWorkouts({ page: workoutsPagination.page + 1, category });
    } else {
      if (isLoading || pagination.page >= pagination.pages) return;
      fetchPosts(pagination.page + 1, categoryApiParam);
    }
  }, [
    activeCategory,
    workoutCategory,
    workoutsLoading,
    workoutsPagination,
    isLoading,
    pagination,
    categoryApiParam,
    fetchPosts,
    fetchWorkouts,
  ]);

  const handleCategoryChange = useCallback((cat: Category) => {
    setActiveCategory(cat);
  }, []);

  const renderWorkoutItem = useCallback(
    ({ item }: { item: Workout }) => {
      const diffConfig = (item.difficulty && DIFFICULTY_CONFIG[item.difficulty]) || DIFFICULTY_CONFIG.beginner;
      return (
        <Card
          style={styles.workoutCard}
          onPress={() => router.push(`/(app)/(health)/workout/${item._id}` as any)}
        >
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={styles.workoutImage}
              contentFit="cover"
              transition={200}
            />
          )}
          <View style={styles.workoutContent}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Badge text={item.difficulty} variant={diffConfig.variant} size="sm" />
            </View>
            {item.description && (
              <Text style={styles.workoutDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.metaText}>{item.duration} min</Text>
              </View>
              {item.caloriesBurn != null && (
                <View style={styles.metaItem}>
                  <Ionicons name="flame-outline" size={14} color={colors.status.warning} />
                  <Text style={styles.metaText}>{item.caloriesBurn} cal</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="barbell-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.metaText}>{item.exercises?.length ?? 0} exercises</Text>
              </View>
            </View>
            {item.tags?.length ? (
              <View style={styles.tagRow}>
                {item.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Card>
      );
    },
    [router],
  );

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onPress={() => router.push(`/(app)/(feed)/${item._id}`)}
        onLike={() => likePost(item._id)}
        onComment={() => router.push(`/(app)/(feed)/${item._id}`)}
        onShare={() => {
          Share.share({
            message: item.content
              ? `${item.content} — shared from REAUX Labs`
              : 'Check out this post on REAUX Labs!',
          });
        }}
      />
    ),
    [router, likePost],
  );

  const renderFooter = useCallback(() => {
    if (!isLoading || posts.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary.yellow} />
      </View>
    );
  }, [isLoading, posts.length]);

  return (
    <SafeScreen>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>
          {isAdmin && (activeCategory === 'Members' || activeCategory === 'Birthdays' || activeCategory === 'Promotions')
            ? activeCategory
            : 'Feed'}
        </Text>
        {isAdmin && (
          <View style={styles.headerActions}>
            {activeCategory === 'Members' && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    useUIStore.getState().showToast('Generating PDF...', 'info');
                    await exportUsersPDF(adminUsers);
                  } catch {
                    showAppAlert('Error', 'Failed to export PDF');
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="download-outline" size={26} color={colors.text.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={activeCategory === 'Members'
                ? () => router.push({ pathname: '/(app)/(admin)/users/create', params: { backRoute: 'feed' } })
                : handleAdminAdd
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={activeCategory === 'Members' ? 'person-add-outline' : 'add-circle-outline'}
                size={28}
                color={colors.text.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Category tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {visibleCategories.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => handleCategoryChange(cat)}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed list, Members list, or Workout list */}
      <View style={styles.listContainer}>
        {activeCategory === 'Members' ? (
          <View style={styles.membersContainer}>
            {/* Fee Summary Cards — tappable, navigate to fees screen with filter */}
            <View style={styles.feeSummaryRow}>
              <TouchableOpacity
                style={[styles.feeSummaryCard, styles.feeSummaryCardPending]}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/(app)/(admin)/fees', params: { tab: 'pending', backRoute: 'feed' } })}
              >
                <Ionicons name="alert-circle-outline" size={22} color={colors.status.error} />
                <Text style={styles.feeSummaryLabel}>Pending</Text>
                <Text style={[styles.feeSummaryValue, { color: colors.status.error }]}>
                  {formatCurrency(feeSummary.totalPending)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feeSummaryCard, styles.feeSummaryCardPaid]}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/(app)/(admin)/fees', params: { tab: 'paid', backRoute: 'feed' } })}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color={colors.status.success} />
                <Text style={styles.feeSummaryLabel}>Collected</Text>
                <Text style={[styles.feeSummaryValue, { color: colors.status.success }]}>
                  {formatCurrency(feeSummary.totalPaid)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feeSummaryCard, styles.feeSummaryCardUpcoming]}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/(app)/(admin)/fees', params: { tab: 'upcoming', backRoute: 'feed' } })}
              >
                <Ionicons name="time-outline" size={22} color={colors.status.warning} />
                <Text style={styles.feeSummaryLabel}>Upcoming</Text>
                <Text style={[styles.feeSummaryValue, { color: colors.status.warning }]}>
                  {feeSummary.upcomingCount}
                </Text>
              </TouchableOpacity>
            </View>

            {feeSummary.totalCredit > 0 && (
              <TouchableOpacity
                style={styles.creditSummaryBanner}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/(app)/(admin)/fees', params: { tab: 'credit', backRoute: 'feed' } })}
              >
                <Ionicons name="wallet-outline" size={20} color={colors.status.info} />
                <Text style={styles.creditSummaryLabel}>Member Credit</Text>
                <Text style={[styles.feeSummaryValue, { color: colors.status.info }]}>
                  {formatCurrency(feeSummary.totalCredit)}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.membersSearchContainer}>
              <SearchBar
                value={memberSearch}
                onChangeText={setMemberSearch}
                placeholder="Search members..."
              />
            </View>
            {usersLoading && adminUsers.length === 0 ? (
              <View style={styles.workoutLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.yellow} />
              </View>
            ) : (
              <FlatList
                data={adminUsers.filter((u: User) =>
                  !memberSearch ||
                  u.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                  u.email?.toLowerCase().includes(memberSearch.toLowerCase())
                )}
                keyExtractor={(item: User) => item._id}
                renderItem={({ item }: { item: User }) => (
                  <UserCard
                    user={item}
                    onPress={(u: User) => router.push({ pathname: '/(app)/(admin)/users/[id]', params: { id: u._id, backRoute: 'feed' } })}
                  />
                )}
                contentContainerStyle={styles.membersListContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={false}
                    onRefresh={() => fetchUsers(1)}
                    tintColor={colors.primary.yellow}
                  />
                }
                onEndReached={() => {
                  if (!usersLoading && usersPagination.page < usersPagination.pages) {
                    fetchUsers(usersPagination.page + 1);
                  }
                }}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                  <EmptyState
                    icon="people-outline"
                    title="No members found"
                    message="Try adjusting your search"
                  />
                }
                ListFooterComponent={
                  usersLoading && adminUsers.length > 0 ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={colors.primary.yellow} />
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        ) : activeCategory === 'Workouts' ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.workoutCategoryRow}
              style={styles.workoutCategoryScroll}
            >
              {WORKOUT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.workoutCategoryChip, workoutCategory === cat.key && styles.workoutCategoryChipActive]}
                  onPress={() => setWorkoutCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.workoutCategoryText,
                      workoutCategory === cat.key && styles.workoutCategoryTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {workoutsLoading && workouts.length === 0 ? (
              <View style={styles.workoutLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.yellow} />
              </View>
            ) : !workoutsLoading && workouts.length === 0 ? (
              <EmptyState
                icon="barbell-outline"
                title="No workouts found"
                message="Check back later for new workout plans"
                actionLabel={isAdmin ? 'Add content' : undefined}
                onAction={isAdmin ? handleAdminAdd : undefined}
              />
            ) : (
              <FlashList
                data={workouts}
                renderItem={renderWorkoutItem}
                estimatedItemSize={200}
                keyExtractor={(item) => item._id}
                contentContainerStyle={[styles.listContent, styles.workoutListContent]}
                onRefresh={handleRefresh}
                refreshing={workoutsRefreshing}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  workoutsLoading && workouts.length > 0 ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={colors.primary.yellow} />
                    </View>
                  ) : null
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        ) : activeCategory === 'Birthdays' ? (
          <ScrollView
            style={styles.birthdayScroll}
            contentContainerStyle={styles.birthdayContent}
            showsVerticalScrollIndicator={false}
          >
            {birthdaysLoading ? (
              <View style={styles.workoutLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.yellow} />
              </View>
            ) : (
              <>
                {/* Today's Birthdays */}
                <Text style={styles.birthdaySectionTitle}>
                  <Ionicons name="gift-outline" size={18} color={colors.primary.yellowDark} />{' '}
                  Today&apos;s Birthdays
                </Text>
                {todayBirthdays.length === 0 ? (
                  <View style={styles.birthdayEmpty}>
                    <Text style={styles.birthdayEmptyText}>No birthdays today</Text>
                  </View>
                ) : (
                  todayBirthdays.map((b) => (
                    <View key={b._id} style={styles.birthdayCard}>
                      <Avatar uri={b.avatar} name={b.name} size={44} />
                      <View style={styles.birthdayInfo}>
                        <Text style={styles.birthdayName}>{b.name}</Text>
                        <Text style={styles.birthdayEmail}>{b.email}</Text>
                        {b.gymId && typeof b.gymId === 'object' && (
                          <Text style={styles.birthdayGym}>{b.gymId.name}</Text>
                        )}
                      </View>
                      <View style={styles.birthdayBadge}>
                        <Ionicons name="gift" size={20} color={colors.primary.yellowDark} />
                        <Text style={styles.birthdayBadgeText}>Today!</Text>
                      </View>
                    </View>
                  ))
                )}

                {/* Upcoming Birthdays */}
                <Text style={[styles.birthdaySectionTitle, { marginTop: spacing.xl }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />{' '}
                  Upcoming (Next 30 Days)
                </Text>
                {upcomingBirthdays.length === 0 ? (
                  <View style={styles.birthdayEmpty}>
                    <Text style={styles.birthdayEmptyText}>No upcoming birthdays</Text>
                  </View>
                ) : (
                  upcomingBirthdays.map((b) => (
                    <View key={b._id} style={styles.birthdayCard}>
                      <Avatar uri={b.avatar} name={b.name} size={44} />
                      <View style={styles.birthdayInfo}>
                        <Text style={styles.birthdayName}>{b.name}</Text>
                        <Text style={styles.birthdayEmail}>{b.email}</Text>
                        {b.gymId && typeof b.gymId === 'object' && (
                          <Text style={styles.birthdayGym}>{b.gymId.name}</Text>
                        )}
                      </View>
                      <View style={styles.birthdayDaysLeft}>
                        <Text style={styles.birthdayDaysNum}>{b.daysUntil}</Text>
                        <Text style={styles.birthdayDaysLabel}>
                          {b.daysUntil === 1 ? 'day' : 'days'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        ) : activeCategory === 'Promotions' ? (
          <ScrollView
            style={styles.birthdayScroll}
            contentContainerStyle={styles.birthdayContent}
            showsVerticalScrollIndicator={false}
          >
            {promosLoading ? (
              <View style={styles.workoutLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.yellow} />
              </View>
            ) : promos.length === 0 ? (
              <EmptyState
                icon="pricetag-outline"
                title="No promotions"
                message="Create promo codes from the admin panel"
                actionLabel="Create Promo"
                onAction={() => router.push('/(app)/(admin)/promo/create' as any)}
              />
            ) : (
              <>
                <View style={styles.promoHeader}>
                  <Text style={styles.birthdaySectionTitle}>Active Promotions</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(app)/(admin)/promo/create' as any)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary.yellowDark} />
                  </TouchableOpacity>
                </View>
                {promos.map((promo) => {
                  const isActive = promo.isActive !== false &&
                    (!promo.validUntil || new Date(promo.validUntil) > new Date()) &&
                    (promo.usageLimit == null || (promo.usedCount ?? 0) < promo.usageLimit);
                  return (
                    <TouchableOpacity
                      key={promo._id}
                      style={[styles.promoCard, !isActive && styles.promoCardInactive]}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/(app)/(admin)/promo/review?id=${promo._id}` as any)}
                    >
                      <View style={styles.promoTopRow}>
                        <View style={styles.promoCodeBadge}>
                          <Ionicons name="pricetag" size={16} color={colors.primary.yellowDark} />
                          <Text style={styles.promoCodeText}>{promo.code}</Text>
                        </View>
                        <Badge
                          text={isActive ? 'Active' : 'Expired'}
                          variant={isActive ? 'success' : 'default'}
                          size="sm"
                        />
                      </View>
                      <View style={styles.promoDetails}>
                        <Text style={styles.promoDiscount}>
                          {promo.discountType === 'percentage'
                            ? `${promo.discountValue}% off`
                            : `${formatCurrency(promo.discountValue)} off`}
                        </Text>
                        {promo.minOrderAmount != null && promo.minOrderAmount > 0 && (
                          <Text style={styles.promoMeta}>
                            Min order: {formatCurrency(promo.minOrderAmount)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.promoFooter}>
                        <Text style={styles.promoMeta}>
                          Used: {promo.usedCount ?? 0}{promo.usageLimit != null ? ` / ${promo.usageLimit}` : ''}
                        </Text>
                        {promo.validUntil && (
                          <Text style={styles.promoMeta}>
                            Expires: {formatDate(promo.validUntil)}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>
        ) : isLoading && posts.length === 0 ? (
          <ScrollView style={styles.skeletonScroll} contentContainerStyle={styles.listContent}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} style={{ marginBottom: spacing.lg }} />
            ))}
          </ScrollView>
        ) : !isLoading && posts.length === 0 && !error ? (
          <EmptyState
            icon="newspaper-outline"
            title="No posts yet"
            message={isAdmin ? "Be the first to share something with the community." : "Check back later for new posts."}
            actionLabel={isAdmin ? "Add content" : undefined}
            onAction={isAdmin ? handleAdminAdd : undefined}
          />
        ) : (
          <FlashList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB - Admin: New Post or New Workout Plan (hidden on Members/Birthdays/Promotions tabs) */}
      {isAdmin && activeCategory !== 'Members' && activeCategory !== 'Birthdays' && activeCategory !== 'Promotions' && (
        <Pressable
          onPress={handleAdminAdd}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
        >
          <Animated.View style={[styles.fab, fabAnimatedStyle]}>
            <Ionicons name="add" size={28} color={colors.text.onPrimary} />
          </Animated.View>
        </Pressable>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
  },

  // Category tabs
  tabsWrapper: {
    paddingBottom: spacing.sm,
  },
  tabsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  tabActive: {
    backgroundColor: colors.primary.yellow,
  },
  tabText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.onPrimary,
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  skeletonScroll: {
    flex: 1,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },

  // Members tab
  membersContainer: {
    flex: 1,
  },
  feeSummaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  feeSummaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.card,
    backgroundColor: colors.background.white,
    ...shadows.card,
    gap: 2,
  },
  feeSummaryCardPending: {
    borderBottomWidth: 3,
    borderBottomColor: colors.status.error,
  },
  feeSummaryCardPaid: {
    borderBottomWidth: 3,
    borderBottomColor: colors.status.success,
  },
  feeSummaryCardUpcoming: {
    borderBottomWidth: 3,
    borderBottomColor: colors.status.warning,
  },
  feeSummaryLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  feeSummaryValue: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  creditSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.card,
    backgroundColor: colors.background.white,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.info,
    ...shadows.card,
    gap: spacing.sm,
  },
  creditSummaryLabel: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  membersSearchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  membersListContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  // Workouts tab
  workoutCategoryScroll: {
    flexGrow: 0,
  },
  workoutCategoryRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  workoutCategoryChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  workoutCategoryChipActive: {
    backgroundColor: colors.background.dark,
  },
  workoutCategoryText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  workoutCategoryTextActive: {
    color: colors.text.white,
  },
  workoutListContent: {
    paddingHorizontal: spacing.xl,
  },
  workoutLoadingContainer: {
    flex: 1,
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  workoutCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  workoutImage: {
    width: '100%',
    height: 160,
  },
  workoutContent: {
    padding: spacing.lg,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  workoutTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text.primary,
  },
  workoutDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.text.secondary,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.tag,
  },
  tagText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.text.secondary,
  },

  // Birthdays tab
  birthdayScroll: {
    flex: 1,
  },
  birthdayContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  birthdaySectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  birthdayEmpty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  birthdayEmptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.light,
  },
  birthdayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    backgroundColor: colors.background.white,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  birthdayInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  birthdayName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.text.primary,
  },
  birthdayEmail: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 1,
  },
  birthdayGym: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.text.light,
    marginTop: 2,
  },
  birthdayBadge: {
    alignItems: 'center',
    gap: 2,
  },
  birthdayBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.primary.yellowDark,
  },
  birthdayDaysLeft: {
    alignItems: 'center',
    minWidth: 44,
  },
  birthdayDaysNum: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text.primary,
  },
  birthdayDaysLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.text.secondary,
  },

  // Promotions tab
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  promoCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    backgroundColor: colors.background.white,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  promoCardInactive: {
    opacity: 0.6,
  },
  promoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  promoCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary.yellowLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  promoCodeText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  promoDetails: {
    marginBottom: spacing.sm,
  },
  promoDiscount: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.text.primary,
  },
  promoMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  promoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
});
