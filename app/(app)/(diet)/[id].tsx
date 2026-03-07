import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Badge } from '../../../src/components/ui/Badge';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useDietStore } from '../../../src/stores/useDietStore';
import { useUIStore } from '../../../src/stores/useUIStore';
import { exportDietPlanPDF } from '../../../src/utils/pdfExport';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../../src/theme';
import type { User, DietCategory, Meal } from '../../../src/types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const categoryBadgeVariant: Record<DietCategory, { variant: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'default'; label: string }> = {
  'weight-loss': { variant: 'error', label: 'Weight Loss' },
  'muscle-gain': { variant: 'success', label: 'Muscle Gain' },
  'maintenance': { variant: 'info', label: 'Maintenance' },
  'keto': { variant: 'warning', label: 'Keto' },
  'vegan': { variant: 'success', label: 'Vegan' },
  'other': { variant: 'default', label: 'Other' },
};

const MEAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  snacks: 'cafe-outline',
  dinner: 'moon-outline',
};

export default function DietPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const { selectedPlan, isLoading, getPlanById, followPlan, likePlan, setPlanPublished, clearSelectedPlan } =
    useDietStore();
  const showToast = useUIStore((s) => s.showToast);
  const [publishLoading, setPublishLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (id) getPlanById(id);
    return () => clearSelectedPlan();
  }, [id]);

  const handlePublishToggle = useCallback(async () => {
    if (!id || !selectedPlan) return;
    setPublishLoading(true);
    try {
      await setPlanPublished(id, !selectedPlan.isPublished);
      showToast(
        selectedPlan.isPublished ? 'Plan unpublished' : 'Plan published',
        'success'
      );
    } catch {
      showToast('Failed to update publish status', 'error');
    } finally {
      setPublishLoading(false);
    }
  }, [id, selectedPlan, setPlanPublished, showToast]);

  const handleFollow = useCallback(() => {
    if (id) followPlan(id);
  }, [id, followPlan]);

  const handleLike = useCallback(() => {
    if (id) likePlan(id);
  }, [id, likePlan]);

  const handleExportPDF = useCallback(async () => {
    if (!selectedPlan) return;
    setPdfLoading(true);
    try {
      await exportDietPlanPDF(selectedPlan);
      showToast('PDF exported successfully', 'success');
    } catch {
      showToast('Failed to export PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  }, [selectedPlan, showToast]);

  if (isLoading && !selectedPlan) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  if (!selectedPlan) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Diet plan not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeScreen>
    );
  }

  const author =
    typeof selectedPlan.createdBy === 'object'
      ? (selectedPlan.createdBy as User)
      : null;
  const categoryInfo =
    categoryBadgeVariant[selectedPlan.category] || categoryBadgeVariant.other;

  // Use boolean flags from API response
  const isFollowing = selectedPlan.isFollowed ?? false;
  const isLiked = selectedPlan.isLiked ?? false;

  // Compute macro totals from meals
  const macros = (selectedPlan.meals ?? []).reduce(
    (acc, meal) => {
      (meal.items ?? []).forEach((item) => {
        acc.protein += item.protein || 0;
        acc.carbs += item.carbs || 0;
        acc.fat += item.fat || 0;
      });
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <SafeScreen>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {selectedPlan.image ? (
            <Image
              source={{ uri: selectedPlan.image }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="restaurant-outline" size={48} color={colors.text.light} />
            </View>
          )}
          {/* Back button overlay */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportPDF}
            disabled={pdfLoading}
            activeOpacity={0.7}
          >
            {pdfLoading ? (
              <ActivityIndicator size="small" color={colors.text.white} />
            ) : (
              <Ionicons name="document-attach-outline" size={24} color={colors.text.white} />
            )}
          </TouchableOpacity>
          <View style={styles.heroBadge}>
            <Badge text={categoryInfo.label} variant={categoryInfo.variant} size="md" />
          </View>
        </View>

        <View style={styles.content}>
          {/* Title & Description */}
          <Text style={styles.title}>{selectedPlan.title}</Text>
          {selectedPlan.description ? (
            <Text style={styles.description}>{selectedPlan.description}</Text>
          ) : null}

          {/* Author info */}
          {author && (
            <View style={[styles.authorCard, shadows.card]}>
              <Avatar uri={author.avatar} name={author.name} size={44} />
              <View style={styles.authorTextBlock}>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorName}>{author.name}</Text>
                  {(author.role === 'admin' || author.role === 'superadmin') && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.status.info} />
                  )}
                </View>
                <Text style={styles.authorRole}>By Coach {author.name?.split(' ')[0]}</Text>
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.actionButtonActive]}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? colors.status.error : colors.text.primary}
              />
              <Text style={styles.actionText}>
                {selectedPlan.likesCount ?? 0} {(selectedPlan.likesCount ?? 0) === 1 ? 'Like' : 'Likes'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, isFollowing && styles.actionButtonActive]}
              onPress={handleFollow}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFollowing ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isFollowing ? colors.primary.yellowDark : colors.text.primary}
              />
              <Text style={styles.actionText}>
                {selectedPlan.followersCount ?? 0} {isFollowing ? 'Following' : 'Followers'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Macros */}
          {(selectedPlan.totalCalories || macros.protein > 0) && (
            <View style={styles.macroSection}>
              <Text style={styles.sectionTitle}>Macro Nutrients</Text>
              <View style={styles.macroRow}>
                {selectedPlan.totalCalories ? (
                  <View style={styles.macroItem}>
                    <Ionicons name="flame" size={20} color={colors.status.warning} />
                    <Text style={styles.macroValue}>{selectedPlan.totalCalories}</Text>
                    <Text style={styles.macroLabel}>Calories</Text>
                  </View>
                ) : null}
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: colors.status.error }]} />
                  <Text style={styles.macroValue}>{macros.protein}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: colors.status.info }]} />
                  <Text style={styles.macroValue}>{macros.carbs}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroDot, { backgroundColor: colors.status.warning }]} />
                  <Text style={styles.macroValue}>{macros.fat}g</Text>
                  <Text style={styles.macroLabel}>Fats</Text>
                </View>
              </View>
            </View>
          )}

          {/* Meals */}
          {(selectedPlan.meals?.length ?? 0) > 0 && (
            <View style={styles.mealsSection}>
              <Text style={styles.sectionTitle}>Daily Meals</Text>
              {selectedPlan.meals!.map((meal, mealIndex) => (
                <View key={mealIndex} style={[styles.mealCard, shadows.card]}>
                  <View style={styles.mealHeader}>
                    <Ionicons
                      name={
                        MEAL_ICONS[meal.name?.toLowerCase()] || 'restaurant-outline'
                      }
                      size={20}
                      color={colors.primary.yellowDark}
                    />
                    <Text style={styles.mealName}>{meal.name}</Text>
                    {meal.time ? (
                      <Text style={styles.mealTime}>{meal.time}</Text>
                    ) : null}
                  </View>
                  {(meal.items ?? []).map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.mealItem}>
                      <View style={styles.mealItemDot} />
                      <View style={styles.mealItemContent}>
                        <Text style={styles.mealItemName}>{item.name}</Text>
                        {item.quantity ? (
                          <Text style={styles.mealItemQuantity}>{item.quantity}</Text>
                        ) : null}
                      </View>
                      {item.calories ? (
                        <Text style={styles.mealItemCals}>{item.calories} cal</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Tags */}
          {(selectedPlan.tags?.length ?? 0) > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsRow}>
                {selectedPlan.tags!.map((tag, i) => (
                  <Badge key={i} text={`#${tag}`} variant="default" size="sm" />
                ))}
              </View>
            </View>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <View style={styles.adminActions}>
              <Button
                title="Edit Plan"
                onPress={() => router.push(`/(app)/(diet)/edit?id=${selectedPlan._id}`)}
                variant="outline"
                fullWidth
                leftIcon={
                  <Ionicons name="create-outline" size={18} color={colors.text.primary} />
                }
              />
              <View style={styles.adminSpacer} />
              <Button
                title={selectedPlan.isPublished ? 'Unpublish Plan' : 'Publish Plan'}
                onPress={handlePublishToggle}
                variant="primary"
                fullWidth
                loading={publishLoading}
                disabled={publishLoading}
                leftIcon={
                  !publishLoading ? (
                    <Ionicons
                      name={selectedPlan.isPublished ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.text.onPrimary}
                    />
                  ) : undefined
                }
              />
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  errorText: {
    ...typography.h4,
    color: colors.text.secondary,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.overlay.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.overlay.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.card,
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    marginBottom: spacing.lg,
  },
  authorTextBlock: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  authorName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  authorRole: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
  },
  actionButtonActive: {
    borderColor: colors.primary.yellow,
    backgroundColor: colors.primary.yellowLight,
  },
  actionText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  macroSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.xl,
    ...shadows.card,
  },
  macroItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macroValue: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
  },
  macroLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  mealsSection: {
    marginBottom: spacing.xxl,
  },
  mealCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  mealName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  mealTime: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  mealItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.yellow,
    marginRight: spacing.md,
  },
  mealItemContent: {
    flex: 1,
  },
  mealItemName: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  mealItemQuantity: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
    marginTop: 1,
  },
  mealItemCals: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  tagsSection: {
    marginBottom: spacing.xxl,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  adminActions: {
    marginBottom: spacing.xxl,
  },
  adminSpacer: {
    height: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
