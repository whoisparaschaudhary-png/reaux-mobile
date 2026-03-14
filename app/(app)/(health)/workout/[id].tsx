import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Badge } from '../../../../src/components/ui/Badge';
import { useWorkoutStore } from '../../../../src/stores/useWorkoutStore';
import { useUIStore } from '../../../../src/stores/useUIStore';
import { exportWorkoutPlanPDF } from '../../../../src/utils/pdfExport';
import {
  colors,
  fontFamily,
  spacing,
  borderRadius,
  shadows,
} from '../../../../src/theme';
import type { WorkoutDifficulty, Exercise } from '../../../../src/types/models';

const DIFFICULTY_CONFIG: Record<WorkoutDifficulty, { variant: 'success' | 'warning' | 'error' }> = {
  beginner: { variant: 'success' },
  intermediate: { variant: 'warning' },
  advanced: { variant: 'error' },
};

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const { selectedWorkout, isLoading, fetchWorkoutById, clearSelected } = useWorkoutStore();
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (id) fetchWorkoutById(id);
    return () => clearSelected();
  }, [id]);

  const handleExportPDF = useCallback(async () => {
    if (!selectedWorkout) return;
    setPdfLoading(true);
    try {
      await exportWorkoutPlanPDF(selectedWorkout);
      showToast('PDF exported successfully', 'success');
    } catch {
      showToast('Failed to export PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  }, [selectedWorkout, showToast]);

  if (isLoading || !selectedWorkout) {
    return (
      <SafeScreen>
        <Header title="Workout" showBack onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  const workout = selectedWorkout;
  const diffConfig = DIFFICULTY_CONFIG[workout.difficulty];

  return (
    <SafeScreen>
      <Header
        title="Workout"
        showBack
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            onPress={handleExportPDF}
            disabled={pdfLoading}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ minWidth: 40, alignItems: 'flex-end' }}
          >
            {pdfLoading ? (
              <ActivityIndicator size="small" color={colors.primary.yellow} />
            ) : (
              <Ionicons name="document-attach-outline" size={24} color={colors.text.primary} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        {workout.image && (
          <Image
            source={{ uri: workout.image }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />
        )}

        {/* Title & Badges */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{workout.title}</Text>
          <View style={styles.badgeRow}>
            <Badge text={workout.category} variant="primary" size="md" />
            <Badge text={workout.difficulty} variant={diffConfig.variant} size="md" />
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsCard, shadows.card]}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={22} color={colors.primary.yellowDark} />
            <Text style={styles.statValue}>{workout.duration}</Text>
            <Text style={styles.statLabel}>min</Text>
          </View>
          {workout.caloriesBurn && (
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={22} color={colors.status.warning} />
              <Text style={styles.statValue}>{workout.caloriesBurn}</Text>
              <Text style={styles.statLabel}>cal</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Ionicons name="barbell-outline" size={22} color={colors.status.info} />
            <Text style={styles.statValue}>{workout.exercises?.length ?? 0}</Text>
            <Text style={styles.statLabel}>exercises</Text>
          </View>
        </View>

        {/* Description */}
        {workout.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{workout.description}</Text>
          </View>
        )}

        {/* Tags */}
        {workout.tags?.length > 0 && (
          <View style={styles.tagRow}>
            {workout.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Exercises ({workout.exercises?.length ?? 0})
          </Text>
          {(workout.exercises ?? []).map((exercise, index) => (
            <ExerciseCard key={index} exercise={exercise} index={index + 1} />
          ))}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const ExerciseCard: React.FC<{ exercise: Exercise; index: number }> = ({ exercise, index }) => (
  <View style={styles.exerciseCard}>
    <View style={styles.exerciseIndex}>
      <Text style={styles.exerciseIndexText}>{index}</Text>
    </View>
    <View style={styles.exerciseContent}>
      <Text style={styles.exerciseName}>{exercise.name}</Text>
      <View style={styles.exerciseDetails}>
        {exercise.sets != null && (
          <Text style={styles.exerciseDetail}>
            {exercise.sets} sets
          </Text>
        )}
        {exercise.reps != null && (
          <Text style={styles.exerciseDetail}>
            {exercise.reps} reps
          </Text>
        )}
        {exercise.weight != null && (
          <Text style={styles.exerciseDetail}>
            {exercise.weight} kg
          </Text>
        )}
        {exercise.duration != null && (
          <Text style={styles.exerciseDetail}>
            {exercise.duration}s
          </Text>
        )}
        {exercise.restTime != null && (
          <Text style={[styles.exerciseDetail, { color: colors.status.info }]}>
            {exercise.restTime}s rest
          </Text>
        )}
      </View>
      {exercise.notes && (
        <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  titleSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.secondary,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  tag: {
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  tagText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.text.secondary,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  exerciseIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseIndexText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  exerciseDetail: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.text.secondary,
  },
  exerciseNotes: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
