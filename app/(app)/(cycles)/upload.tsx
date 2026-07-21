import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { CycleForm } from '../../../src/components/cycles/CycleForm';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useCycleStore } from '../../../src/stores/useCycleStore';
import { showAppAlert } from '../../../src/stores/useUIStore';
import { spacing } from '../../../src/theme';
import type { CreateCycleRequest } from '../../../src/types/api';

export default function UploadCycleScreen() {
  const user = useAuthStore((s) => s.user);
  const { createCycle, isLoading } = useCycleStore();

  const handleSubmit = useCallback(
    async (payload: CreateCycleRequest | FormData) => {
      await createCycle(payload, user ?? undefined);
      showAppAlert('Success', 'Cycle created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    [createCycle, user],
  );

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Create Cycle" showBack onBack={() => router.back()} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <CycleForm submitLabel="Create Cycle" submitting={isLoading} onSubmit={handleSubmit} />
        </ScrollView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
});
