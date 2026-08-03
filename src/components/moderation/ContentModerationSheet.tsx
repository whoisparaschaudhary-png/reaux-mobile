import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import { useModerationStore } from '../../stores/useModerationStore';
import { useUIStore } from '../../stores/useUIStore';
import { ms } from '../../utils/responsive';
import type { ReportContentType, ReportReason } from '../../types/models';

export interface ModerationTarget {
  contentType: Exclude<ReportContentType, 'user'>;
  contentId: string;
  authorId?: string;
  authorName?: string;
}

interface ContentModerationSheetProps {
  visible: boolean;
  onClose: () => void;
  target: ModerationTarget | null;
  /** Called after a successful block, e.g. to navigate away from the content. */
  onBlocked?: () => void;
}

const REPORT_REASONS: { key: Exclude<ReportReason, 'blocked_user'>; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'spam', label: 'Spam or misleading', icon: 'megaphone-outline' },
  { key: 'harassment', label: 'Harassment or bullying', icon: 'sad-outline' },
  { key: 'nudity', label: 'Nudity or sexual content', icon: 'eye-off-outline' },
  { key: 'violence', label: 'Violence or dangerous acts', icon: 'warning-outline' },
  { key: 'hate_speech', label: 'Hate speech or symbols', icon: 'ban-outline' },
  { key: 'false_information', label: 'False information', icon: 'alert-circle-outline' },
  { key: 'other', label: 'Something else', icon: 'ellipsis-horizontal-circle-outline' },
];

/**
 * Bottom sheet with the App Store 1.2 moderation actions: flag objectionable
 * content and block abusive users. Reports are reviewed within 24 hours;
 * blocking removes the user's content from the feed instantly.
 */
export const ContentModerationSheet: React.FC<ContentModerationSheetProps> = ({
  visible,
  onClose,
  target,
  onBlocked,
}) => {
  const [stage, setStage] = useState<'menu' | 'report'>('menu');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reportContent = useModerationStore((s) => s.reportContent);
  const blockUser = useModerationStore((s) => s.blockUser);
  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    if (visible) setStage('menu');
  }, [visible]);

  if (!target) return null;

  const handleReport = async (reason: Exclude<ReportReason, 'blocked_user'>) => {
    setIsSubmitting(true);
    try {
      await reportContent({
        contentType: target.contentType,
        contentId: target.contentId,
        reason,
      });
      onClose();
      showToast('Report submitted. Our team reviews reports within 24 hours.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlock = () => {
    if (!target.authorId) return;
    const name = target.authorName || 'this user';
    Alert.alert(
      `Block ${name}?`,
      `You won't see their posts, reels or comments anymore, and our team will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await blockUser(target.authorId!);
              onClose();
              showToast(`${name} has been blocked`, 'success');
              onBlocked?.();
            } catch (err: any) {
              showToast(err.message || 'Failed to block user', 'error');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          {stage === 'menu' ? (
            <>
              <Text style={styles.title}>Content options</Text>
              <TouchableOpacity
                style={styles.option}
                onPress={() => setStage('report')}
                disabled={isSubmitting}
              >
                <Ionicons name="flag-outline" size={ms(22)} color={colors.status.error} />
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: colors.status.error }]}>
                    Report content
                  </Text>
                  <Text style={styles.optionHint}>
                    Flag objectionable content — reviewed within 24 hours
                  </Text>
                </View>
              </TouchableOpacity>

              {target.authorId ? (
                <TouchableOpacity style={styles.option} onPress={handleBlock} disabled={isSubmitting}>
                  <Ionicons name="person-remove-outline" size={ms(22)} color={colors.status.error} />
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, { color: colors.status.error }]}>
                      Block {target.authorName || 'user'}
                    </Text>
                    <Text style={styles.optionHint}>
                      Hide all their content immediately
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.reportHeader}>
                <TouchableOpacity
                  onPress={() => setStage('menu')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-back" size={ms(22)} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Why are you reporting this?</Text>
              </View>
              {isSubmitting ? (
                <ActivityIndicator color={colors.primary.yellow} style={styles.loader} />
              ) : (
                REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.key}
                    style={styles.option}
                    onPress={() => handleReport(reason.key)}
                  >
                    <Ionicons name={reason.icon} size={ms(20)} color={colors.text.primary} />
                    <Text style={styles.reasonLabel}>{reason.label}</Text>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.medium,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  handle: {
    alignSelf: 'center',
    width: ms(40),
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.gray,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(21),
  },
  optionHint: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },
  reasonLabel: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(21),
    color: colors.text.primary,
  },
  loader: {
    paddingVertical: spacing.xl,
  },
  cancelButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  cancelText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    color: colors.text.primary,
  },
});
