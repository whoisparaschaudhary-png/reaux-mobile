import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Button } from '../../../../src/components/ui/Button';
import { Badge } from '../../../../src/components/ui/Badge';
import { useOrderStore } from '../../../../src/stores/useOrderStore';
import { useUIStore } from '../../../../src/stores/useUIStore';
import { exportSingleOrderPDF } from '../../../../src/utils/pdfExport';
import { formatCurrency, formatDate } from '../../../../src/utils/formatters';
import { colors, fontFamily, borderRadius, spacing, shadows } from '../../../../src/theme';
import type { OrderStatus } from '../../../../src/types/models';

const statusBadgeVariant: Record<OrderStatus, 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error',
};

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedOrder, isLoading, getOrderById, clearSelectedOrder } =
    useOrderStore();
  const showToast = useUIStore((s) => s.showToast);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (id) getOrderById(id);
    return () => clearSelectedOrder();
  }, [id]);

  const handleDownloadPDF = useCallback(async () => {
    if (!selectedOrder) return;
    setPdfLoading(true);
    try {
      await exportSingleOrderPDF(selectedOrder);
      showToast('Invoice PDF ready to share or save', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  }, [selectedOrder, showToast]);

  if (isLoading || !selectedOrder) {
    return (
      <SafeScreen>
        <Header title="Invoice" showBack onBack={() => router.back()} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  const order = selectedOrder;
  const orderId = order._id?.slice(-8).toUpperCase() ?? '';
  const itemCount = (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeScreen>
      <Header
        title="Invoice"
        showBack
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            onPress={handleDownloadPDF}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="download-outline"
              size={22}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Invoice Header */}
        <View style={[styles.invoiceHeader, shadows.card]}>
          <View style={styles.invoiceHeaderTop}>
            <View>
              <Text style={styles.invoiceLabel}>Order Number</Text>
              <Text style={styles.invoiceId}>#{orderId}</Text>
            </View>
            <Badge
              text={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              variant={statusBadgeVariant[order.status] ?? 'default'}
            />
          </View>
          <View style={styles.invoiceMeta}>
            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.text.secondary}
              />
              <Text style={styles.metaText}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name="cube-outline"
                size={16}
                color={colors.text.secondary}
              />
              <Text style={styles.metaText}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colName]}>Item</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Price</Text>
            </View>

            {/* Table Rows */}
            {(order.items ?? []).map((item, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowAlt,
                ]}
              >
                <Text style={[styles.tableCell, styles.colQty]}>
                  {item.quantity}
                </Text>
                <Text
                  style={[styles.tableCell, styles.colName]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(order.totalAmount)}
              </Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.status.success }]}>
                  Discount
                  {order.promoCode ? ` (${order.promoCode})` : ''}
                </Text>
                <Text style={[styles.totalValue, { color: colors.status.success }]}>
                  -{formatCurrency(order.discount)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalFree}>FREE</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(order.finalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.infoCard}>
            <Ionicons name="card-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.infoText}>Razorpay</Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.infoCard}>
            <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
            <View style={styles.addressWrap}>
              <Text style={styles.infoText}>
                {order.shippingAddress?.street}
              </Text>
              <Text style={styles.infoTextSub}>
                {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                {order.shippingAddress?.pincode}
              </Text>
              {order.shippingAddress?.phone && (
                <Text style={styles.infoTextSub}>
                  {order.shippingAddress.phone}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Download Button */}
        <View style={styles.downloadWrap}>
          <Button
            title="Download PDF"
            onPress={handleDownloadPDF}
            fullWidth
            size="lg"
            loading={pdfLoading}
            disabled={pdfLoading}
            leftIcon={
              !pdfLoading ? (
                <Ionicons
                  name="document-outline"
                  size={20}
                  color={colors.text.onPrimary}
                />
              ) : undefined
            }
          />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },

  // Invoice Header
  invoiceHeader: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  invoiceHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  invoiceLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  invoiceId: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.text.primary,
  },
  invoiceMeta: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },

  // Sections
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  // Table
  table: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.gray,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background.dark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tableHeaderText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.text.white,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tableRowAlt: {
    backgroundColor: colors.border.light,
  },
  tableCell: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.primary,
  },
  colQty: {
    width: 40,
    textAlign: 'center',
  },
  colName: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  colPrice: {
    width: 90,
    textAlign: 'right',
  },

  // Totals
  totalsCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalValue: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
  totalFree: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.status.success,
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  grandTotalLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.text.primary,
  },
  grandTotalValue: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.text.primary,
  },

  // Info Cards
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.md,
  },
  addressWrap: {
    flex: 1,
  },
  infoText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
  infoTextSub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Download
  downloadWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
});
