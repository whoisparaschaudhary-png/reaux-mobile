import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { useChallengeStore } from '../../../../src/stores/useChallengeStore';
import { showAppAlert } from '../../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius, layout } from '../../../../src/theme';
import type { ChallengeType } from '../../../../src/types/models';

const CHALLENGE_TYPES: ChallengeType[] = ['steps', 'workout', 'diet', 'custom'];

export default function CreateChallengeScreen() {
  const router = useRouter();
  const { createChallenge } = useChallengeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChallengeType>('steps');
  const [target, setTarget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = async () => {
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
      await createChallenge({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        target: Number(target),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      });

      showAppAlert('Success', 'Challenge created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Create Challenge" showBack onBack={() => router.back()} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Info */}
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

          {/* Challenge Type */}
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.categoryGrid}>
            {CHALLENGE_TYPES.map((t) => {
              const isActive = t === type;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setType(t)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isActive && styles.categoryChipTextActive,
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Target */}
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

          {/* Dates */}
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

          {/* Submit */}
          <View style={styles.submitContainer}>
            <Button
              title="Create Challenge"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
            />
          </View>
        </ScrollView>
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
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.text.onPrimary,
  },
  submitContainer: {
    marginTop: spacing.xxl,
  },
});
