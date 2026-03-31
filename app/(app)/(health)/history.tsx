import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { BmiRecordCard } from '../../../src/components/cards/BmiRecordCard';
import { useBmiStore } from '../../../src/stores/useBmiStore';
import { useRefreshOnFocus } from '../../../src/hooks/useRefreshOnFocus';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../../src/theme';
import { ms, mvs } from '../../../src/utils/responsive';
import { format } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = { top: 20, right: 20, bottom: 30, left: 40 };
const CHART_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const CHART_HEIGHT = 200;
const PLOT_WIDTH = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

export default function BmiHistoryScreen() {
  const { records, isLoading, fetchHistory, latestRecord } = useBmiStore();

  const loadHistory = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  useRefreshOnFocus(loadHistory);

  // Get last 6 records for chart (chronological order)
  const chartData = useMemo(() => {
    if (records.length === 0) return [];
    const sorted = [...records]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-6);
    return sorted;
  }, [records]);

  // Compute trend from last two records
  const trend = useMemo(() => {
    if (records.length < 2) return null;
    const sorted = [...records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const diff = sorted[0].bmi - sorted[1].bmi;
    return {
      value: diff,
      isUp: diff > 0,
    };
  }, [records]);

  // Chart calculations
  const chartPoints = useMemo(() => {
    if (chartData.length === 0) return '';
    const bmiValues = chartData.map((r) => r.bmi);
    const minBmi = Math.floor(Math.min(...bmiValues) - 2);
    const maxBmi = Math.ceil(Math.max(...bmiValues) + 2);
    const range = maxBmi - minBmi || 1;

    return chartData
      .map((record, i) => {
        const x = CHART_PADDING.left + (i / Math.max(chartData.length - 1, 1)) * PLOT_WIDTH;
        const y = CHART_PADDING.top + PLOT_HEIGHT - ((record.bmi - minBmi) / range) * PLOT_HEIGHT;
        return `${x},${y}`;
      })
      .join(' ');
  }, [chartData]);

  const chartCircles = useMemo(() => {
    if (chartData.length === 0) return [];
    const bmiValues = chartData.map((r) => r.bmi);
    const minBmi = Math.floor(Math.min(...bmiValues) - 2);
    const maxBmi = Math.ceil(Math.max(...bmiValues) + 2);
    const range = maxBmi - minBmi || 1;

    return chartData.map((record, i) => ({
      x: CHART_PADDING.left + (i / Math.max(chartData.length - 1, 1)) * PLOT_WIDTH,
      y: CHART_PADDING.top + PLOT_HEIGHT - ((record.bmi - minBmi) / range) * PLOT_HEIGHT,
      label: format(new Date(record.createdAt), 'MMM'),
      bmi: record.bmi,
    }));
  }, [chartData]);

  // Y-axis labels
  const yLabels = useMemo(() => {
    if (chartData.length === 0) return [];
    const bmiValues = chartData.map((r) => r.bmi);
    const minBmi = Math.floor(Math.min(...bmiValues) - 2);
    const maxBmi = Math.ceil(Math.max(...bmiValues) + 2);
    const steps = 4;
    const range = maxBmi - minBmi;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const value = minBmi + (range / steps) * i;
      const y = CHART_PADDING.top + PLOT_HEIGHT - (i / steps) * PLOT_HEIGHT;
      return { value: value.toFixed(0), y };
    });
  }, [chartData]);

  const currentBmi = records.length > 0
    ? [...records].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]
    : null;

  return (
    <SafeScreen>
      <Header title="BMI History" showBack onBack={() => router.back()} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && records.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
          </View>
        ) : records.length === 0 ? (
          <EmptyState
            icon="analytics-outline"
            title="No BMI Records"
            message="Calculate your BMI to start tracking your progress over time."
            actionLabel="Calculate BMI"
            onAction={() => router.back()}
          />
        ) : (
          <>
            {/* Current BMI heading */}
            <View style={styles.currentSection}>
              <Text style={styles.sectionHeading}>BMI Over Time</Text>
              {currentBmi && (
                <>
                  <View style={styles.currentRow}>
                    <Text style={styles.currentBmi}>{currentBmi.bmi?.toFixed(1)}</Text>
                    {trend && (
                      <View
                        style={[
                          styles.trendBadge,
                          { backgroundColor: trend.isUp ? '#fee2e2' : '#dcfce7' },
                        ]}
                      >
                        <Ionicons
                          name={trend.isUp ? 'trending-up' : 'trending-down'}
                          size={14}
                          color={trend.isUp ? colors.status.error : colors.status.success}
                        />
                        <Text
                          style={[
                            styles.trendText,
                            { color: trend.isUp ? colors.status.error : colors.status.success },
                          ]}
                        >
                          {trend.isUp ? '+' : ''}
                          {trend.value?.toFixed(1)}%
                        </Text>
                      </View>
                    )}
                  </View>
                  {currentBmi.bmr != null && (
                    <View style={styles.bmrRow}>
                      <Ionicons name="flame-outline" size={16} color={colors.status.warning} />
                      <Text style={styles.bmrText}>
                        BMR: <Text style={styles.bmrValue}>{Math.round(currentBmi.bmr)} cal/day</Text>
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Line chart */}
            {chartData.length >= 2 && (
              <View style={[styles.chartCard, shadows.card]}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                  {/* Horizontal grid lines */}
                  {yLabels.map((label, i) => (
                    <Line
                      key={i}
                      x1={CHART_PADDING.left}
                      y1={label.y}
                      x2={CHART_WIDTH - CHART_PADDING.right}
                      y2={label.y}
                      stroke={colors.border.light}
                      strokeWidth={1}
                    />
                  ))}

                  {/* Y-axis labels */}
                  {yLabels.map((label, i) => (
                    <SvgText
                      key={`y-${i}`}
                      x={CHART_PADDING.left - 8}
                      y={label.y + 4}
                      fontSize={10}
                      fill={colors.text.light}
                      textAnchor="end"
                      fontFamily={fontFamily.regular}
                    >
                      {label.value}
                    </SvgText>
                  ))}

                  {/* Line */}
                  <Polyline
                    points={chartPoints}
                    fill="none"
                    stroke={colors.primary.yellow}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data points and X labels */}
                  {chartCircles.map((point, i) => (
                    <React.Fragment key={i}>
                      <Circle
                        cx={point.x}
                        cy={point.y}
                        r={5}
                        fill={colors.primary.yellow}
                        stroke={colors.background.white}
                        strokeWidth={2}
                      />
                      <SvgText
                        x={point.x}
                        y={CHART_HEIGHT - 8}
                        fontSize={10}
                        fill={colors.text.light}
                        textAnchor="middle"
                        fontFamily={fontFamily.regular}
                      >
                        {point.label}
                      </SvgText>
                    </React.Fragment>
                  ))}
                </Svg>
              </View>
            )}

            {/* BMI Entries list */}
            <View style={styles.entriesSection}>
              <Text style={styles.sectionHeading}>BMI Entries</Text>
              {[...records]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                )
                .map((record) => (
                  <BmiRecordCard key={record._id} record={record} />
                ))}
            </View>
          </>
        )}

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 3,
  },
  currentSection: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  currentBmi: {
    fontFamily: fontFamily.bold,
    fontSize: ms(32),
    lineHeight: ms(38),
    color: colors.text.primary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  trendText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    lineHeight: ms(16),
  },
  bmrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  bmrText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  bmrValue: {
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
  chartCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  entriesSection: {
    marginBottom: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
