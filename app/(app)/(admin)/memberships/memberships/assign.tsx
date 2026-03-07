import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../../src/components/layout/Header';
import { Input } from '../../../../../src/components/ui/Input';
import { Button } from '../../../../../src/components/ui/Button';
import { Avatar } from '../../../../../src/components/ui/Avatar';
import { RoleGuard } from '../../../../../src/components/guards/RoleGuard';
import { useMembershipStore } from '../../../../../src/stores/useMembershipStore';
import { usersApi } from '../../../../../src/api/endpoints/users';
import { showAppAlert } from '../../../../../src/stores/useUIStore';
import { formatCurrency } from '../../../../../src/utils/formatters';
import { colors, fontFamily, spacing, borderRadius, layout } from '../../../../../src/theme';
import type { User, MembershipPlan, Gym } from '../../../../../src/types/models';

export default function AssignMembershipScreen() {
  const router = useRouter();
  const { plans, assignMembership, membershipsLoading, fetchPlans } =
    useMembershipStore();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
    loadPlans();
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersApi.getUsers({ limit: 100 });
      setUsers(response.data || []);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPlans = async () => {
    await fetchPlans(1);
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = users.find((u) => u._id === selectedUserId);
  const selectedPlan = plans.find((p) => p._id === selectedPlanId);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      showAppAlert('Validation', 'Please select a user');
      return;
    }
    if (!selectedPlanId) {
      showAppAlert('Validation', 'Please select a membership plan');
      return;
    }
    if (!startDate) {
      showAppAlert('Validation', 'Please enter a start date');
      return;
    }

    try {
      await assignMembership({
        userId: selectedUserId,
        planId: selectedPlanId,
        startDate,
      });

      showAppAlert('Success', 'Membership assigned successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to assign membership');
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Assign Membership" showBack onBack={() => router.back()} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Select User */}
            <Text style={styles.sectionTitle}>Select User *</Text>
            <View style={styles.field}>
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftIcon={<Ionicons name="search" size={20} color={colors.text.light} />}
              />
            </View>

            {loadingUsers ? (
              <Text style={styles.loadingText}>Loading users...</Text>
            ) : filteredUsers.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery ? 'No users found' : 'No users available'}
              </Text>
            ) : (
              <View style={styles.usersList}>
                {filteredUsers.slice(0, 10).map((user) => {
                  const isSelected = user._id === selectedUserId;
                  return (
                    <TouchableOpacity
                      key={user._id}
                      style={[styles.userItem, isSelected && styles.userItemActive]}
                      onPress={() => setSelectedUserId(user._id)}
                      activeOpacity={0.7}
                    >
                      <Avatar uri={user.avatar} name={user.name} size={40} />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.primary.yellow}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Select Plan */}
            <Text style={styles.sectionTitle}>Select Plan *</Text>
            {plans.length === 0 ? (
              <Text style={styles.emptyText}>No active plans available</Text>
            ) : (
              <View style={styles.plansList}>
                {plans.filter(p => p.isActive).map((plan) => {
                  const isSelected = plan._id === selectedPlanId;
                  const gymName =
                    typeof plan.gymId === 'object'
                      ? (plan.gymId as Gym).name
                      : 'Unknown Gym';
                  const getDuration = (days: number) => {
                    if (days === 30) return '1 Month';
                    if (days === 90) return '3 Months';
                    if (days === 180) return '6 Months';
                    if (days === 365) return '1 Year';
                    return `${days} Days`;
                  };

                  return (
                    <TouchableOpacity
                      key={plan._id}
                      style={[styles.planItem, isSelected && styles.planItemActive]}
                      onPress={() => setSelectedPlanId(plan._id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.planInfo}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planGym}>{gymName}</Text>
                        <View style={styles.planDetails}>
                          <Text style={styles.planDuration}>
                            {getDuration(plan.durationDays)}
                          </Text>
                          <Text style={styles.planPrice}>
                            {formatCurrency(plan.price)}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.primary.yellow}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Start Date */}
            <Text style={styles.sectionTitle}>Start Date *</Text>
            <View style={styles.field}>
              <Input
                label="Start Date (YYYY-MM-DD)"
                placeholder="2024-01-01"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>

            {/* Summary */}
            {selectedUser && selectedPlan && (
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>User</Text>
                  <Text style={styles.summaryValue}>{selectedUser.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Plan</Text>
                  <Text style={styles.summaryValue}>{selectedPlan.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(selectedPlan.price)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Start Date</Text>
                  <Text style={styles.summaryValue}>{startDate || 'Not set'}</Text>
                </View>
              </View>
            )}

            {/* Submit */}
            <View style={styles.submitContainer}>
              <Button
                title="Assign Membership"
                onPress={handleSubmit}
                variant="primary"
                size="lg"
                fullWidth
                loading={membershipsLoading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.light,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  usersList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  userItemActive: {
    borderColor: colors.primary.yellow,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  plansList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planItemActive: {
    borderColor: colors.primary.yellow,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: 2,
  },
  planGym: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  planDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planDuration: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  planPrice: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.primary.yellow,
  },
  summary: {
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  summaryTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  submitContainer: {
    marginTop: spacing.xxl,
  },
});
