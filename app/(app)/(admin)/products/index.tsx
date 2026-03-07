import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Card } from '../../../../src/components/ui/Card';
import { Badge } from '../../../../src/components/ui/Badge';
import { Button } from '../../../../src/components/ui/Button';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { useProductStore } from '../../../../src/stores/useProductStore';
import { useUIStore, showAppAlert } from '../../../../src/stores/useUIStore';
import { productsApi } from '../../../../src/api/endpoints/products';
import { exportProductsListPDF } from '../../../../src/utils/pdfExport';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import type { Product } from '../../../../src/types/models';

export default function ProductListScreen() {
  const router = useRouter();
  const { products, isLoading, fetchProducts } = useProductStore();
  const showToast = useUIStore((s) => s.showToast);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchProducts();
    setIsRefreshing(false);
  }, [fetchProducts]);

  const formatPrice = (price: number) => `Rs ${price.toLocaleString()}`;

  const handleToggleActive = useCallback(
    (product: Product) => {
      const newStatus = !product.isActive;
      const action = newStatus ? 'activate' : 'deactivate';

      const performToggle = async () => {
        setTogglingIds((prev) => new Set(prev).add(product._id));
        try {
          await productsApi.update(product._id, { isActive: newStatus });
          await fetchProducts();
        } catch {
          showAppAlert('Error', `Failed to ${action} product.`);
        } finally {
          setTogglingIds((prev) => {
            const next = new Set(prev);
            next.delete(product._id);
            return next;
          });
        }
      };

      if (!newStatus) {
        showAppAlert(
          'Deactivate Product',
          `Are you sure you want to deactivate "${product.name}"? It will be hidden from the shop.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Deactivate', style: 'destructive', onPress: performToggle },
          ]
        );
      } else {
        performToggle();
      }
    },
    [fetchProducts]
  );

  const handleExportPDF = async () => {
    if (!products || products.length === 0) {
      showToast('No products to export', 'error');
      return;
    }

    setIsExporting(true);
    try {
      await exportProductsListPDF(products);
      showToast('PDF exported successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const isToggling = togglingIds.has(item._id);

    return (
      <Card
        style={styles.productCard}
        onPress={() => router.push(`/(app)/(admin)/products/edit?id=${item._id}`)}
      >
        <View style={styles.productRow}>
          {item.images?.[0] ? (
            <Image
              source={{ uri: item.images[0] }}
              style={styles.productImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.productImage, styles.productImagePlaceholder]}>
              <Ionicons name="cube-outline" size={24} color={colors.text.light} />
            </View>
          )}

          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
              {item.compareAtPrice ? (
                <Text style={styles.comparePrice}>
                  {formatPrice(item.compareAtPrice)}
                </Text>
              ) : null}
            </View>
            <View style={styles.metaRow}>
              {item.category && (
                <Text style={styles.categoryText}>{item.category}</Text>
              )}
              <Text style={styles.stockText}>Stock: {item.stock}</Text>
            </View>
          </View>

          <View style={styles.statusColumn}>
            <Badge
              text={item.isActive ? 'Active' : 'Hidden'}
              variant={item.isActive ? 'success' : 'error'}
            />
            <TouchableOpacity
              onPress={() => handleToggleActive(item)}
              disabled={isToggling}
              style={[
                styles.toggleButton,
                item.isActive ? styles.toggleDeactivate : styles.toggleActivate,
                isToggling && styles.toggleDisabled,
              ]}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons
                name={item.isActive ? 'eye-off-outline' : 'eye-outline'}
                size={14}
                color={item.isActive ? colors.status.error : colors.status.success}
              />
              <Text
                style={[
                  styles.toggleText,
                  { color: item.isActive ? colors.status.error : colors.status.success },
                ]}
              >
                {isToggling ? '...' : item.isActive ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Products"
          showBack
          onBack={() => router.back()}
          rightAction={
            <TouchableOpacity
              onPress={() => router.push('/(app)/(admin)/products/create')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />

        <View style={styles.listContainer}>
          <FlashList
            data={products}
            renderItem={renderProductItem}
            estimatedItemSize={100}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              !isLoading ? (
                <EmptyState
                  icon="cube-outline"
                  title="No products yet"
                  message="Add your first product to the shop"
                />
              ) : null
            }
            ListFooterComponent={
              products.length > 0 ? (
                <View style={styles.exportButtonContainer}>
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
                </View>
              ) : null
            }
          />
        </View>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  productCard: {
    marginTop: spacing.md,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
  productImagePlaceholder: {
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  productPrice: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  comparePrice: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
  },
  categoryText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  stockText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
  },
  statusColumn: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  toggleActivate: {
    borderColor: colors.status.success,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  toggleDeactivate: {
    borderColor: colors.status.error,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  exportButtonContainer: {
    marginTop: spacing.xxl,
  },
});
