import React, { useState, useCallback, useEffect } from 'react';
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
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { useBmiStore } from '../../../src/stores/useBmiStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../../src/theme';
import type { BmiCategory, BmiRecord } from '../../../src/types/models';

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

// Mifflin-St Jeor formula
function calculateBmrLocal(height: number, weight: number, age: number, gender: string): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'female' ? base - 161 : base + 5;
}

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
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: SLIDER_PADDING,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.gray,
    overflow: 'hidden',
  },
  filledTrack: {
    height: '100%',
    backgroundColor: colors.primary.yellow,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
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

type Gender = 'male' | 'female';

function getAgeFromDob(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
}

export default function HealthScreen() {
  const user = useAuthStore((s) => s.user);

  const profileAge = getAgeFromDob(user?.dateOfBirth);
  const profileGender = (user?.gender === 'male' || user?.gender === 'female') ? user.gender as Gender : null;

  const [height, setHeight] = useState(user?.height ?? 170);
  const [weight, setWeight] = useState(user?.weight ?? 70);
  const [age, setAge] = useState<number>(profileAge ?? 25);
  const [gender, setGender] = useState<Gender>(profileGender ?? 'male');
  const [result, setResult] = useState<{ bmi: number; category: BmiCategory; bmr?: number; message?: string } | null>(null);

  const { recordBmi, getLatest, latestRecord, isLoading } = useBmiStore();

  useEffect(() => {
    getLatest();
  }, []);

  const handleCalculate = useCallback(async () => {
    // Show local result immediately (with local BMR as fallback)
    const localResult = calculateBmiLocal(height, weight);
    const localBmr = calculateBmrLocal(height, weight, age, gender);
    setResult({ ...localResult, bmr: localBmr });

    try {
      const apiRecord = await recordBmi(height, weight, age, gender);
      // Update with API response (overrides local with server values)
      setResult({
        bmi: apiRecord.bmi,
        category: apiRecord.category,
        bmr: apiRecord.bmr ?? localBmr,
        message: apiRecord.message,
      });
    } catch {
      // Local result with local BMR already shown — nothing more to do
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.heading}>Check your Body stats</Text>
          <Text style={styles.subtitle}>
            Enter your height and weight to get your comprehensive BMI analysis
          </Text>
        </View>

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

        {/* Gender selector */}
        <View style={styles.genderSection}>
          <Text style={styles.sliderLabel}>Gender</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderOption, gender === 'male' && styles.genderOptionActive]}
              onPress={() => setGender('male')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="male"
                size={20}
                color={gender === 'male' ? colors.text.onPrimary : colors.text.secondary}
              />
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderOption, gender === 'female' && styles.genderOptionActive]}
              onPress={() => setGender('female')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="female"
                size={20}
                color={gender === 'female' ? colors.text.onPrimary : colors.text.secondary}
              />
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calculate button */}
        <Button
          title="CALCULATE BMI"
          onPress={handleCalculate}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
        />

        {/* Result card */}
        {result && bmiConfig && (
          <View style={[styles.resultCard, shadows.card]}>
            {/* Tinted header */}
            <View style={[styles.resultHeader, { backgroundColor: `${bmiConfig.color}15` }]}>
              <Text style={styles.resultLabel}>YOUR BMI</Text>
              <Text style={[styles.resultBmi, { color: bmiConfig.color }]}>
                {result.bmi.toFixed(1)}
              </Text>
              <View style={[styles.categoryPill, { backgroundColor: `${bmiConfig.color}20`, borderColor: `${bmiConfig.color}40` }]}>
                <View style={[styles.categoryDot, { backgroundColor: bmiConfig.color }]} />
                <Text style={[styles.categoryText, { color: bmiConfig.color }]}>{bmiConfig.label}</Text>
              </View>
            </View>

            <View style={styles.resultBody}>
              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{height}</Text>
                  <Text style={styles.statLabel}>Height (cm)</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{weight}</Text>
                  <Text style={styles.statLabel}>Weight (kg)</Text>
                </View>
              </View>

              {/* Color bar */}
              <View style={styles.colorBarSection}>
                <View style={styles.colorBar}>
                  <View style={[styles.colorSegment, { backgroundColor: colors.status.info, flex: 1 }]} />
                  <View style={[styles.colorSegment, { backgroundColor: colors.status.success, flex: 2 }]} />
                  <View style={[styles.colorSegment, { backgroundColor: colors.status.warning, flex: 1.5 }]} />
                  <View style={[styles.colorSegment, { backgroundColor: colors.status.error, flex: 2 }]} />
                </View>
                <View style={styles.indicatorContainer}>
                  <View style={[styles.barIndicator, { left: `${getBarPosition(result.bmi)}%` }]}>
                    <View style={[styles.barIndicatorPin, { borderTopColor: bmiConfig.color }]} />
                  </View>
                </View>
                <View style={styles.barLabels}>
                  <Text style={styles.barLabel}>Under</Text>
                  <Text style={styles.barLabel}>Normal</Text>
                  <Text style={styles.barLabel}>Over</Text>
                  <Text style={styles.barLabel}>Obese</Text>
                </View>
              </View>

              {/* BMR chip */}
              {result.bmr && (
                <View style={styles.bmrChip}>
                  <Ionicons name="flame" size={16} color={colors.status.warning} />
                  <Text style={styles.bmrChipLabel}>Basal Metabolic Rate</Text>
                  <Text style={styles.bmrChipValue}>{Math.round(result.bmr)} cal/day</Text>
                </View>
              )}

              <Text style={styles.resultMessage}>
                {result.message || bmiConfig.message}
              </Text>
            </View>
          </View>
        )}

        {/* Personalized diet plan suggestion */}
        {result && (
          <TouchableOpacity
            style={[styles.dietSuggestionCard, shadows.card]}
            onPress={() => router.push('/(app)/(health)/suggested' as any)}
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
    paddingBottom: spacing.xxxl,
  },
  headingSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  heading: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
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
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  sliderValue: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 22,
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
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
  },
  genderSection: {
    marginBottom: spacing.xxl,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    backgroundColor: colors.background.white,
  },
  genderOptionActive: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
  genderText: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.text.secondary,
  },
  genderTextActive: {
    color: colors.text.onPrimary,
  },
  resultCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    marginTop: spacing.xxl,
  },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  resultLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.text.light,
    marginBottom: spacing.sm,
  },
  resultBmi: {
    fontFamily: fontFamily.bold,
    fontSize: 64,
    lineHeight: 72,
    marginBottom: spacing.md,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  categoryText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
  },
  resultBody: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.text.light,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.light,
  },
  colorBarSection: {
    marginBottom: spacing.xl,
  },
  colorBar: {
    flexDirection: 'row',
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  colorSegment: {
    height: '100%',
  },
  indicatorContainer: {
    width: '100%',
    height: 16,
    position: 'relative',
  },
  barIndicator: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    marginLeft: -7,
  },
  barIndicatorPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  barLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.text.light,
  },
  bmrChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fff8e7',
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  bmrChipLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
  bmrChipValue: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
  resultMessage: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.secondary,
    textAlign: 'center',
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
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
  },
  dietSuggestionSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
