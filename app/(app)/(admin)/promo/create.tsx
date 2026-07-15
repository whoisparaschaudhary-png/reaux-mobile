import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import { ms, mvs } from '../../../../src/utils/responsive';

export default function CreatePromoScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const hasContent = title.trim().length > 0;

  const handleSaveDraft = () => {
    // Save draft logic
  };

  const handlePreview = () => {
    router.push({
      pathname: '/(app)/(admin)/promo/review',
      params: {
        title,
        description,
        ctaText,
        ctaLink,
        startDate,
        endDate,
      },
    });
  };

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <SafeScreen>
        <Header
          title="Create Promo Banner"
          showBack
          onBack={() => router.back()}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Banner Title */}
          <Input
            label="Banner Title"
            placeholder="Enter banner title"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.spacer} />

          {/* Description */}
          <Input
            label="Description / Message"
            placeholder="Enter your promotional message..."
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.spacer} />

          {/* Preview Card */}
          {hasContent && (
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Preview</Text>
              <Card style={styles.previewCard}>
                <View style={styles.previewImagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color={colors.text.light} />
                </View>
                <View style={styles.previewContent}>
                  <Text style={styles.previewTitle} numberOfLines={2}>
                    {title || 'Banner Title'}
                  </Text>
                  {description.length > 0 && (
                    <Text style={styles.previewDescription} numberOfLines={3}>
                      {description}
                    </Text>
                  )}
                  {ctaText.length > 0 && (
                    <View style={styles.previewCta}>
                      <Text style={styles.previewCtaText}>{ctaText}</Text>
                    </View>
                  )}
                </View>
              </Card>
            </View>
          )}

          {/* CTA Text */}
          <Input
            label="Call to Action (CTA) Text"
            placeholder="e.g., Shop Now, Learn More"
            value={ctaText}
            onChangeText={setCtaText}
          />

          <View style={styles.spacer} />

          {/* CTA Link */}
          <Input
            label="Link / URL for CTA"
            placeholder="https://..."
            value={ctaLink}
            onChangeText={setCtaLink}
            keyboardType="url"
          />

          <View style={styles.spacer} />

          {/* Upload Banner Image */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Upload Banner Image</Text>
            <TouchableOpacity style={styles.uploadArea} activeOpacity={0.7}>
              <View style={styles.uploadIconCircle}>
                <Ionicons name="cloud-upload-outline" size={28} color={colors.primary.yellowDark} />
              </View>
              <Text style={styles.uploadText}>Tap to upload image</Text>
              <Text style={styles.uploadHint}>JPG, PNG (max 5MB)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          {/* Date Pickers */}
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Input
                label="Start Date"
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={styles.dateField}>
              <Input
                label="End Date"
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          <View style={styles.spacerLarge} />

          {/* Actions */}
          <View style={styles.actionRow}>
            <Button
              title="Save Draft"
              onPress={handleSaveDraft}
              variant="outline"
              size="lg"
              style={styles.actionButton}
            />
            <Button
              title="Preview"
              onPress={handlePreview}
              variant="primary"
              size="lg"
              disabled={!hasContent}
              style={styles.actionButton}
            />
          </View>
        </ScrollView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  spacer: {
    height: spacing.xl,
  },
  spacerLarge: {
    height: spacing.xxxl,
  },
  previewSection: {
    marginBottom: spacing.xl,
  },
  previewLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  previewCard: {
    overflow: 'hidden',
    padding: 0,
  },
  previewImagePlaceholder: {
    height: 140,
    backgroundColor: colors.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    padding: spacing.lg,
  },
  previewTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(18),
    lineHeight: ms(24),
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  previewDescription: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  previewCta: {
    backgroundColor: colors.primary.yellow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  previewCtaText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.onPrimary,
  },
  uploadSection: {
    marginBottom: 0,
  },
  uploadLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: colors.border.gray,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.white,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  uploadText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.primary,
    marginBottom: 4,
  },
  uploadHint: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
