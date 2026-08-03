import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import { LEGAL_DOCS } from '../../utils/legalContent';
import { ms } from '../../utils/responsive';

interface LegalDocModalProps {
  /** Slug into LEGAL_DOCS, or null to hide. */
  slug: string | null;
  onClose: () => void;
}

/**
 * Full-screen viewer for a legal document. Used from the auth screens so the
 * Terms of Use (EULA) and Privacy Policy are readable before signing in or
 * registering (App Store Guideline 1.2).
 */
export const LegalDocModal: React.FC<LegalDocModalProps> = ({ slug, onClose }) => {
  const insets = useSafeAreaInsets();
  const doc = slug ? LEGAL_DOCS[slug] : null;

  return (
    <Modal visible={doc !== null} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {doc?.title}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={ms(24)} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {doc ? (
            <>
              <Text style={styles.intro}>{doc.intro}</Text>
              {doc.sections.map((section, index) => (
                <View key={index} style={styles.section}>
                  {section.heading ? <Text style={styles.heading}>{section.heading}</Text> : null}
                  <Text style={styles.body}>{section.body}</Text>
                </View>
              ))}
              <Text style={styles.updated}>{doc.updated}</Text>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: ms(18),
    lineHeight: ms(24),
    color: colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  intro: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(21),
    color: colors.text.secondary,
  },
  updated: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },
});
