import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Card } from '../../../../src/components/ui/Card';
import { Badge } from '../../../../src/components/ui/Badge';
import { Button } from '../../../../src/components/ui/Button';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { useOrderStore } from '../../../../src/stores/useOrderStore';
import { useUIStore, showAppAlert } from '../../../../src/stores/useUIStore';
import { formatCurrency, formatDate } from '../../../../src/utils/formatters';
import { exportOrdersListPDF, exportSingleOrderPDF } from '../../../../src/utils/pdfExport';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import type { Order, OrderStatus } from '../../../../src/types/models';

type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'default';
type StatusFilter = 'all' | OrderStatus;

const STATUS_BADGE_MAP: Record<OrderStatus, { variant: BadgeVariant; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'info', label: 'Confirmed' },
  shipped: { variant: 'primary', label: 'Shipped' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'error', label: 'Cancelled' },
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { orders, isLoading, isUpdating, fetchAllOrders, updateOrderStatus } = useOrderStore();
  const showToast = useUIStore((s) => s.showToast);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportingOrderId, setExportingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAllOrders();
    setIsRefreshing(false);
  }, [fetchAllOrders]);

  const handleToggleExpand = useCallback((orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  }, []);

  const handleStatusChange = useCallback(
    (order: Order, newStatus: OrderStatus) => {
      const statusLabel = STATUS_BADGE_MAP[newStatus].label;
      showAppAlert(
        'Update Order Status',
        `Change status from "${STATUS_BADGE_MAP[order.status].label}" to "${statusLabel}" for order ...${order._id.slice(-6)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Update',
            onPress: async () => {
              try {
                await updateOrderStatus(order._id, newStatus);
                setExpandedOrderId(null);
              } catch {
                showAppAlert('Error', 'Failed to update order status. Please try again.');
              }
            },
          },
        ],
      );
    },
    [updateOrderStatus],
  );

  const getCustomerName = (order: Order): string => {
    if (typeof order.userId === 'object' && order.userId !== null) {
      return order.userId.name || 'Unknown';
    }
    return 'Customer';
  };

  const handleExportAllPDF = async () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      showToast('No orders to export', 'error');
      return;
    }

    setIsExporting(true);
    try {
      await exportOrdersListPDF(filteredOrders);
      showToast('PDF exported successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSingleOrder = async (order: Order) => {
    setExportingOrderId(order._id);
    try {
      await exportSingleOrderPDF(order);
      showToast('Invoice exported successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export invoice', 'error');
    } finally {
      setExportingOrderId(null);
    }
  };

  const filteredOrders = activeFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === activeFilter);

  const renderStatusChip = (order: Order, status: OrderStatus) => {
    const { variant, label } = STATUS_BADGE_MAP[status];
    const isCurrentStatus = order.status === status;

    return (
      <TouchableOpacity
        key={status}
        style={[
          styles.statusChip,
          isCurrentStatus && styles.statusChipDisabled,
        ]}
        onPress={() => handleStatusChange(order, status)}
        disabled={isCurrentStatus || isUpdating}
        activeOpacity={0.7}
      >
        <Badge text={label} variant={variant} size="sm" />
      </TouchableOpacity>
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isExpanded = expandedOrderId === item._id;
    const availableTransitions = STATUS_TRANSITIONS[item.status];
    const statusInfo = STATUS_BADGE_MAP[item.status];

    return (
      <Card
        style={styles.orderCard}
        onPress={() => handleToggleExpand(item._id)}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdRow}>
            <Ionicons name="receipt-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
          </View>
          <Badge text={statusInfo.label} variant={statusInfo.variant} />
        </View>

        {/* Order Details */}
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.customerName}>{getCustomerName(item)}</Text>
            <Text style={styles.orderAmount}>{formatCurrency(item.finalAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.itemCount}>
              {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
          {item.discount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.discountText}>
                Discount: {formatCurrency(item.discount)}
                {item.promoCode ? ` (${item.promoCode})` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Expand Indicator */}
        <View style={styles.expandIndicator}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.text.light}
          />
        </View>

        {/* Expanded Status Update Section */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {/* Order Items */}
            <View style={styles.itemsList}>
              <Text style={styles.itemsTitle}>Items</Text>
              {item.items.map((orderItem, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {orderItem.name}
                  </Text>
                  <Text style={styles.itemQty}>x{orderItem.quantity}</Text>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(orderItem.price * orderItem.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Shipping Address */}
            {item.shippingAddress && (
              <View style={styles.addressSection}>
                <Text style={styles.itemsTitle}>Shipping Address</Text>
                <Text style={styles.addressText}>
                  {item.shippingAddress.street}, {item.shippingAddress.city}
                </Text>
                <Text style={styles.addressText}>
                  {item.shippingAddress.state} - {item.shippingAddress.pincode}
                </Text>
                {item.shippingAddress.phone && (
                  <Text style={styles.addressText}>
                    Phone: {item.shippingAddress.phone}
                  </Text>
                )}
              </View>
            )}

            {/* Export Invoice Button */}
            <View style={styles.exportInvoiceSection}>
              <Button
                title="Export Invoice"
                onPress={() => handleExportSingleOrder(item)}
                variant="outline"
                size="md"
                fullWidth
                loading={exportingOrderId === item._id}
                disabled={exportingOrderId === item._id}
                leftIcon={
                  <Ionicons name="download-outline" size={18} color={colors.text.primary} />
                }
              />
            </View>

            {/* Status Update */}
            {availableTransitions.length > 0 ? (
              <View style={styles.statusUpdateSection}>
                <Text style={styles.statusUpdateTitle}>Update Status</Text>
                <View style={styles.statusChipsRow}>
                  {availableTransitions.map((status) =>
                    renderStatusChip(item, status),
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.statusUpdateSection}>
                <Text style={styles.statusFinalText}>
                  {item.status === 'delivered'
                    ? 'This order has been delivered'
                    : 'This order has been cancelled'}
                </Text>
              </View>
            )}

            {isUpdating && (
              <View style={styles.updatingOverlay}>
                <ActivityIndicator size="small" color={colors.primary.yellow} />
                <Text style={styles.updatingText}>Updating...</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Orders"
          showBack
          onBack={() => router.back()}
        />

        <View style={styles.container}>
          {/* Filter Tabs */}
          <View style={styles.tabScrollContainer}>
            <FlashList
              data={FILTER_TABS}
              horizontal
              estimatedItemSize={80}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabContent}
              renderItem={({ item: tab }) => (
                <TouchableOpacity
                  style={[styles.tab, activeFilter === tab.key && styles.tabActive]}
                  onPress={() => setActiveFilter(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeFilter === tab.key && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Order List */}
          <View style={styles.listContainer}>
            <FlashList
              data={filteredOrders}
              renderItem={renderOrderItem}
              estimatedItemSize={140}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
              ListEmptyComponent={
                isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary.yellow} />
                  </View>
                ) : (
                  <EmptyState
                    icon="receipt-outline"
                    title="No orders found"
                    message={
                      activeFilter === 'all'
                        ? 'Orders will appear here once customers place them'
                        : `No ${activeFilter} orders`
                    }
                  />
                )
              }
              ListFooterComponent={
                filteredOrders.length > 0 ? (
                  <View style={styles.exportButtonContainer}>
                    <Button
                      title="Export as PDF"
                      onPress={handleExportAllPDF}
                      variant="secondary"
                      size="lg"
                      fullWidth
                      loading={isExporting}
                      disabled={isExporting}
                      leftIcon={
                        <Ionicons name="document-text-outline" size={20} color={colors.text.white} />
                      }
                    />
                  </View>
                ) : null
              }
              extraData={expandedOrderId}
            />
          </View>
        </View>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabScrollContainer: {
    height: 44,
    paddingLeft: spacing.xl,
    marginBottom: spacing.md,
  },
  tabContent: {
    paddingRight: spacing.xl,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    marginRight: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.background.dark,
  },
  tabText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.white,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  orderCard: {
    marginTop: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  orderId: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  orderDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  orderAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  orderDate: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
  },
  itemCount: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
  },
  discountText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.status.success,
  },
  expandIndicator: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  expandedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  itemsList: {
    marginBottom: spacing.md,
  },
  itemsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  itemName: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.primary,
  },
  itemQty: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    marginHorizontal: spacing.md,
  },
  itemPrice: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.primary,
    minWidth: 60,
    textAlign: 'right',
  },
  addressSection: {
    marginBottom: spacing.md,
  },
  addressText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  statusUpdateSection: {
    marginTop: spacing.xs,
  },
  statusUpdateTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusChip: {
    opacity: 1,
  },
  statusChipDisabled: {
    opacity: 0.4,
  },
  statusFinalText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.light,
    fontStyle: 'italic',
  },
  updatingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  updatingText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  exportInvoiceSection: {
    marginBottom: spacing.md,
  },
  exportButtonContainer: {
    marginTop: spacing.xxl,
  },
});
