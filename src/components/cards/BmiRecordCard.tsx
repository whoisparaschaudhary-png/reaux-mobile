import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../theme';
import { ms } from '../../utils/responsive';
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
    fontSize: ms(13),
    lineHeight: ms(18),
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
    fontSize: ms(36),
    lineHeight: ms(42),
  },
  bmiLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    lineHeight: ms(16),
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
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
  },
  metricValue: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
  },
});
