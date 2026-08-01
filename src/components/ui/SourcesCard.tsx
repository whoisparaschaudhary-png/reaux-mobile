import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import { ms } from '../../utils/responsive';

export interface SourceLink {
  label: string;
  url: string;
}

// Citations for the health calculations shown in the app (App Store guideline
// 1.4.1 requires visible sources for medical information).
export const HEALTH_SOURCES: SourceLink[] = [
  {
    label: 'WHO — Obesity and overweight (BMI classification)',
    url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  },
  {
    label: 'CDC — About Body Mass Index (BMI)',
    url: 'https://www.cdc.gov/bmi/about/index.html',
  },
  {
    label: 'Mifflin MD, St Jeor ST, et al. (1990) — BMR predictive equation, Am J Clin Nutr',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
  },
  {
    label: 'FAO/WHO/UNU — Human Energy Requirements (activity factors for daily calories)',
    url: 'https://www.fao.org/3/y5686e/y5686e00.htm',
  },
];

interface SourcesCardProps {
  sources?: SourceLink[];
  style?: object;
}

export function SourcesCard({ sources = HEALTH_SOURCES, style }: SourcesCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.titleRow}>
        <Ionicons name="library-outline" size={18} color={colors.text.primary} />
        <Text style={styles.title}>Sources & References</Text>
      </View>
      {sources.map((source) => (
        <TouchableOpacity
          key={source.url}
          style={styles.sourceRow}
          onPress={() => Linking.openURL(source.url)}
          activeOpacity={0.7}
          accessibilityRole="link"
        >
          <Ionicons name="open-outline" size={14} color={colors.status.info} />
          <Text style={styles.sourceText}>{source.label}</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.disclaimer}>
        This information is for general fitness and educational purposes only and is not medical
        advice. BMI, BMR and calorie estimates are screening tools and do not account for
        individual conditions. Consult a qualified healthcare professional before starting any
        diet or exercise program.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingRight: spacing.sm,
  },
  sourceText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(17),
    color: colors.status.info,
    flex: 1,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontFamily: fontFamily.regular,
    fontSize: ms(11),
    lineHeight: ms(16),
    color: colors.text.light,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
