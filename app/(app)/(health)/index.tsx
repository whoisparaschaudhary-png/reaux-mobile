import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { AppTopBar } from '../../../src/components/layout/AppTopBar';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { useBmiStore } from '../../../src/stores/useBmiStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../../src/theme';
import { ms, mvs } from '../../../src/utils/responsive';
import type { BmiCategory, BmiRecord, Gender } from '../../../src/types/models';

// Mifflin-St Jeor formula (most accurate for BMR)
function calculateBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'female') return base - 161;
  if (gender === 'male') return base + 5;
  return base - 78; // average of male and female for 'other'
}

const ACTIVITY_LEVELS: { label: string; multiplier: number; description: string }[] = [
  { label: 'Sedentary', multiplier: 1.2, description: 'Little or no exercise' },
  { label: 'Light', multiplier: 1.375, description: '1–3 days/week' },
  { label: 'Moderate', multiplier: 1.55, description: '3–5 days/week' },
  { label: 'Active', multiplier: 1.725, description: '6–7 days/week' },
  { label: 'Very Active', multiplier: 1.9, description: 'Intense daily exercise' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_PADDING = 20; // padding on each side
const TRACK_WIDTH = SCREEN_WIDTH - spacing.xl * 2 - SLIDER_PADDING * 2;

const BMI_CATEGORY_CONFIG: Record<BmiCategory, { label: string; color: string; variant: 'info' | 'success' | 'warning' | 'error'; message: string }> = {
  underweight: {
    label: 'Underweight',
    color: colors.status.info,
    variant: 'info',
    message: 'You are below the healthy range. Consider a balanced diet to gain some weight.',
  },
  normal: {
    label: 'Normal',
    color: colors.status.success,
    variant: 'success',
    message: 'Great job! You are in the healthy range.',
  },
  overweight: {
    label: 'Overweight',
    color: colors.status.warning,
    variant: 'warning',
    message: 'You are slightly above the healthy range. A balanced diet and exercise can help.',
  },
  obese: {
    label: 'Obese',
    color: colors.status.error,
    variant: 'error',
    message: 'Your BMI is above the healthy range. Consult a healthcare professional.',
  },
};

function getAgeFromDateOfBirth(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 15 && age <= 120 ? age : null;
}

function calculateBmiLocal(height: number, weight: number): { bmi: number; category: BmiCategory } {
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  let category: BmiCategory = 'normal';
  if (bmi < 18.5) category = 'underweight';
  else if (bmi < 25) category = 'normal';
  else if (bmi < 30) category = 'overweight';
  else category = 'obese';
  return { bmi, category };
}

// Healthy weight range for height (BMI 18.5–25)
function getIdealWeightRange(heightCm: number): { minKg: number; maxKg: number } {
  const heightM = heightCm / 100;
  return {
    minKg: Math.round(18.5 * heightM * heightM * 10) / 10,
    maxKg: Math.round(25 * heightM * heightM * 10) / 10,
  };
}

const BMI_RANGES: { category: BmiCategory; range: string; description: string }[] = [
  { category: 'underweight', range: '< 18.5', description: 'Below healthy range' },
  { category: 'normal', range: '18.5 – 25', description: 'Healthy range' },
  { category: 'overweight', range: '25 – 30', description: 'Above healthy range' },
  { category: 'obese', range: '30+', description: 'Well above healthy range' },
];

// Custom slider component using PanResponder (avoids external dependency)
interface CustomSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (val: number) => void;
}

function CustomSlider({ value, min, max, step, onValueChange }: CustomSliderProps) {
  const fraction = (value - min) / (max - min);
  const thumbSize = 24;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        updateValue(gestureState.x0);
      },
      onPanResponderMove: (_, gestureState) => {
        updateValue(gestureState.moveX);
      },
    }),
  ).current;

  const updateValue = (pageX: number) => {
    const trackStart = spacing.xl + SLIDER_PADDING;
    const relativeX = pageX - trackStart;
    const clampedX = Math.max(0, Math.min(TRACK_WIDTH, relativeX));
    const rawValue = min + (clampedX / TRACK_WIDTH) * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const finalValue = Math.max(min, Math.min(max, steppedValue));
    onValueChange(finalValue);
  };

  return (
    <View style={sliderStyles.container} {...panResponder.panHandlers}>
      <View style={sliderStyles.track}>
        <View
          style={[
            sliderStyles.filledTrack,
            { width: `${fraction * 100}%` },
          ]}
        />
      </View>
      <View
        style={[
          sliderStyles.thumb,
          {
            left: fraction * TRACK_WIDTH - thumbSize / 2 + SLIDER_PADDING,
          },
        ]}
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    height: ms(40),
    justifyContent: 'center',
    paddingHorizontal: SLIDER_PADDING,
  },
  track: {
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: colors.border.gray,
    overflow: 'hidden',
  },
  filledTrack: {
    height: '100%',
    backgroundColor: colors.primary.yellow,
    borderRadius: ms(3),
  },
  thumb: {
    position: 'absolute',
    top: ms(8),
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: colors.primary.yellow,
    borderWidth: 3,
    borderColor: colors.background.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default function HealthScreen() {
  const user = useAuthStore((s) => s.user);
  const ageFromProfile = useMemo(() => getAgeFromDateOfBirth(user?.dateOfBirth), [user?.dateOfBirth]);
  const genderFromProfile = user?.gender ?? 'male';

  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [age, setAge] = useState(() => ageFromProfile ?? 30);
  const [gender, setGender] = useState<Gender>(genderFromProfile);
  const [activityLevelIndex, setActivityLevelIndex] = useState(0);
  const [result, setResult] = useState<{
    bmi: number;
    category: BmiCategory;
    bmr: number;
    message?: string;
  } | null>(null);

  const { recordBmi, getLatest, isLoading } = useBmiStore();

  useEffect(() => {
    getLatest();
  }, []);

  useEffect(() => {
    if (ageFromProfile != null && ageFromProfile >= 15 && ageFromProfile <= 80) setAge(ageFromProfile);
  }, [ageFromProfile]);

  useEffect(() => {
    setGender(genderFromProfile);
  }, [genderFromProfile]);

  const handleCalculate = useCallback(async () => {
    const localResult = calculateBmiLocal(height, weight);
    const bmr = calculateBMR(weight, height, age, gender);

    setResult({
      bmi: localResult.bmi,
      category: localResult.category,
      bmr,
    });

    try {
      const apiRecord = await recordBmi(height, weight);
      setResult((prev) =>
        prev
          ? {
              ...prev,
              bmi: apiRecord.bmi,
              category: apiRecord.category,
              message: apiRecord.message,
            }
          : prev
      );
    } catch {
      // Keep local result
    }
  }, [height, weight, age, gender, recordBmi]);

  const handleSeeHistory = useCallback(() => {
    router.push('/(app)/(health)/history' as any);
  }, []);

  const bmiConfig = result ? BMI_CATEGORY_CONFIG[result.category] : null;

  // Compute color bar position (BMI 15-40 range mapped to bar width)
  const getBarPosition = (bmi: number) => {
    const minBmi = 15;
    const maxBmi = 40;
    const clamped = Math.max(minBmi, Math.min(maxBmi, bmi));
    return ((clamped - minBmi) / (maxBmi - minBmi)) * 100;
  };

  return (
    <SafeScreen>
      <AppTopBar title="BMI" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Height slider */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Height</Text>
            <Text style={styles.sliderValue}>{height} cm</Text>
          </View>
          <CustomSlider
            value={height}
            min={100}
            max={220}
            step={1}
            onValueChange={setHeight}
          />
          <View style={styles.sliderRange}>
            <Text style={styles.rangeText}>100 cm</Text>
            <Text style={styles.rangeText}>220 cm</Text>
          </View>
        </View>

        {/* Weight slider */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Weight</Text>
            <Text style={styles.sliderValue}>{weight} kg</Text>
          </View>
          <CustomSlider
            value={weight}
            min={30}
            max={200}
            step={1}
            onValueChange={setWeight}
          />
          <View style={styles.sliderRange}>
            <Text style={styles.rangeText}>30 kg</Text>
            <Text style={styles.rangeText}>200 kg</Text>
          </View>
        </View>

        {/* Age slider */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Age</Text>
            <Text style={styles.sliderValue}>{age} years</Text>
          </View>
          <CustomSlider
            value={age}
            min={15}
            max={80}
            step={1}
            onValueChange={setAge}
          />
          <View style={styles.sliderRange}>
            <Text style={styles.rangeText}>15</Text>
            <Text style={styles.rangeText}>80</Text>
          </View>
        </View>

        {/* Gender */}
        <View style={styles.genderSection}>
          <Text style={styles.sliderLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderChip, gender === g && styles.genderChipActive]}
                onPress={() => setGender(g)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.genderChipText,
                    gender === g && styles.genderChipTextActive,
                  ]}
                >
                  {g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calculate button */}
        <Button
          title="CALCULATE BMI & BMR"
          onPress={handleCalculate}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
        />

        {/* Result card */}
        {result && bmiConfig && (
          <View style={[styles.resultCard, shadows.card]}>
            <Text style={styles.resultLabel}>YOUR RESULT</Text>

            <Text style={[styles.resultBmi, { color: bmiConfig.color }]}>
              {result.bmi.toFixed(1)}
            </Text>

            <Badge text={bmiConfig.label} variant={bmiConfig.variant} size="md" />

            {/* Color bar */}
            <View style={styles.colorBar}>
              <View style={[styles.colorSegment, { backgroundColor: colors.status.info, flex: 1 }]} />
              <View style={[styles.colorSegment, { backgroundColor: colors.status.success, flex: 2 }]} />
              <View style={[styles.colorSegment, { backgroundColor: colors.status.warning, flex: 1.5 }]} />
              <View style={[styles.colorSegment, { backgroundColor: colors.status.error, flex: 2 }]} />
            </View>

            {/* Indicator position */}
            <View style={styles.indicatorContainer}>
              <View style={[styles.barIndicator, { left: `${getBarPosition(result.bmi)}%` }]}>
                <View style={styles.barIndicatorLine} />
                <View style={styles.barIndicatorDot} />
              </View>
            </View>

            <Text style={styles.resultMessage}>
              {result.message || bmiConfig.message}
            </Text>

            {/* BMI details */}
            {(() => {
              const ideal = getIdealWeightRange(height);
              const withinRange = weight >= ideal.minKg && weight <= ideal.maxKg;
              const weightNote = withinRange
                ? 'Your weight is within the healthy range for your height.'
                : weight < ideal.minKg
                  ? `Healthy range for your height: ${ideal.minKg} – ${ideal.maxKg} kg. Consider a balanced diet to reach it.`
                  : `Healthy range for your height: ${ideal.minKg} – ${ideal.maxKg} kg. Diet and exercise can help you get there.`;
              return (
                <View style={styles.bmiDetailsCard}>
                  <Text style={styles.bmiDetailsTitle}>BMI details</Text>
                  <View style={styles.bmiDetailRow}>
                    <Ionicons name="resize-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.bmiDetailText}>
                      Ideal weight for your height ({height} cm):{' '}
                      <Text style={styles.bmiDetailValue}>{ideal.minKg} – {ideal.maxKg} kg</Text>
                    </Text>
                  </View>
                  <View style={styles.bmiDetailRow}>
                    <Ionicons name="person-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.bmiDetailText}>
                      Your weight: <Text style={styles.bmiDetailValue}>{weight} kg</Text>
                    </Text>
                  </View>
                  <Text style={styles.bmiDetailNote}>{weightNote}</Text>
                  <View style={styles.bmiScaleSection}>
                    <Text style={styles.bmiScaleTitle}>BMI scale</Text>
                    {BMI_RANGES.map((r) => (
                      <View key={r.category} style={styles.bmiScaleRow}>
                        <View
                          style={[
                            styles.bmiScaleDot,
                            { backgroundColor: BMI_CATEGORY_CONFIG[r.category].color },
                          ]}
                        />
                        <Text style={styles.bmiScaleRange}>{r.range}</Text>
                        <Text style={styles.bmiScaleDesc}>{r.description}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.bmiWhatIs}>
                    BMI is a measure of body fat based on height and weight. It’s a useful screening tool but doesn’t account for muscle mass or body composition.
                  </Text>
                </View>
              );
            })()}

            {/* BMR section */}
            <View style={styles.bmrCard}>
              <View style={styles.bmrCardHeader}>
                <Ionicons name="flame" size={22} color={colors.status.warning} />
                <Text style={styles.bmrCardTitle}>Basal Metabolic Rate (BMR)</Text>
              </View>
              <Text style={styles.bmrCardValue}>
                {Math.round(result.bmr)} <Text style={styles.bmrCardUnit}>cal/day</Text>
              </Text>
              <Text style={styles.bmrCardHint}>
                Calories your body burns at rest (Mifflin-St Jeor formula)
              </Text>
            </View>

            {/* Activity & TDEE */}
            <View style={styles.tdeeSection}>
              <Text style={styles.tdeeLabel}>Activity level</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activityRow}
              >
                {ACTIVITY_LEVELS.map((level, idx) => (
                  <TouchableOpacity
                    key={level.label}
                    style={[
                      styles.activityChip,
                      activityLevelIndex === idx && styles.activityChipActive,
                    ]}
                    onPress={() => setActivityLevelIndex(idx)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.activityChipText,
                        activityLevelIndex === idx && styles.activityChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.tdeeRow}>
                <Ionicons name="nutrition-outline" size={20} color={colors.primary.yellowDark} />
                <Text style={styles.tdeeText}>
                  Estimated daily calories (TDEE):{' '}
                  <Text style={styles.tdeeValue}>
                    {Math.round(result.bmr * ACTIVITY_LEVELS[activityLevelIndex].multiplier)} cal
                  </Text>
                </Text>
              </View>
              <Text style={styles.tdeeHint}>
                {ACTIVITY_LEVELS[activityLevelIndex].description} — maintain weight at this intake
              </Text>
            </View>
          </View>
        )}

        {/* Personalized diet plan suggestion */}
        {result && (
          <TouchableOpacity
            style={[styles.dietSuggestionCard, shadows.card]}
            onPress={() =>
              router.push({
                pathname: '/(health)/suggested',
                // Pass the estimated daily calories (TDEE) so suggestions match the
                // user's actual calorie need, not just the coarse BMI category.
                params: {
                  calories: String(
                    Math.round(result.bmr * ACTIVITY_LEVELS[activityLevelIndex].multiplier),
                  ),
                },
              } as any)
            }
            activeOpacity={0.7}
          >
            <View style={styles.dietSuggestionContent}>
              <Ionicons name="restaurant" size={24} color={colors.primary.yellowDark} />
              <View style={styles.dietSuggestionTextBlock}>
                <Text style={styles.dietSuggestionTitle}>View Suggested Diets</Text>
                <Text style={styles.dietSuggestionSubtitle}>
                  Diet plans tailored to your BMI ({result.bmi.toFixed(1)} - {BMI_CATEGORY_CONFIG[result.category].label})
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
            </View>
          </TouchableOpacity>
        )}

        {/* See History button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={handleSeeHistory}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={20} color={colors.text.primary} />
          <Text style={styles.historyButtonText}>See History</Text>
        </TouchableOpacity>

        {/* Workouts Section - opens Feed with Workouts tab */}
        <TouchableOpacity
          style={[styles.workoutCard, shadows.card]}
          onPress={() =>
            router.navigate({
              pathname: '/(app)/(feed)',
              // ts forces the feed effect to re-run even if it was already on
              // the Workouts tab from a previous visit.
              params: { tab: 'workouts', ts: String(Date.now()) },
            } as any)
          }
          activeOpacity={0.7}
        >
          <View style={styles.workoutCardContent}>
            <View style={styles.workoutCardIcon}>
              <Ionicons name="barbell-outline" size={28} color={colors.primary.yellowDark} />
            </View>
            <View style={styles.workoutCardTextBlock}>
              <Text style={styles.workoutCardTitle}>Explore Workouts</Text>
              <Text style={styles.workoutCardSubtitle}>
                Browse workout plans for strength, cardio, HIIT and more
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  sliderSection: {
    marginBottom: spacing.xxl,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
  sliderValue: {
    fontFamily: fontFamily.bold,
    fontSize: ms(18),
    lineHeight: ms(22),
    color: colors.primary.yellowDark,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SLIDER_PADDING,
    marginTop: spacing.xs,
  },
  rangeText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },
  genderSection: {
    marginBottom: spacing.xxl,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  genderChip: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  genderChipText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    color: colors.text.secondary,
  },
  genderChipTextActive: {
    color: colors.text.onPrimary,
  },
  resultCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  resultLabel: {
    fontFamily: fontFamily.bold,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  resultBmi: {
    fontFamily: fontFamily.bold,
    fontSize: ms(56),
    lineHeight: ms(64),
    marginBottom: spacing.md,
  },
  colorBar: {
    flexDirection: 'row',
    width: '100%',
    height: spacing.sm,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginTop: spacing.xl,
  },
  colorSegment: {
    height: '100%',
  },
  indicatorContainer: {
    width: '100%',
    height: ms(20),
    position: 'relative',
    marginBottom: spacing.md,
  },
  barIndicator: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    marginLeft: -6,
  },
  barIndicatorLine: {
    width: 2,
    height: ms(8),
    backgroundColor: colors.background.dark,
  },
  barIndicatorDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: colors.background.dark,
    borderWidth: 2,
    borderColor: colors.background.white,
  },
  resultMessage: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
    textAlign: 'center',
  },
  bmiDetailsCard: {
    width: '100%',
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  bmiDetailsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    color: colors.text.primary,
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  bmiDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bmiDetailText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    color: colors.text.secondary,
    flex: 1,
  },
  bmiDetailValue: {
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
  bmiDetailNote: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  bmiScaleSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  bmiScaleTitle: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  bmiScaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bmiScaleDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  bmiScaleRange: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    color: colors.text.primary,
    minWidth: ms(72),
  },
  bmiScaleDesc: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    color: colors.text.light,
  },
  bmiWhatIs: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(17),
    color: colors.text.light,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  bmrCard: {
    width: '100%',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.yellowLight,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.warning,
  },
  bmrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bmrCardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  bmrCardValue: {
    fontFamily: fontFamily.bold,
    fontSize: ms(28),
    color: colors.text.primary,
  },
  bmrCardUnit: {
    fontFamily: fontFamily.regular,
    fontSize: ms(16),
    color: colors.text.secondary,
  },
  bmrCardHint: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  tdeeSection: {
    width: '100%',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  tdeeLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingRight: spacing.xl,
  },
  activityChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  activityChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  activityChipText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    color: colors.text.secondary,
  },
  activityChipTextActive: {
    color: colors.text.primary,
  },
  tdeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tdeeText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    color: colors.text.primary,
    flex: 1,
  },
  tdeeValue: {
    fontFamily: fontFamily.bold,
    color: colors.primary.yellowDark,
  },
  tdeeHint: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    color: colors.text.light,
    marginTop: spacing.xs,
  },
  dietSuggestionCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  dietSuggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dietSuggestionTextBlock: {
    flex: 1,
  },
  dietSuggestionTitle: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
  dietSuggestionSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
    marginTop: 2,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
  },
  historyButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.primary,
  },
  workoutCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginTop: spacing.xxl,
  },
  workoutCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutCardIcon: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: colors.primary.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  workoutCardTextBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  workoutCardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
  workoutCardSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
    marginTop: 2,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
