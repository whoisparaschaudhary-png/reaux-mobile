import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../theme';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../utils/formatters';
import type { BmiRecord, BmiCategory } from '../../types/models';

interface BmiRecordCardProps {
  record: BmiRecord;
}

const categoryConfig: Record<BmiCategory, { variant: 'info' | 'success' | 'warning' | 'error'; label: string }> = {
  underweight: { variant: 'info', label: 'Underweight' },
  normal: { variant: 'success', label: 'Normal' },
  overweight: { variant: 'warning', label: 'Overweight' },
  obese: { variant: 'error', label: 'Obese' },
};

const categoryColor: Record<BmiCategory, string> = {
  underweight: colors.status.info,
  normal: colors.status.success,
  overweight: colors.status.warning,
  obese: colors.status.error,
};

export const BmiRecordCard: React.FC<BmiRecordCardProps> = ({ record }) => {
  const config = categoryConfig[record.category];
  const bmiColor = categoryColor[record.category];

  return (
    <View style={[styles.container, shadows.card]}>
      <View style={styles.topRow}>
        <Text style={styles.date}>{formatDate(record.createdAt)}</Text>
        <Badge text={config.label} variant={config.variant} size="sm" />
      </View>

      <View style={styles.mainRow}>
        <View style={styles.bmiSection}>
          <Text style={[styles.bmiValue, { color: bmiColor }]}>
            {record.bmi?.toFixed(1)}
          </Text>
          <Text style={styles.bmiLabel}>BMI</Text>
        </View>

        <View style={styles.metricsSection}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Height</Text>
            <Text style={styles.metricValue}>{record.height} cm</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Weight</Text>
            <Text style={styles.metricValue}>{record.weight} kg</Text>
          </View>
        </View>
      </View>

      {record.bmr != null && (
        <View style={styles.bmrRow}>
          <Ionicons name="flame-outline" size={14} color={colors.status.warning} />
          <Text style={styles.bmrText}>
            BMR: <Text style={styles.bmrValue}>{Math.round(record.bmr)} cal/day</Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  date: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bmiSection: {
    alignItems: 'center',
    marginRight: spacing.xxl,
  },
  bmiValue: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    lineHeight: 42,
  },
  bmiLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
    marginTop: 2,
  },
  metricsSection: {
    flex: 1,
    gap: spacing.sm,
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  metricValue: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  bmrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  bmrText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.text.secondary,
  },
  bmrValue: {
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
});
