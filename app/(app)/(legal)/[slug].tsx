import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LEGAL_DOCS } from '../../../src/utils/legalContent';
import { colors, fontFamily, typography, spacing } from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';

export default function LegalDocScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const doc = slug ? LEGAL_DOCS[slug] : undefined;

  if (!doc) {
    return (
      <SafeScreen>
        <Header title="Policy" showBack onBack={() => router.back()} />
        <EmptyState icon="document-text-outline" title="Not found" message="This policy is unavailable." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <Header title={doc.title} showBack onBack={() => router.back()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.updated}>{doc.updated}</Text>
        <Text style={styles.intro}>{doc.intro}</Text>
        {doc.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            {section.heading ? <Text style={styles.heading}>{section.heading}</Text> : null}
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  updated: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(17),
    color: colors.text.light,
    marginBottom: spacing.lg,
  },
  intro: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(23),
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  heading: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(23),
    color: colors.text.secondary,
  },
});
