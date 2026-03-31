import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { useAdminStore } from '../../../src/stores/useAdminStore';
import { useUIStore } from '../../../src/stores/useUIStore';
import { formatCurrency } from '../../../src/utils/formatters';
import { exportSalesReportPDF } from '../../../src/utils/pdfExport';
import { colors, fontFamily, spacing, borderRadius } from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';

export default function SalesReportScreen() {
  const router = useRouter();
  const { backRoute } = useLocalSearchParams<{ backRoute?: string }>();
  const handleBack = () => backRoute === 'profile' ? router.navigate('/(app)/(profile)') : router.back();
  const { salesReport, isLoading, fetchSalesReport } = useAdminStore();
  const showToast = useUIStore((s) => s.showToast);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchSalesReport();
  }, []);

  // Debug: Log sales report data
  useEffect(() => {
    if (salesReport) {
      console.log('Sales Report Data:', JSON.stringify(salesReport, null, 2));
    }
  }, [salesReport]);

  const handleExportPDF = async () => {
    if (!salesReport) {
      showToast('No data to export', 'error');
      return;
    }

    setIsExporting(true);
    try {
      await exportSalesReportPDF(salesReport);
      showToast('PDF exported successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Sales Report"
          showBack
          onBack={handleBack}
        />

        {isLoading && !salesReport ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
          </View>
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Total Revenue */}
            <Card style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(salesReport?.totalRevenue ?? 0)}
              </Text>
            </Card>

            {/* Monthly Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
              {salesReport?.monthlyBreakdown?.map((month, index) => (
                <View key={index} style={styles.monthRow}>
                  <View style={styles.monthInfo}>
                    <Text style={styles.monthName}>{month.month}</Text>
                    <Text style={styles.monthOrders}>
                      {month.orders} order{month.orders !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.monthRevenue}>
                    {formatCurrency(month.revenue)}
                  </Text>
                </View>
              ))}

              {(!salesReport?.monthlyBreakdown || salesReport.monthlyBreakdown.length === 0) && (
                <Text style={styles.emptyText}>No monthly data available</Text>
              )}
            </View>

            {/* Top Performing Products */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Performing Products</Text>
              {salesReport?.topProducts?.map((item, index) => (
                <Card key={index} style={styles.productCard}>
                  <View style={styles.productRow}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {item.product?.name ?? 'Product'}
                      </Text>
                      <Text style={styles.productSold}>
                        {item.totalSold} sold
                      </Text>
                    </View>
                    <Text style={styles.productRevenue}>
                      {formatCurrency(item.revenue)}
                    </Text>
                  </View>
                </Card>
              ))}

              {(!salesReport?.topProducts || salesReport.topProducts.length === 0) && (
                <Text style={styles.emptyText}>No product data available</Text>
              )}
            </View>

            {/* Export Button */}
            <Button
              title="Export as PDF"
              onPress={handleExportPDF}
              variant="secondary"
              size="lg"
              fullWidth
              loading={isExporting}
              disabled={isExporting}
              leftIcon={
                <Ionicons name="document-text-outline" size={20} color={colors.text.white} />
              }
            />
          </ScrollView>
        )}
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
    paddingBottom: ms(40),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xxl,
    backgroundColor: colors.background.dark,
  },
  revenueLabel: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.white,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  revenueValue: {
    fontFamily: fontFamily.bold,
    fontSize: ms(36),
    lineHeight: ms(44),
    color: colors.primary.yellow,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(18),
    lineHeight: ms(24),
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  monthInfo: {
    flex: 1,
  },
  monthName: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.primary,
  },
  monthOrders: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
    marginTop: 2,
  },
  monthRevenue: {
    fontFamily: fontFamily.bold,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
  productCard: {
    marginBottom: spacing.sm,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: colors.primary.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(13),
    color: colors.text.primary,
  },
  productInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  productName: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.primary,
  },
  productSold: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
    marginTop: 2,
  },
  productRevenue: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.status.success,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.light,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
