import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { SearchBar } from '../../../../src/components/ui/SearchBar';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { Avatar } from '../../../../src/components/ui/Avatar';
import { Badge } from '../../../../src/components/ui/Badge';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { useAdminStore } from '../../../../src/stores/useAdminStore';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import { ms, mvs } from '../../../../src/utils/responsive';

type DeactivateStep = 'search' | 'confirm' | 'success';

export default function DeactivateUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    userId?: string;
    userName?: string;
    userEmail?: string;
  }>();

  const { users, isLoading, updateUserStatus, fetchUsers } = useAdminStore();

  const [search, setSearch] = useState('');
  const [step, setStep] = useState<DeactivateStep>(params.userId ? 'confirm' : 'search');
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(
    params.userId
      ? { id: params.userId, name: params.userName || '', email: params.userEmail || '' }
      : null,
  );
  const [showModal, setShowModal] = useState(params.userId ? true : false);

  const filteredUsers = users.filter(
    (u) =>
      u.status === 'active' &&
      (u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())),
  );

  const handleSelectUser = (user: { _id: string; name: string; email: string }) => {
    setSelectedUser({ id: user._id, name: user.name, email: user.email });
    setShowModal(true);
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;
    try {
      await updateUserStatus(selectedUser.id, 'disabled');
      setShowModal(false);
      setStep('success');
    } catch {
      // Error handled in store
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  if (step === 'success') {
    return (
      <RoleGuard allowedRoles={['admin', 'superadmin']}>
        <SafeScreen>
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={64} color={colors.status.success} />
            </View>
            <Text style={styles.successTitle}>Account Deactivated Successfully!</Text>
            <Text style={styles.successMessage}>
              {selectedUser?.name}'s account has been disabled and their data has been hidden.
            </Text>
            <Button
              title="Return to Dashboard"
              onPress={() => router.replace('/(app)/(admin)')}
              variant="primary"
              size="lg"
              fullWidth
            />
          </View>
        </SafeScreen>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Deactivate User"
          showBack
          onBack={() => router.back()}
        />

        <View style={styles.container}>
          {/* Search */}
          <View style={styles.searchSection}>
            <Text style={styles.instruction}>
              Search for the user account you want to deactivate.
            </Text>
            <SearchBar
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                if (text.length >= 2 && users.length === 0) {
                  fetchUsers(1);
                }
              }}
              placeholder="Search by name or email..."
            />
          </View>

          {/* Search Results */}
          {search.length >= 2 && (
            <View style={styles.results}>
              {filteredUsers.map((user) => (
                <Card
                  key={user._id}
                  style={styles.resultCard}
                  onPress={() => handleSelectUser(user)}
                >
                  <View style={styles.resultRow}>
                    <Avatar name={user.name} uri={user.avatar} size={40} />
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{user.name}</Text>
                      <Text style={styles.resultEmail}>{user.email}</Text>
                    </View>
                    <Badge text={user.role} variant="default" size="sm" />
                  </View>
                </Card>
              ))}

              {filteredUsers.length === 0 && (
                <Text style={styles.noResults}>No active users found</Text>
              )}
            </View>
          )}
        </View>

        {/* Confirmation Modal */}
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="warning" size={32} color={colors.status.error} />
              </View>

              <Text style={styles.modalTitle}>Deactivate Account?</Text>

              {selectedUser && (
                <Card style={styles.modalUserCard}>
                  <View style={styles.modalUserRow}>
                    <Avatar name={selectedUser.name} size={44} />
                    <View style={styles.modalUserInfo}>
                      <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                      <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                    </View>
                  </View>
                </Card>
              )}

              <Text style={styles.modalMessage}>
                Deactivating this account will revoke access and hide all associated data. Are you
                sure you want to proceed?
              </Text>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={handleCancel}
                  variant="outline"
                  size="lg"
                  style={styles.modalButton}
                />
                <Button
                  title="Deactivate"
                  onPress={handleDeactivate}
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  style={{ ...styles.modalButton, ...styles.deactivateButton }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  searchSection: {
    marginBottom: spacing.xl,
  },
  instruction: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  results: {
    gap: spacing.sm,
  },
  resultCard: {
    marginBottom: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  resultName: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.primary,
  },
  resultEmail: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
    marginTop: 2,
  },
  noResults: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.light,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  // Success Screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  successIconCircle: {
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(22),
    lineHeight: ms(28),
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successMessage: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.card,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(20),
    lineHeight: ms(28),
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  modalUserCard: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  modalUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalUserInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  modalUserName: {
    fontFamily: fontFamily.medium,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
  modalUserEmail: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
    marginTop: 2,
  },
  modalMessage: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
  },
  deactivateButton: {
    backgroundColor: colors.status.error,
  },
});
