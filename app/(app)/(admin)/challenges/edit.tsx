import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { useChallengeStore } from '../../../../src/stores/useChallengeStore';
import { showAppAlert } from '../../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius, layout } from '../../../../src/theme';
import { ms } from '../../../../src/utils/responsive';
import type { ChallengeType } from '../../../../src/types/models';

const CHALLENGE_TYPES: ChallengeType[] = ['steps', 'workout', 'diet', 'custom'];

/** The API stores dates as ISO strings; the form edits them as YYYY-MM-DD. */
const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

export default function EditChallengeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { challenges, isLoading, fetchChallenges, updateChallenge } = useChallengeStore();

  const challenge = useMemo(
    () => challenges.find((c) => c._id === id),
    [challenges, id],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChallengeType>('steps');
  const [target, setTarget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // There is no GET /challenges/:id, so hydrate from the list — refetch it when
  // this screen is opened cold (deep link / reload) and the store is empty.
  useEffect(() => {
    if (!challenge && challenges.length === 0 && !isLoading) {
      fetchChallenges(1);
    }
  }, [challenge, challenges.length, isLoading, fetchChallenges]);

  useEffect(() => {
    if (challenge && !hydrated) {
      setTitle(challenge.title ?? '');
      setDescription(challenge.description ?? '');
      setType(challenge.type ?? 'steps');
      setTarget(challenge.target != null ? String(challenge.target) : '');
      setStartDate(toDateInput(challenge.startDate));
      setEndDate(toDateInput(challenge.endDate));
      setHydrated(true);
    }
  }, [challenge, hydrated]);

  const handleSubmit = async () => {
    if (!id) return;
    if (!title.trim()) {
      showAppAlert('Validation', 'Challenge title is required');
      return;
    }
    if (!target || isNaN(Number(target)) || Number(target) <= 0) {
      showAppAlert('Validation', 'A valid target number is required');
      return;
    }
    if (!startDate.trim()) {
      showAppAlert('Validation', 'Start date is required (YYYY-MM-DD)');
      return;
    }
    if (!endDate.trim()) {
      showAppAlert('Validation', 'End date is required (YYYY-MM-DD)');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateChallenge(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        target: Number(target),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      });

      showAppAlert('Success', 'Challenge updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to update challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Edit Challenge" showBack onBack={() => router.back()} />

        {!challenge ? (
          isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary.yellow} />
            </View>
          ) : (
            <EmptyState
              icon="trophy-outline"
              title="Challenge not found"
              message="It may have been deleted or is no longer active."
              actionLabel="Go Back"
              onAction={() => router.back()}
            />
          )
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.field}>
              <Input
                label="Title *"
                placeholder="e.g. 10k Steps Challenge"
                value={title}
                onChangeText={setTitle}
              />
            </View>
            <View style={styles.field}>
              <Input
                label="Description"
                placeholder="Describe the challenge..."
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.categoryGrid}>
              {CHALLENGE_TYPES.map((t) => {
                const active = t === type;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setType(t)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        active && styles.categoryChipTextActive,
                      ]}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Target</Text>
            <View style={styles.field}>
              <Input
                label="Target *"
                placeholder="e.g. 10000"
                value={target}
                onChangeText={setTarget}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Input
                  label="Start Date *"
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={styles.halfField}>
                <Input
                  label="End Date *"
                  placeholder="YYYY-MM-DD"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>

            <View style={styles.submitContainer}>
              <Button
                title="Save Changes"
                onPress={handleSubmit}
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
              />
            </View>
          </ScrollView>
        )}
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  categoryChipText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.text.onPrimary,
  },
  submitContainer: {
    marginTop: spacing.xxl,
  },
});
