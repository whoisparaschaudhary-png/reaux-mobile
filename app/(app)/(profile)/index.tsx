import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { showAppAlert } from '../../../src/stores/useUIStore';
import { useNotificationStore } from '../../../src/stores/useNotificationStore';
import { usersApi } from '../../../src/api/endpoints/users';
import { useImagePicker } from '../../../src/hooks/useImagePicker';
import {
  colors,
  typography,
  fontFamily,
  spacing,
  borderRadius,
  layout,
} from '../../../src/theme';
import type { Gym, BirthdayUser, UpcomingBirthdayUser } from '../../../src/types/models';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const uploadAvatarAction = useAuthStore((s) => s.uploadAvatar);
  const isLoading = useAuthStore((s) => s.isLoading);
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const getUnreadCount = useNotificationStore((s) => s.getUnreadCount);
  const { pickImage } = useImagePicker();

  const [name, setName] = useState(user?.name || '');
  const [hasChanges, setHasChanges] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperadmin = user?.role === 'superadmin';
  const gym = typeof user?.gymId === 'object' ? (user.gymId as Gym) : null;

  const [todayBirthdays, setTodayBirthdays] = useState<BirthdayUser[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthdayUser[]>([]);

  // Fetch unread notification count on mount
  useEffect(() => {
    getUnreadCount();
  }, [getUnreadCount]);

  // Fetch birthdays for admin/superadmin
  useEffect(() => {
    if (!isAdmin) return;
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
        // Silently fail
      }
    };
    fetchBirthdays();
  }, [isAdmin]);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      setHasChanges(value !== (user?.name || ''));
    },
    [user?.name],
  );

  const handleSave = async () => {
    try {
      await updateProfile({ name });
      setHasChanges(false);
      showAppAlert('Success', 'Profile updated successfully');
    } catch {
      showAppAlert('Error', 'Failed to update profile');
    }
  };

  const handleUploadAvatar = async () => {
    const result = await pickImage();
    if (result) {
      try {
        await uploadAvatarAction(result.uri, result.type, result.fileName);
        showAppAlert('Success', 'Profile picture updated');
      } catch {
        showAppAlert('Error', 'Failed to upload profile picture');
      }
    }
  };

  const handleLogout = () => {
    showAppAlert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeScreen>
      <Header
        title="Profile"
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/(app)/(profile)/notifications')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.headerBellWrapper}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(app)/(profile)/edit')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Avatar
            uri={user?.avatar}
            name={user?.name}
            size={100}
          />
          <TouchableOpacity onPress={handleUploadAvatar}>
            <Text style={styles.uploadLink}>Upload</Text>
          </TouchableOpacity>
          <Text style={styles.uploadHint}>
            Tap to upload / change your account profile picture
          </Text>
        </View>

        {/* Personal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal</Text>
          <Input
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={handleNameChange}
          />
          <View style={styles.fieldSpacing} />
          <Input
            label="Email"
            placeholder="Email address"
            value={user?.email || ''}
            onChangeText={() => {}}
            keyboardType="email-address"
            style={styles.readOnlyField}
          />
          <Text style={styles.readOnlyHint}>Email cannot be changed</Text>
        </View>

        {/* Contact Information - Phone is compulsory at registration and non-editable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Input
            label="Phone"
            placeholder="Phone number"
            value={user?.phone ? `+91 ${user.phone}` : '—'}
            onChangeText={() => {}}
            keyboardType="phone-pad"
            style={styles.readOnlyField}
          />
          <Text style={styles.readOnlyHint}>Phone cannot be changed</Text>
        </View>

        {/* Gym Details - All users with gym assignment */}
        {gym && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gym Details</Text>

            {/* Gym Logo/Image */}
            {(gym.logo || (gym.images && gym.images.length > 0)) && (
              <View style={styles.gymImageContainer}>
                <Image
                  source={{ uri: gym.logo || gym.images[0] }}
                  style={styles.gymImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            )}

            <Input
              label="Gym Name"
              placeholder="Gym name"
              value={gym.name || ''}
              onChangeText={() => {}}
              style={styles.readOnlyField}
            />
            <View style={styles.fieldSpacing} />
            <Input
              label="Location"
              placeholder="Location"
              value={
                [gym.address?.city, gym.address?.state]
                  .filter(Boolean)
                  .join(', ') || ''
              }
              onChangeText={() => {}}
              style={styles.readOnlyField}
            />
            <View style={styles.fieldSpacing} />
            <Input
              label="Email"
              placeholder="Gym email"
              value={gym.email || ''}
              onChangeText={() => {}}
              style={styles.readOnlyField}
            />
            <View style={styles.fieldSpacing} />
            <Input
              label="Phone"
              placeholder="Gym phone"
              value={gym.phone || ''}
              onChangeText={() => {}}
              style={styles.readOnlyField}
            />
          </View>
        )}

        {/* Admin Panel - Superadmin Only */}
        {isSuperadmin && (
          <Card
            style={styles.linkCard}
            onPress={() => router.push('/(app)/(admin)')}
          >
            <View style={styles.linkCardContent}>
              <View style={styles.linkCardLeft}>
                <Ionicons
                  name="shield-outline"
                  size={22}
                  color={colors.text.primary}
                />
                <View style={styles.linkCardText}>
                  <Text style={styles.linkCardTitle}>Admin Panel</Text>
                  <Text style={styles.linkCardSubtitle}>
                    Manage gyms, products, users, and more
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.light}
              />
            </View>
          </Card>
        )}

        {/* User Management - Admin */}
        {isAdmin && (
          <Card
            style={styles.linkCard}
            onPress={() => router.push({ pathname: '/(app)/(admin)/users', params: { backRoute: 'profile' } })}
          >
            <View style={styles.linkCardContent}>
              <View style={styles.linkCardLeft}>
                <Ionicons
                  name="person-add-outline"
                  size={22}
                  color={colors.text.primary}
                />
                <View style={styles.linkCardText}>
                  <Text style={styles.linkCardTitle}>User Management</Text>
                  <Text style={styles.linkCardSubtitle}>
                    Add and manage users
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.light}
              />
            </View>
          </Card>
        )}

        {/* My Gym - Admin with gym */}
        {isAdmin && !isSuperadmin && gym && (
          <Card
            style={styles.linkCard}
            onPress={() => router.push({ pathname: '/(app)/(admin)/gyms/[id]', params: { id: gym._id, backRoute: 'profile' } })}
          >
            <View style={styles.linkCardContent}>
              <View style={styles.linkCardLeft}>
                <Ionicons
                  name="fitness-outline"
                  size={22}
                  color={colors.text.primary}
                />
                <View style={styles.linkCardText}>
                  <Text style={styles.linkCardTitle}>Edit My Gym</Text>
                  <Text style={styles.linkCardSubtitle}>
                    Update gym details, images, and amenities
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.light}
              />
            </View>
          </Card>
        )}

        {/* My Orders */}
        {isAdmin && !isSuperadmin && (
          <Card
            style={styles.linkCard}
            onPress={() => router.push({ pathname: '/(app)/(shop)/orders', params: { backRoute: 'profile' } })}
          >
            <View style={styles.linkCardContent}>
              <View style={styles.linkCardLeft}>
                <Ionicons
                  name="bag-outline"
                  size={22}
                  color={colors.text.primary}
                />
                <View style={styles.linkCardText}>
                  <Text style={styles.linkCardTitle}>My Orders</Text>
                  <Text style={styles.linkCardSubtitle}>
                    View all your past orders
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.light}
              />
            </View>
          </Card>
        )}

        {/* My Membership - Regular users and admins only (not superadmin) */}
        {!isSuperadmin && <Card
          style={styles.linkCard}
          onPress={() => router.push('/(app)/(profile)/memberships')}
        >
          <View style={styles.linkCardContent}>
            <View style={styles.linkCardLeft}>
              <Ionicons
                name="card-outline"
                size={22}
                color={colors.text.primary}
              />
              <View style={styles.linkCardText}>
                <Text style={styles.linkCardTitle}>My Membership</Text>
                <Text style={styles.linkCardSubtitle}>
                  View your membership status and details
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.light}
            />
          </View>
        </Card>}

        {/* Manage Memberships - Admin Only */}
        {isAdmin && (
          <Card
            style={styles.linkCard}
            onPress={() => router.push({ pathname: '/(app)/(admin)/manage-memberships', params: { backRoute: 'profile' } })}
          >
            <View style={styles.linkCardContent}>
              <View style={styles.linkCardLeft}>
                <Ionicons
                  name="people-outline"
                  size={22}
                  color={colors.text.primary}
                />
                <View style={styles.linkCardText}>
                  <Text style={styles.linkCardTitle}>Manage Memberships</Text>
                  <Text style={styles.linkCardSubtitle}>
                    Manage gym memberships and plans
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.light}
              />
            </View>
          </Card>
        )}

        {/* Birthdays - Admin Only */}
        {isAdmin && (todayBirthdays.length > 0 || upcomingBirthdays.length > 0) && (
          <View style={styles.birthdaySection}>
            <Text style={styles.birthdaySectionTitle}>Birthdays</Text>

            {/* Today's Birthdays */}
            {todayBirthdays.length > 0 && (
              <View style={[styles.birthdayCard, upcomingBirthdays.length > 0 && { marginBottom: spacing.sm }]}>
                <View style={styles.birthdayHeader}>
                  <Ionicons name="gift-outline" size={16} color={colors.status.warning} />
                  <Text style={styles.birthdayHeaderText}>Today</Text>
                </View>
                {todayBirthdays.map((b) => (
                  <View key={b._id} style={styles.birthdayItem}>
                    <Avatar uri={b.avatar} name={b.name} size={32} />
                    <View style={styles.birthdayInfo}>
                      <Text style={styles.birthdayName}>{b.name}</Text>
                      {b.gymId?.name && (
                        <Text style={styles.birthdayGym}>{b.gymId.name}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Upcoming Birthdays */}
            {upcomingBirthdays.length > 0 && (
              <View style={styles.birthdayCard}>
                <View style={styles.birthdayHeader}>
                  <Ionicons name="calendar-outline" size={16} color={colors.status.info} />
                  <Text style={styles.birthdayHeaderText}>Upcoming</Text>
                </View>
                {upcomingBirthdays.map((b) => (
                  <View key={b._id} style={styles.birthdayItem}>
                    <Avatar uri={b.avatar} name={b.name} size={32} />
                    <View style={styles.birthdayInfo}>
                      <Text style={styles.birthdayName}>{b.name}</Text>
                      {b.gymId?.name && (
                        <Text style={styles.birthdayGym}>{b.gymId.name}</Text>
                      )}
                    </View>
                    <Text style={styles.daysUntilText}>
                      {b.daysUntil === 1 ? 'Tomorrow' : `In ${b.daysUntil}d`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Notifications */}
        <Card
          style={styles.linkCard}
          onPress={() => router.push('/(app)/(profile)/notifications')}
        >
          <View style={styles.linkCardContent}>
            <View style={styles.linkCardLeft}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.text.primary}
              />
              <View style={styles.linkCardText}>
                <Text style={styles.linkCardTitle}>Notifications</Text>
                <Text style={styles.linkCardSubtitle}>
                  View all your notifications
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              )}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.light}
              />
            </View>
          </View>
        </Card>

        {/* Save Changes Button */}
        {hasChanges && (
          <View style={styles.saveButtonContainer}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            />
          </View>
        )}

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  gymImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  gymImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.card,
  },
  uploadLink: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.status.info,
    marginTop: spacing.md,
  },
  uploadHint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  fieldSpacing: {
    height: spacing.md,
  },
  readOnlyField: {
    opacity: 0.6,
  },
  readOnlyHint: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.light,
    marginTop: spacing.xs,
  },
  linkCard: {
    marginBottom: spacing.md,
  },
  linkCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkCardText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  linkCardTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  linkCardSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
    marginTop: 2,
  },
  birthdaySection: {
    marginBottom: spacing.md,
  },
  birthdaySectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  birthdayCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
  },
  birthdayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  birthdayHeaderText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  birthdayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  birthdayInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  birthdayName: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text.primary,
  },
  birthdayGym: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.text.secondary,
  },
  daysUntilText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.text.secondary,
  },
  notificationBadge: {
    backgroundColor: colors.status.error,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerBellWrapper: {
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.status.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 9,
    lineHeight: 12,
    color: colors.text.white,
  },
  saveButtonContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  logoutContainer: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
});
