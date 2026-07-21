import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Badge } from '../../../src/components/ui/Badge';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useCycleStore } from '../../../src/stores/useCycleStore';
import { useUIStore, showAppAlert } from '../../../src/stores/useUIStore';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../../src/theme';
import { ms, mvs } from '../../../src/utils/responsive';
import { haptics } from '../../../src/utils/haptics';
import type { User, CycleType, CycleRiskSeverity } from '../../../src/types/models';

const TYPE_LABEL: Record<CycleType, string> = {
  oral: 'Oral',
  injectable: 'Injectable',
  'inj-oral': 'Inj + Oral',
};

// Soft-tinted panel colors that match the Figma (purple/blue PCT card, red/orange risks).
const PCT_BG = '#f3e8ff';
const PCT_ITEM_BG = '#ffffff';
const PCT_ACCENT = '#7c3aed';

const RISK_COLORS: Record<CycleRiskSeverity, string> = {
  high: colors.status.error,
  medium: colors.status.warning,
  low: colors.status.info,
};

export default function CycleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const {
    selectedCycle,
    isLoading,
    getCycleById,
    followCycle,
    likeCycle,
    setCyclePublished,
    deleteCycle,
    clearSelectedCycle,
  } = useCycleStore();
  const showToast = useUIStore((s) => s.showToast);
  const [publishLoading, setPublishLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (id) getCycleById(id);
    return () => clearSelectedCycle();
  }, [id]);

  const handleLike = useCallback(() => {
    haptics.medium();
    if (id) likeCycle(id);
  }, [id, likeCycle]);

  const handleFollow = useCallback(() => {
    haptics.light();
    if (id) followCycle(id);
  }, [id, followCycle]);

  const handlePublishToggle = useCallback(async () => {
    if (!id || !selectedCycle) return;
    setPublishLoading(true);
    try {
      await setCyclePublished(id, !selectedCycle.isPublished);
      showToast(selectedCycle.isPublished ? 'Cycle unpublished' : 'Cycle published', 'success');
    } catch {
      showToast('Failed to update publish status', 'error');
    } finally {
      setPublishLoading(false);
    }
  }, [id, selectedCycle, setCyclePublished, showToast]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    showAppAlert('Delete Cycle', 'This cycle protocol will be permanently removed. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleteLoading(true);
          try {
            await deleteCycle(id);
            showToast('Cycle deleted', 'success');
            router.back();
          } catch {
            showToast('Failed to delete cycle', 'error');
          } finally {
            setDeleteLoading(false);
          }
        },
      },
    ]);
  }, [id, deleteCycle, showToast]);

  const renderHeaderRight = () => (
    <View style={styles.headerActions}>
      <TouchableOpacity onPress={handleLike} activeOpacity={0.7} hitSlop={8}>
        <Ionicons
          name={selectedCycle?.isLiked ? 'heart' : 'heart-outline'}
          size={ms(22)}
          color={selectedCycle?.isLiked ? colors.status.error : colors.text.primary}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleFollow} activeOpacity={0.7} hitSlop={8}>
        <Ionicons
          name={selectedCycle?.isFollowed ? 'bookmark' : 'bookmark-outline'}
          size={ms(22)}
          color={selectedCycle?.isFollowed ? colors.primary.yellowDark : colors.text.primary}
        />
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !selectedCycle) {
    return (
      <SafeScreen>
        <Header title="Cycle Details" showBack onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  if (!selectedCycle) {
    return (
      <SafeScreen>
        <Header title="Cycle Details" showBack onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Cycle not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeScreen>
    );
  }

  const cycle = selectedCycle;
  const author = typeof cycle.createdBy === 'object' ? (cycle.createdBy as User) : null;
  const isVerified = author?.role === 'admin' || author?.role === 'superadmin';
  const phases = cycle.phases ?? [];
  const risks = cycle.risks ?? [];
  const pctItems = cycle.pct?.items ?? [];

  return (
    <SafeScreen>
      <Header
        title="Cycle Details"
        showBack
        onBack={() => router.back()}
        rightAction={renderHeaderRight()}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info card */}
        <View style={[styles.infoCard, shadows.card]}>
          {cycle.image ? (
            <Image source={{ uri: cycle.image }} style={styles.infoImage} contentFit="cover" transition={250} placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }} />
          ) : null}

          <View style={styles.pillRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{cycle.category.toUpperCase()}</Text>
            </View>
            {cycle.level ? (
              <View style={styles.levelPill}>
                <Text style={styles.levelPillText}>{cycle.level.toUpperCase()}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>{cycle.title}</Text>
          {cycle.description ? <Text style={styles.description}>{cycle.description}</Text> : null}

          {author && (
            <View style={styles.authorRow}>
              <Avatar uri={author.avatar} name={author.name} size={ms(36)} />
              <View style={styles.authorText}>
                <Text style={styles.authorName}>{author.name}</Text>
                {isVerified ? (
                  <View style={styles.verifiedRow}>
                    <Ionicons name="checkmark-circle" size={ms(13)} color={colors.status.info} />
                    <Text style={styles.verifiedText}>Verified Admin</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="calendar-outline" size={ms(18)} color={colors.text.primary} />
              <Text style={styles.statValue}>{cycle.durationWeeks ? `${cycle.durationWeeks} Weeks` : '—'}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="medkit-outline" size={ms(18)} color={colors.text.primary} />
              <Text style={styles.statValue}>{cycle.type ? TYPE_LABEL[cycle.type] : '—'}</Text>
              <Text style={styles.statLabel}>Type</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="trending-up-outline" size={ms(18)} color={colors.text.primary} />
              <Text style={styles.statValue}>{cycle.estimatedGain || '—'}</Text>
              <Text style={styles.statLabel}>Est. Gain</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Protocol Breakdown */}
          {phases.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flask" size={ms(18)} color={colors.primary.yellowDark} />
                <Text style={styles.sectionTitle}>Protocol Breakdown</Text>
              </View>

              {phases.map((phase, pIdx) => (
                <View key={pIdx} style={styles.timelineRow}>
                  <View style={styles.timelineGutter}>
                    <View style={styles.timelineDot} />
                    {pIdx < phases.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={[styles.phaseCard, shadows.card]}>
                    <View style={styles.phaseHeader}>
                      <Text style={styles.phaseName}>{phase.name}</Text>
                      {phase.label ? <Text style={styles.phaseLabel}>{phase.label}</Text> : null}
                    </View>
                    {(phase.compounds ?? []).map((compound, cIdx) => (
                      <View key={cIdx} style={styles.compoundRow}>
                        <Ionicons name="ellipse" size={ms(8)} color={colors.primary.yellow} style={styles.compoundDot} />
                        <View style={styles.compoundText}>
                          <Text style={styles.compoundName}>{compound.name}</Text>
                          {(compound.dosage || compound.frequency) && (
                            <Text style={styles.compoundDose}>
                              {[compound.dosage, compound.frequency].filter(Boolean).join(' • ')}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                    {phase.note ? (
                      <View style={styles.noteBox}>
                        <Text style={styles.noteText}>
                          <Text style={styles.noteLabel}>Note: </Text>
                          {phase.note}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Post Cycle Therapy */}
          {(cycle.pct?.startNote || pctItems.length > 0) && (
            <View style={[styles.pctCard]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="shield-checkmark" size={ms(18)} color={PCT_ACCENT} />
                <Text style={[styles.sectionTitle, { color: PCT_ACCENT }]}>Post Cycle Therapy</Text>
              </View>
              {cycle.pct?.startNote ? <Text style={styles.pctNote}>{cycle.pct.startNote}</Text> : null}
              {pctItems.length > 0 && (
                <View style={styles.pctItemsRow}>
                  {pctItems.map((item, i) => (
                    <View key={i} style={styles.pctItem}>
                      <Text style={styles.pctItemName}>{item.name}</Text>
                      {item.dosage ? <Text style={styles.pctItemDose}>{item.dosage}</Text> : null}
                      {item.duration ? <Text style={styles.pctItemDuration}>{item.duration}</Text> : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Potential Risks */}
          {risks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning-outline" size={ms(18)} color={colors.status.warning} />
                <Text style={styles.sectionTitle}>Potential Risks</Text>
              </View>
              <View style={[styles.risksCard, shadows.card]}>
                {risks.map((risk, i) => {
                  const dotColor = RISK_COLORS[risk.severity ?? 'medium'];
                  return (
                    <View key={i} style={[styles.riskRow, i < risks.length - 1 && styles.riskDivider]}>
                      <View style={[styles.riskDot, { backgroundColor: dotColor }]} />
                      <Text style={styles.riskText}>
                        <Text style={styles.riskTitle}>{risk.title}: </Text>
                        {risk.description}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Tags */}
          {(cycle.tags?.length ?? 0) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsRow}>
                {cycle.tags!.map((tag, i) => (
                  <Badge key={i} text={`#${tag}`} variant="default" size="sm" />
                ))}
              </View>
            </View>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <View style={styles.adminActions}>
              <Button
                title="Edit Cycle"
                onPress={() => router.push(`/(app)/(cycles)/edit?id=${cycle._id}` as any)}
                variant="outline"
                fullWidth
                leftIcon={<Ionicons name="create-outline" size={18} color={colors.text.primary} />}
              />
              <View style={styles.adminSpacer} />
              <Button
                title={cycle.isPublished ? 'Unpublish Cycle' : 'Publish Cycle'}
                onPress={handlePublishToggle}
                variant="primary"
                fullWidth
                loading={publishLoading}
                disabled={publishLoading}
                leftIcon={
                  !publishLoading ? (
                    <Ionicons
                      name={cycle.isPublished ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.text.onPrimary}
                    />
                  ) : undefined
                }
              />
              <View style={styles.adminSpacer} />
              <Button
                title="Delete Cycle"
                onPress={handleDelete}
                variant="ghost"
                fullWidth
                loading={deleteLoading}
                disabled={deleteLoading}
                leftIcon={!deleteLoading ? <Ionicons name="trash-outline" size={18} color={colors.status.error} /> : undefined}
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
  scrollView: { flex: 1 },
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    margin: spacing.lg,
    marginBottom: spacing.md,
  },
  infoImage: {
    width: '100%',
    height: mvs(150),
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryPill: {
    backgroundColor: colors.primary.yellow,
    paddingHorizontal: spacing.md,
    paddingVertical: ms(5),
    borderRadius: borderRadius.pill,
  },
  categoryPillText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(11),
    lineHeight: ms(15),
    color: colors.text.onPrimary,
    letterSpacing: 0.5,
  },
  levelPill: {
    borderWidth: 1,
    borderColor: colors.border.gray,
    paddingHorizontal: spacing.md,
    paddingVertical: ms(5),
    borderRadius: borderRadius.pill,
  },
  levelPillText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(11),
    lineHeight: ms(15),
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(21),
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  authorText: { flex: 1 },
  authorName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  verifiedText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.status.info,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: ms(13),
    lineHeight: ms(17),
    color: colors.text.primary,
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: ms(11),
    lineHeight: ms(15),
    color: colors.text.light,
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineGutter: {
    width: ms(24),
    alignItems: 'center',
  },
  timelineDot: {
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    backgroundColor: colors.primary.yellow,
    borderWidth: 2,
    borderColor: colors.background.light,
    marginTop: spacing.md,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border.gray,
    marginVertical: spacing.xs,
  },
  phaseCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  phaseName: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.primary,
  },
  phaseLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },
  compoundRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  compoundDot: {
    marginTop: ms(5),
    marginRight: spacing.sm,
  },
  compoundText: { flex: 1 },
  compoundName: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(19),
    color: colors.text.primary,
  },
  compoundDose: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(17),
    color: colors.text.secondary,
    marginTop: 1,
  },
  noteBox: {
    backgroundColor: '#fef2f2',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  noteText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(17),
    color: '#b91c1c',
  },
  noteLabel: {
    fontFamily: fontFamily.bold,
  },
  pctCard: {
    backgroundColor: PCT_BG,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  pctNote: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(19),
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  pctItemsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pctItem: {
    flex: 1,
    backgroundColor: PCT_ITEM_BG,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  pctItemName: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    lineHeight: ms(19),
    color: PCT_ACCENT,
  },
  pctItemDose: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.primary,
    marginTop: 2,
  },
  pctItemDuration: {
    fontFamily: fontFamily.regular,
    fontSize: ms(11),
    lineHeight: ms(15),
    color: colors.text.light,
    marginTop: 2,
  },
  risksCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  riskDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  riskDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    marginTop: ms(6),
    marginRight: spacing.md,
  },
  riskText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(19),
    color: colors.text.secondary,
  },
  riskTitle: {
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  adminActions: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  adminSpacer: {
    height: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
