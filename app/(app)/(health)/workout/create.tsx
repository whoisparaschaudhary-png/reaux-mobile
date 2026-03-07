import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { workoutsApi } from '../../../../src/api/endpoints/workouts';
import { useUIStore } from '../../../../src/stores/useUIStore';
import { useFeedStore } from '../../../../src/stores/useFeedStore';
import { useAuthStore } from '../../../../src/stores/useAuthStore';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import type { WorkoutCategory, WorkoutDifficulty, Exercise } from '../../../../src/types/models';

const CATEGORIES: { value: WorkoutCategory; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'other', label: 'Other' },
];

const DIFFICULTIES: { value: WorkoutDifficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const emptyExercise = (): Exercise => ({
  name: '',
  sets: undefined,
  reps: undefined,
  weight: undefined,
  duration: undefined,
  restTime: undefined,
  notes: '',
});

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const createPost = useFeedStore((s) => s.createPost);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WorkoutCategory>('strength');
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty>('beginner');
  const [duration, setDuration] = useState('');
  const [caloriesBurn, setCaloriesBurn] = useState('');
  const [image, setImage] = useState('');
  const [tags, setTags] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()]);
  const [isLoading, setIsLoading] = useState(false);

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      if (field === 'name' || field === 'notes') {
        (updated[index] as any)[field] = value;
      } else {
        (updated[index] as any)[field] = value ? Number(value) : undefined;
      }
      return updated;
    });
  };

  const addExercise = () => setExercises((prev) => [...prev, emptyExercise()]);

  const removeExercise = (index: number) => {
    if (exercises.length <= 1) return;
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }
    if (!duration.trim() || isNaN(Number(duration))) {
      showToast('Please enter a valid duration', 'error');
      return;
    }
    const validExercises = exercises.filter((e) => e.name.trim());
    if (validExercises.length === 0) {
      showToast('Please add at least one exercise', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await workoutsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        difficulty,
        duration: Number(duration),
        caloriesBurn: caloriesBurn ? Number(caloriesBurn) : undefined,
        image: image.trim() || undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        exercises: validExercises,
      });
      // Create a feed post with category "workouts" so it appears under the Workouts tab
      const postContent = description.trim()
        ? `${title.trim()}\n\n${description.trim()}`
        : title.trim();
      await createPost(
        {
          content: postContent,
          mediaType: image.trim() ? 'image' : 'text',
          mediaUrl: image.trim() || undefined,
          hashtags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          category: 'workouts',
        },
        user ?? undefined
      );
      showToast('Workout created successfully', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to create workout', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Create Workout" showBack onBack={() => router.back()} />

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
            {/* Basic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Info</Text>
              <Input
                label="TITLE *"
                placeholder="e.g. Upper Body Strength"
                value={title}
                onChangeText={setTitle}
              />
              <View style={styles.inputSpacing} />
              <Input
                label="DESCRIPTION"
                placeholder="Describe the workout"
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <View style={styles.inputSpacing} />
              <Input
                label="IMAGE URL"
                placeholder="https://..."
                value={image}
                onChangeText={setImage}
                autoCapitalize="none"
              />
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.chip, category === c.value && styles.chipActive]}
                    onPress={() => setCategory(c.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Difficulty</Text>
              <View style={styles.chipRow}>
                {DIFFICULTIES.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.chip, difficulty === d.value && styles.chipActive]}
                    onPress={() => setDifficulty(d.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, difficulty === d.value && styles.chipTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration & Calories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="DURATION (MIN) *"
                    placeholder="45"
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="CALORIES BURN"
                    placeholder="350"
                    value={caloriesBurn}
                    onChangeText={setCaloriesBurn}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.inputSpacing} />
              <Input
                label="TAGS (COMMA-SEPARATED)"
                placeholder="chest, back, arms"
                value={tags}
                onChangeText={setTags}
              />
            </View>

            {/* Exercises */}
            <View style={styles.section}>
              <View style={styles.exercisesHeader}>
                <Text style={styles.sectionTitle}>Exercises</Text>
                <TouchableOpacity onPress={addExercise} activeOpacity={0.7}>
                  <Ionicons name="add-circle" size={28} color={colors.primary.yellow} />
                </TouchableOpacity>
              </View>

              {exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseForm}>
                  <View style={styles.exerciseFormHeader}>
                    <Text style={styles.exerciseFormTitle}>Exercise {index + 1}</Text>
                    {exercises.length > 1 && (
                      <TouchableOpacity onPress={() => removeExercise(index)}>
                        <Ionicons name="trash-outline" size={18} color={colors.status.error} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Input
                    label="NAME *"
                    placeholder="e.g. Bench Press"
                    value={exercise.name}
                    onChangeText={(v) => updateExercise(index, 'name', v)}
                  />
                  <View style={styles.inputSpacing} />
                  <View style={styles.row}>
                    <View style={styles.thirdInput}>
                      <Input
                        label="SETS"
                        placeholder="3"
                        value={exercise.sets?.toString() ?? ''}
                        onChangeText={(v) => updateExercise(index, 'sets', v)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.thirdInput}>
                      <Input
                        label="REPS"
                        placeholder="10"
                        value={exercise.reps?.toString() ?? ''}
                        onChangeText={(v) => updateExercise(index, 'reps', v)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.thirdInput}>
                      <Input
                        label="WEIGHT (KG)"
                        placeholder="60"
                        value={exercise.weight?.toString() ?? ''}
                        onChangeText={(v) => updateExercise(index, 'weight', v)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={styles.inputSpacing} />
                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Input
                        label="DURATION (SEC)"
                        placeholder="60"
                        value={exercise.duration?.toString() ?? ''}
                        onChangeText={(v) => updateExercise(index, 'duration', v)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Input
                        label="REST (SEC)"
                        placeholder="90"
                        value={exercise.restTime?.toString() ?? ''}
                        onChangeText={(v) => updateExercise(index, 'restTime', v)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={styles.inputSpacing} />
                  <Input
                    label="NOTES"
                    placeholder="Any tips or instructions"
                    value={exercise.notes ?? ''}
                    onChangeText={(v) => updateExercise(index, 'notes', v)}
                  />
                </View>
              ))}
            </View>

            {/* Submit */}
            <View style={styles.submitContainer}>
              <Button
                title="Create Workout"
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
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
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
  inputSpacing: { height: spacing.md },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  chipActive: {
    backgroundColor: colors.primary.yellow,
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.primary,
    fontFamily: fontFamily.bold,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: { flex: 1 },
  thirdInput: { flex: 1 },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseForm: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  exerciseFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exerciseFormTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.text.primary,
  },
  submitContainer: {
    marginTop: spacing.xxxl,
  },
});
