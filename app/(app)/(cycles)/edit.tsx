import React, { useCallback, useEffect } from 'react';
import { ScrollView, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { CycleForm } from '../../../src/components/cycles/CycleForm';
import { useCycleStore } from '../../../src/stores/useCycleStore';
import { showAppAlert } from '../../../src/stores/useUIStore';
import { colors, spacing } from '../../../src/theme';
import type { CreateCycleRequest } from '../../../src/types/api';

export default function EditCycleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedCycle, isLoading, getCycleById, updateCycle } = useCycleStore();

  useEffect(() => {
    if (id) getCycleById(id);
  }, [id]);

  const handleSubmit = useCallback(
    async (payload: CreateCycleRequest | FormData) => {
      if (!id) return;
      await updateCycle(id, payload);
      showAppAlert('Success', 'Cycle updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    [id, updateCycle],
  );

  const ready = selectedCycle && selectedCycle._id === id;

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Edit Cycle" showBack onBack={() => router.back()} />
        {!ready ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <CycleForm
              key={selectedCycle._id}
              initial={selectedCycle}
              submitLabel="Save Changes"
              submitting={isLoading}
              onSubmit={handleSubmit}
            />
          </ScrollView>
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
