import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Avatar } from '../../../src/components/ui/Avatar';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { usersApi } from '../../../src/api/endpoints/users';
import { colors, fontFamily, spacing, borderRadius } from '../../../src/theme';
import type { BirthdayUser, UpcomingBirthdayUser } from '../../../src/types/models';

interface MenuItemProps {
  label: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
  </TouchableOpacity>
);

export default function AdminDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSuperadmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const adminGymId = user?.gymId
    ? typeof user.gymId === 'string'
      ? user.gymId
      : user.gymId._id
    : '';

  const [todayBirthdays, setTodayBirthdays] = useState<BirthdayUser[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthdayUser[]>([]);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const [todayRes, upcomingRes] = await Promise.all([
          usersApi.getTodayBirthdays(),
          usersApi.getUpcomingBirthdays(7),
        ]);
        const todayList = todayRes.data ?? [];
        setTodayBirthdays(todayList);
        const todayIds = new Set(todayList.map((u) => u._id));
        setUpcomingBirthdays(
          (upcomingRes.data ?? []).filter((u) => u.daysUntil > 0 && !todayIds.has(u._id)),
        );
      } catch {
        // Silently fail — not critical
      }
    };
    fetchBirthdays();
  }, []);

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Admin Panel" />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <Avatar uri={user?.avatar} name={user?.name} size={64} />
            <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
            <Text style={styles.userRole}>{user?.role || 'admin'}</Text>
          </View>

          {/* Birthdays */}
          {(todayBirthdays.length > 0 || upcomingBirthdays.length > 0) && (
            <View style={styles.navigationSection}>
              <Text style={styles.sectionTitle}>Birthdays</Text>

              {/* Today's Birthdays */}
              {todayBirthdays.length > 0 && (
                <View style={[styles.menuCard, { marginBottom: upcomingBirthdays.length > 0 ? spacing.md : 0 }]}>
                  <View style={styles.birthdayHeader}>
                    <Ionicons name="gift-outline" size={18} color={colors.status.warning} />
                    <Text style={styles.birthdayHeaderText}>Today</Text>
                  </View>
                  {todayBirthdays.map((b, i) => (
                    <View key={b._id}>
                      {i > 0 && <View style={styles.divider} />}
                      <View style={styles.birthdayItem}>
                        <Avatar uri={b.avatar} name={b.name} size={36} />
                        <View style={styles.birthdayInfo}>
                          <Text style={styles.birthdayName}>{b.name}</Text>
                          {b.gymId?.name && (
                            <Text style={styles.birthdayGym}>{b.gymId.name}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Upcoming Birthdays */}
              {upcomingBirthdays.length > 0 && (
                <View style={styles.menuCard}>
                  <View style={styles.birthdayHeader}>
                    <Ionicons name="calendar-outline" size={18} color={colors.status.info} />
                    <Text style={styles.birthdayHeaderText}>Upcoming</Text>
                  </View>
                  {upcomingBirthdays.map((b, i) => (
                    <View key={b._id}>
                      {i > 0 && <View style={styles.divider} />}
                      <View style={styles.birthdayItem}>
                        <Avatar uri={b.avatar} name={b.name} size={36} />
                        <View style={styles.birthdayInfo}>
                          <Text style={styles.birthdayName}>{b.name}</Text>
                          {b.gymId?.name && (
                            <Text style={styles.birthdayGym}>{b.gymId.name}</Text>
                          )}
                        </View>
                        <View style={styles.daysUntilBadge}>
                          <Text style={styles.daysUntilText}>
                            {b.daysUntil === 1 ? 'Tomorrow' : `In ${b.daysUntil} days`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Superadmin: Gym Management */}
          {isSuperadmin && (
            <View style={styles.navigationSection}>
              <Text style={styles.sectionTitle}>Superadmin</Text>
              <View style={styles.menuCard}>
                <MenuItem
                  label="Manage Gyms"
                  onPress={() => router.push('/(app)/(admin)/gyms')}
                />
              </View>
            </View>
          )}

          {/* Admin: My Gym */}
          {isAdmin && adminGymId ? (
            <View style={styles.navigationSection}>
              <Text style={styles.sectionTitle}>My Gym</Text>
              <View style={styles.menuCard}>
                <MenuItem
                  label="Edit My Gym"
                  onPress={() => router.push(`/(app)/(admin)/gyms/${adminGymId}`)}
                />
              </View>
            </View>
          ) : null}

          {/* Shop Management */}
          <View style={styles.navigationSection}>
            <Text style={styles.sectionTitle}>Shop</Text>
            <View style={styles.menuCard}>
              <MenuItem
                label="Manage Products"
                onPress={() => router.push('/(app)/(admin)/products')}
              />
              <View style={styles.divider} />
              <MenuItem
                label="Manage Orders"
                onPress={() => router.push('/(app)/(admin)/orders')}
              />
            </View>
          </View>

          {/* Admin Navigation */}
          <View style={styles.navigationSection}>
            <Text style={styles.sectionTitle}>Management</Text>
            <View style={styles.menuCard}>
              <MenuItem
                label="Analytics"
                onPress={() => router.push('/(app)/(admin)/analytics')}
              />
              <View style={styles.divider} />
              <MenuItem
                label="Sales Report"
                onPress={() => router.push('/(app)/(admin)/sales-report')}
              />
              <View style={styles.divider} />
              <MenuItem
                label="Gym Members"
                onPress={() => router.push('/(app)/(admin)/memberships/gym-members')}
              />
              <View style={styles.divider} />
              <MenuItem
                label="Manage Memberships"
                onPress={() => router.push('/(app)/(admin)/manage-memberships')}
              />
              <View style={styles.divider} />
              <MenuItem
                label="User Management"
                onPress={() => router.push('/(app)/(admin)/users')}
              />
              <View style={styles.divider} />
              <MenuItem
                label="Manage Challenges"
                onPress={() => router.push('/(app)/(admin)/challenges')}
              />
              <View style={styles.divider} />
              <MenuItem
                label="Promo Banners"
                onPress={() => router.push('/(app)/(admin)/promo/past')}
              />
              <View style={styles.divider} />
              <MenuItem
                label="Contact Us"
                onPress={() => router.push('/(app)/(profile)/contact')}
              />
            </View>
          </View>

          {/* Legal Section - Hidden for now */}
          {/* <View style={styles.navigationSection}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <View style={styles.menuCard}>
              <MenuItem
                label="Privacy Policy"
                onPress={() => {}}
              />
              <View style={styles.divider} />
              <MenuItem
                label="Terms and Conditions"
                onPress={() => {}}
              />
              <View style={styles.divider} />
              <MenuItem
                label="Cancellation and Refund"
                onPress={() => {}}
              />
              <View style={styles.divider} />
              <MenuItem
                label="User Data Policy"
                onPress={() => {}}
              />
            </View>
          </View> */}
        </ScrollView>
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  userName: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  userRole: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  navigationSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  menuCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  menuLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.lg,
  },
  birthdayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  birthdayHeaderText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  birthdayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  birthdayInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  birthdayName: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  birthdayGym: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
    marginTop: 1,
  },
  daysUntilBadge: {
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  daysUntilText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.text.secondary,
  },
});
