import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { usersApi } from '../../../../src/api/endpoints/users';
import { gymsApi } from '../../../../src/api/endpoints/gyms';
import { useAuthStore } from '../../../../src/stores/useAuthStore';
import { useUIStore } from '../../../../src/stores/useUIStore';
import { isValidEmail, isValidIndianPhone, isValidName, isValidPassword, isValidDateOfBirth } from '../../../../src/utils/validators';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import type { Role, UserStatus, Gender, Gym } from '../../../../src/types/models';

const ROLES: { value: Role; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const STATUSES: { value: UserStatus; label: string; description: string }[] = [
  { value: 'active', label: 'Active', description: 'User can login and use the app' },
  { value: 'disabled', label: 'Disabled', description: 'User cannot login' },
];

export default function CreateUserScreen() {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('user');
  const [selectedGender, setSelectedGender] = useState<Gender>('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoadingGyms, setIsLoadingGyms] = useState(false);
  const [showGymPicker, setShowGymPicker] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>('active');
  const [isLoading, setIsLoading] = useState(false);

  // Determine admin's gym ID (could be string or Gym object)
  const adminGymId = currentUser?.gymId
    ? typeof currentUser.gymId === 'string'
      ? currentUser.gymId
      : currentUser.gymId._id
    : '';
  const adminGymName =
    currentUser?.gymId && typeof currentUser.gymId !== 'string'
      ? currentUser.gymId.name
      : '';
  const adminHasGym = !!adminGymId;

  useEffect(() => {
    if (isSuperAdmin) {
      // Superadmin needs the full gym list
      fetchGyms();
    } else if (adminHasGym) {
      // Admin with a gym — auto-select their gym
      setSelectedGymId(adminGymId);
    }
    // Admin without a gym — cannot create users, will see a message
  }, []);

  const fetchGyms = async () => {
    setIsLoadingGyms(true);
    try {
      const res = await gymsApi.list({ page: 1, limit: 100 });
      setGyms(res.data ?? []);
    } catch {
      showToast('Failed to load gyms', 'error');
    } finally {
      setIsLoadingGyms(false);
    }
  };

  const selectedGymName =
    adminHasGym && !isSuperAdmin
      ? adminGymName || 'Your Gym'
      : gyms.find((g) => g._id === selectedGymId)?.name || '';

  const handleCreate = async () => {
    if (!isValidName(name)) {
      showToast('Name must be at least 2 characters', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (!phone.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      showToast('Please enter a valid 10-digit Indian phone number', 'error');
      return;
    }

    if (!isValidPassword(password)) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (!isValidDateOfBirth(dateOfBirth)) {
      showToast('Please enter a valid date of birth (YYYY-MM-DD)', 'error');
      return;
    }

    if (!selectedGymId) {
      showToast('Please select a gym', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await usersApi.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role: isSuperAdmin ? selectedRole : 'user',
        gender: selectedGender,
        dateOfBirth: dateOfBirth.trim(),
        gymId: selectedGymId,
        status: selectedStatus,
      });
      showToast('User created successfully', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to create user', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Create User"
          showBack
          onBack={() => router.back()}
          rightAction={
            <TouchableOpacity
              onPress={handleCreate}
              disabled={isLoading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  styles.createButtonText,
                  isLoading && styles.createButtonTextDisabled,
                ]}
              >
                Create
              </Text>
            </TouchableOpacity>
          }
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>User Information</Text>

              <Input
                label="FULL NAME *"
                placeholder="Enter full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <View style={styles.inputSpacing} />

              <Input
                label="EMAIL *"
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.inputSpacing} />

              <Input
                label="PHONE *"
                placeholder="Enter phone number (10 digits)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <View style={styles.inputSpacing} />

              <Input
                label="PASSWORD *"
                placeholder="Create password (min 6 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Info</Text>

              <Text style={styles.fieldLabel}>GENDER *</Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    style={[
                      styles.genderChip,
                      selectedGender === g.value && styles.genderChipActive,
                    ]}
                    onPress={() => setSelectedGender(g.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        selectedGender === g.value && styles.genderChipTextActive,
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputSpacing} />

              <Input
                label="DATE OF BIRTH *"
                placeholder="YYYY-MM-DD"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {/* Role selector — only for superadmin (admins can only create regular users) */}
            {isSuperAdmin && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Role</Text>
                <Text style={styles.sectionDescription}>
                  Select the role for this user
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gym *</Text>
              {!isSuperAdmin && adminHasGym ? (
                // Admin with assigned gym — auto-selected, read-only
                <View style={[styles.roleCard, styles.roleCardActive]}>
                  <Ionicons
                    name="fitness-outline"
                    size={20}
                    color={colors.primary.dark}
                    style={{ marginRight: spacing.md }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleLabel, styles.roleLabelActive]}>
                      {selectedGymName}
                    </Text>
                    <Text style={styles.roleDescription}>
                      Your assigned gym — all users you create will belong to this gym
                    </Text>
                  </View>
                </View>
              ) : !isSuperAdmin && !adminHasGym ? (
                // Admin without a gym — cannot create users
                <View style={styles.gymNotice}>
                  <Ionicons name="warning-outline" size={18} color={colors.status.warning} />
                  <Text style={styles.gymNoticeText}>
                    You don't have a gym assigned. Please contact a superadmin to assign you to a gym before creating users.
                  </Text>
                </View>
              ) : isLoadingGyms ? (
                <View style={styles.gymLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary.yellow} />
                  <Text style={styles.gymLoadingText}>Loading gyms...</Text>
                </View>
              ) : (
                // Superadmin — pick any gym
                <>
                  <Text style={styles.sectionDescription}>
                    Select the gym this user will belong to
                  </Text>
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
                      {gyms.length === 0 ? (
                        <Text style={styles.gymEmptyText}>No gyms found</Text>
                      ) : (
                        gyms.map((gym) => (
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
                        ))
                      )}
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Status</Text>
              <Text style={styles.sectionDescription}>
                Set the initial status for this user account
              </Text>

              <View style={styles.roleGrid}>
                {STATUSES.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.roleCard,
                      selectedStatus === status.value && styles.roleCardActive,
                    ]}
                    onPress={() => setSelectedStatus(status.value)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.roleRadio,
                        selectedStatus === status.value && styles.roleRadioActive,
                      ]}
                    >
                      {selectedStatus === status.value && (
                        <View style={styles.roleRadioInner} />
                      )}
                    </View>
                    <View style={styles.roleTextContainer}>
                      <Text
                        style={[
                          styles.roleLabel,
                          selectedStatus === status.value && styles.roleLabelActive,
                        ]}
                      >
                        {status.label}
                      </Text>
                      <Text style={styles.roleDescription}>{status.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Create User"
                onPress={handleCreate}
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  createButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.primary.yellow,
  },
  createButtonTextDisabled: {
    opacity: 0.5,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  sectionDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  inputSpacing: {
    height: spacing.md,
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
  roleTextContainer: {
    flex: 1,
  },
  roleLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  roleLabelActive: {
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
  roleDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  genderRow: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  genderChip: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderChipActive: {
    borderColor: colors.primary.yellow,
    backgroundColor: colors.background.light,
  },
  genderChipText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  genderChipTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
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
  gymNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  gymNoticeText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.status.warning,
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
  gymEmptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
    padding: spacing.lg,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: spacing.xxxl,
  },
});
