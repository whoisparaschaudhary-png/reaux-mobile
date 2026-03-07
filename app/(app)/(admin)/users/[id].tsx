import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Avatar } from '../../../../src/components/ui/Avatar';
import { Badge } from '../../../../src/components/ui/Badge';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { usersApi } from '../../../../src/api/endpoints/users';
import { gymsApi } from '../../../../src/api/endpoints/gyms';
import { useAuthStore } from '../../../../src/stores/useAuthStore';
import { useUIStore, showAppAlert } from '../../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius, typography } from '../../../../src/theme';
import type { User, Role, Gym } from '../../../../src/types/models';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [selectedRole, setSelectedRole] = useState<Role>('user');
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoadingGyms, setIsLoadingGyms] = useState(false);
  const [showGymPicker, setShowGymPicker] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await usersApi.getUserById(id);
        const u = res.data;
        setUser(u);
        setSelectedRole(u.role);
        setSelectedGymId(
          u.gymId ? (typeof u.gymId === 'string' ? u.gymId : u.gymId._id) : '',
        );
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

  const userGymName = user?.gymId
    ? typeof user.gymId === 'string'
      ? gyms.find((g) => g._id === user.gymId)?.name || 'Unknown Gym'
      : (user.gymId as Gym).name
    : 'No gym assigned';

  const selectedGymName =
    gyms.find((g) => g._id === selectedGymId)?.name ||
    (user?.gymId && typeof user.gymId !== 'string'
      ? (user.gymId as Gym).name
      : '');

  const hasChanges =
    user &&
    (selectedRole !== user.role ||
      selectedGymId !==
        (user.gymId
          ? typeof user.gymId === 'string'
            ? user.gymId
            : user.gymId._id
          : ''));

  const handleSave = async () => {
    if (!user || !id) return;
    setIsSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (selectedRole !== user.role) payload.role = selectedRole;
      if (
        selectedGymId !==
        (user.gymId
          ? typeof user.gymId === 'string'
            ? user.gymId
            : user.gymId._id
          : '')
      ) {
        payload.gymId = selectedGymId;
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
          <Header title="User Details" showBack onBack={() => router.back()} />
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
          <Header title="User Details" showBack onBack={() => router.back()} />
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
        <Header title="User Details" showBack onBack={() => router.back()} />

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

          {/* User Info (read-only) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Email" value={user.email} />
              <View style={styles.infoDivider} />
              <InfoRow label="Phone" value={user.phone || 'Not provided'} />
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
              <View style={styles.infoDivider} />
              <InfoRow
                label="Current Gym"
                value={userGymName}
              />
            </View>
          </View>

          {/* Gym Assignment - Superadmin only */}
          {isSuperAdmin && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gym Assignment</Text>
              <Text style={styles.sectionDescription}>
                Change the gym this user belongs to
              </Text>

              {isLoadingGyms ? (
                <View style={styles.gymLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary.yellow} />
                  <Text style={styles.gymLoadingText}>Loading gyms...</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.gymSelector, showGymPicker && styles.gymSelectorActive]}
                    onPress={() => setShowGymPicker(!showGymPicker)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="fitness-outline"
                      size={20}
                      color={selectedGymId ? colors.text.primary : colors.text.light}
                      style={{ marginRight: spacing.md }}
                    />
                    <Text
                      style={[
                        styles.gymSelectorText,
                        !selectedGymId && styles.gymSelectorPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedGymName || 'Select a gym'}
                    </Text>
                    <Ionicons
                      name={showGymPicker ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.text.secondary}
                    />
                  </TouchableOpacity>

                  {showGymPicker && (
                    <View style={styles.gymList}>
                      {/* No gym option */}
                      <TouchableOpacity
                        style={[styles.gymItem, !selectedGymId && styles.gymItemActive]}
                        onPress={() => {
                          setSelectedGymId('');
                          setShowGymPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.gymItemName,
                            !selectedGymId && styles.gymItemNameActive,
                          ]}
                        >
                          No gym
                        </Text>
                        {!selectedGymId && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary.yellow} />
                        )}
                      </TouchableOpacity>
                      {gyms.map((gym) => (
                        <TouchableOpacity
                          key={gym._id}
                          style={[
                            styles.gymItem,
                            selectedGymId === gym._id && styles.gymItemActive,
                          ]}
                          onPress={() => {
                            setSelectedGymId(gym._id);
                            setShowGymPicker(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.gymItemName,
                                selectedGymId === gym._id && styles.gymItemNameActive,
                              ]}
                            >
                              {gym.name}
                            </Text>
                            {gym.address?.city && (
                              <Text style={styles.gymItemCity}>{gym.address.city}</Text>
                            )}
                          </View>
                          {selectedGymId === gym._id && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary.yellow} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
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
    fontSize: 16,
    color: colors.text.secondary,
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
    fontSize: 12,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 14,
    color: colors.text.secondary,
  },
  infoValue: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
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
    fontSize: 16,
    lineHeight: 22,
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
    fontSize: 14,
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
  gymSelectorActive: {
    borderColor: colors.primary.yellow,
  },
  gymSelectorText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.text.primary,
  },
  gymSelectorPlaceholder: {
    color: colors.text.light,
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
    fontSize: 15,
    color: colors.text.primary,
  },
  gymItemNameActive: {
    fontFamily: fontFamily.bold,
  },
  gymItemCity: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  saveContainer: {
    marginBottom: spacing.lg,
  },
  statusSection: {
    marginBottom: spacing.xxl,
  },
});
