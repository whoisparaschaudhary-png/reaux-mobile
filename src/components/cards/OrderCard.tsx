import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, borderRadius, spacing, shadows } from '../../theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Order, OrderStatus } from '../../types/models';

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: '#fef3c7', text: '#92400e' },
  confirmed: { label: 'Confirmed', bg: '#dbeafe', text: '#1e40af' },
  shipped: { label: 'Shipped', bg: '#ede9fe', text: '#5b21b6' },
  delivered: { label: 'Delivered', bg: '#dcfce7', text: '#166534' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', text: '#991b1b' },
};

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const status = statusConfig[order.status] ?? statusConfig.pending;
  const itemCount = (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, shadows.card]}
    >
      <View style={styles.topRow}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId} numberOfLines={1}>
            Order #{order._id?.slice(-8).toUpperCase()}
          </Text>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg || '#f0f0f0' }]}>
          <Text style={[styles.statusText, { color: status.text }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.detailItem}>
          <Ionicons name="cube-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(order.finalAmount)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
      </View>
    </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  orderId: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: 2,
  },
  date: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.text.primary,
  },
});
