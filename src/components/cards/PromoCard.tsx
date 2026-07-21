import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { colors, fontFamily, spacing, borderRadius } from '../../theme';
import { formatDate } from '../../utils/formatters';
import { ms } from '../../utils/responsive';
import type { PromoCode } from '../../types/models';

interface PromoCardProps {
  promo: PromoCode;
  onEdit?: (promo: PromoCode) => void;
  onPress?: (promo: PromoCode) => void;
}

const getPromoStatus = (promo: PromoCode): { text: string; variant: 'success' | 'error' | 'warning' } => {
  if (!promo.isActive) return { text: 'Inactive', variant: 'error' };

  if (promo.validUntil) {
    const now = new Date();
    const expiry = new Date(promo.validUntil);
    if (expiry < now) return { text: 'Expired', variant: 'error' };
  }

  if (promo.validFrom) {
    const now = new Date();
    const start = new Date(promo.validFrom);
    if (start > now) return { text: 'Scheduled', variant: 'warning' };
  }

  return { text: 'Active', variant: 'success' };
};

export const PromoCard: React.FC<PromoCardProps> = ({ promo, onEdit, onPress }) => {
  const status = getPromoStatus(promo);

  const discountText =
    promo.discountType === 'percentage'
      ? `${promo.discountValue}% OFF`
      : `₹${promo.discountValue} OFF`;

  const dateRange = [
    promo.validFrom ? formatDate(promo.validFrom) : null,
    promo.validUntil ? formatDate(promo.validUntil) : null,
  ]
    .filter(Boolean)
    .join(' - ');

  return (
    <Card
      style={styles.card}
      onPress={onPress ? () => onPress(promo) : undefined}
    >
      <View style={styles.topRow}>
        <View style={styles.codeContainer}>
          <Text style={styles.code}>{promo.code}</Text>
        </View>
        <Badge text={status.text} variant={status.variant} size="sm" />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.discountBadge}>
          <Ionicons name="pricetag-outline" size={ms(14)} color={colors.primary.yellowDark} />
          <Text style={styles.discountText}>{discountText}</Text>
        </View>

        {promo.usageLimit != null && (
          <Text style={styles.usageText}>
            {promo.usedCount}/{promo.usageLimit} used
          </Text>
        )}
      </View>

      {dateRange.length > 0 && (
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={ms(14)} color={colors.text.light} />
          <Text style={styles.dateText}>{dateRange}</Text>
        </View>
      )}

      {onEdit && (
        <TouchableOpacity
          onPress={() => onEdit(promo)}
          style={styles.editButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={ms(20)} color={colors.text.secondary} />
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  codeContainer: {
    backgroundColor: colors.primary.yellowLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  code: {
    fontFamily: fontFamily.bold,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
    letterSpacing: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  discountText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.primary.yellowDark,
  },
  usageText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },
  dateText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.light,
  },
  editButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: ms(32),
    height: ms(32),
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
