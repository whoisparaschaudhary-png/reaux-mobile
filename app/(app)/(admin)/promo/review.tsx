import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Card } from '../../../../src/components/ui/Card';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import { ms, mvs } from '../../../../src/utils/responsive';

export default function PromoReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
    startDate?: string;
    endDate?: string;
  }>();

  const bannerTitle = params.title || 'Unlock Your Fitness Potential';
  const bannerDescription =
    params.description ||
    'Get access to premium workouts, personalized diet plans, and exclusive challenges. Start your transformation today!';
  const ctaText = params.ctaText || 'Get Started';

  const handleEditBanner = () => {
    router.back();
  };

  const handleSchedule = () => {
    // Schedule publish date logic
  };

  const handlePublishNow = () => {
    // Publish now logic
    router.replace('/(app)/(admin)/promo/past');
  };

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <SafeScreen>
        <Header
          title="Banner Preview"
          showBack
          onBack={() => router.back()}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Preview */}
          <Card style={styles.bannerCard}>
            <View style={styles.bannerImageArea}>
              <View style={styles.bannerOverlay}>
                <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.5)" />
              </View>
            </View>

            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>{bannerTitle}</Text>
              <Text style={styles.bannerDescription}>{bannerDescription}</Text>

              {ctaText.length > 0 && (
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaButtonText}>{ctaText}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Banner Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>Banner Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Title</Text>
              <Text style={styles.detailValue}>{bannerTitle}</Text>
            </View>

            {params.startDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>{params.startDate}</Text>
              </View>
            )}

            {params.endDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date</Text>
                <Text style={styles.detailValue}>{params.endDate}</Text>
              </View>
            )}

            {params.ctaLink && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>CTA Link</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {params.ctaLink}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <Button
              title="Edit Banner"
              onPress={handleEditBanner}
              variant="outline"
              size="lg"
              fullWidth
              leftIcon={
                <Ionicons name="create-outline" size={20} color={colors.text.primary} />
              }
            />

            <View style={styles.actionSpacer} />

            <Button
              title="Schedule Publish Date"
              onPress={handleSchedule}
              variant="outline"
              size="lg"
              fullWidth
              leftIcon={
                <Ionicons name="calendar-outline" size={20} color={colors.text.primary} />
              }
            />

            <View style={styles.actionSpacer} />

            <Button
              title="Publish Now"
              onPress={handlePublishNow}
              variant="primary"
              size="lg"
              fullWidth
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
  bannerCard: {
    overflow: 'hidden',
    padding: 0,
    marginBottom: spacing.xxl,
  },
  bannerImageArea: {
    height: 200,
    backgroundColor: colors.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    padding: spacing.xl,
  },
  bannerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(22),
    lineHeight: ms(28),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  bannerDescription: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  ctaButton: {
    backgroundColor: colors.primary.yellow,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.onPrimary,
  },
  detailsSection: {
    marginBottom: spacing.xxl,
  },
  detailsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(18),
    lineHeight: ms(24),
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  detailLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
  },
  detailValue: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.lg,
  },
  actionsSection: {
    marginBottom: spacing.xl,
  },
  actionSpacer: {
    height: spacing.md,
  },
});
