import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { useProductStore } from '../../../src/stores/useProductStore';
import { useCartStore } from '../../../src/stores/useCartStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { formatCurrency } from '../../../src/utils/formatters';
import { colors, fontFamily, borderRadius, spacing, shadows, layout } from '../../../src/theme';

const KEY_BENEFITS = ['Muscle Growth', 'Recovery', 'Low Carb', 'Delicious'];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedProduct, isLoading, getProductById, clearSelectedProduct } =
    useProductStore();
  const { addToCart, isLoading: cartLoading } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (id) getProductById(id);
    return () => clearSelectedProduct();
  }, [id]);

  const handleShare = useCallback(async () => {
    if (!selectedProduct) return;
    try {
      await Share.share({
        message: `Check out ${selectedProduct.name} on REAUX Labs! ${formatCurrency(selectedProduct.price)}`,
      });
    } catch {}
  }, [selectedProduct]);

  const handleAddToCart = useCallback(async () => {
    if (!selectedProduct) return;
    await addToCart(selectedProduct._id, 1);
    router.push('/(app)/(shop)/cart');
  }, [selectedProduct]);

  if (isLoading || !selectedProduct) {
    return (
      <SafeScreen>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  const product = selectedProduct;
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100,
      )
    : 0;

  return (
    <SafeScreen>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.images?.[0] }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.text.primary}
              />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons
                name="share-outline"
                size={22}
                color={colors.text.primary}
              />
            </TouchableOpacity>

            {/* Discount Badge */}
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.content}>
            {/* Name & Price */}
            <Text style={styles.name}>{product.name}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatCurrency(product.price)}</Text>
              {hasDiscount && (
                <Text style={styles.comparePrice}>
                  {formatCurrency(product.compareAtPrice!)}
                </Text>
              )}
            </View>

            {product.category && (
              <Text style={styles.category}>{product.category}</Text>
            )}

            {/* Description */}
            {product.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{product.description}</Text>
              </View>
            )}

            {/* Key Benefits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Benefits</Text>
              <View style={styles.tagsRow}>
                {KEY_BENEFITS.map((benefit) => (
                  <Badge key={benefit} text={benefit} variant="primary" />
                ))}
              </View>
            </View>

            {/* Nutritional Information */}
            {product.nutrition && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nutritional Information</Text>
                <View style={styles.nutritionTable}>
                  {[
                    product.nutrition.servingSize && { label: 'Serving Size', value: product.nutrition.servingSize },
                    product.nutrition.calories != null && { label: 'Calories', value: `${product.nutrition.calories} kcal` },
                    product.nutrition.protein != null && { label: 'Protein', value: `${product.nutrition.protein}g` },
                    product.nutrition.carbs != null && { label: 'Carbs', value: `${product.nutrition.carbs}g` },
                    product.nutrition.fat != null && { label: 'Fat', value: `${product.nutrition.fat}g` },
                    product.nutrition.sugar != null && { label: 'Sugar', value: `${product.nutrition.sugar}g` },
                  ]
                    .filter((row): row is { label: string; value: string } => Boolean(row))
                    .map((row, index) => (
                      <View
                        key={row.label}
                        style={[
                          styles.nutritionRow,
                          index % 2 === 0 && styles.nutritionRowAlt,
                        ]}
                      >
                        <Text style={styles.nutritionLabel}>{row.label}</Text>
                        <Text style={styles.nutritionValue}>{row.value}</Text>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={colors.text.primary}
                />
                <Text style={styles.secondaryBtnText}>Share</Text>
              </TouchableOpacity>

              {isAdmin && (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.push({ pathname: '/(app)/(admin)/products/edit', params: { id: product._id, backRoute: 'shop' } })}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={colors.text.primary}
                  />
                  <Text style={styles.secondaryBtnText}>Edit Details</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Add to Cart */}
        <View style={[styles.bottomBar, shadows.card]}>
          <View style={styles.bottomPriceWrap}>
            <Text style={styles.bottomPriceLabel}>Price</Text>
            <Text style={styles.bottomPrice}>
              {formatCurrency(product.price)}
            </Text>
          </View>
          <View style={styles.bottomBtnWrap}>
            <Button
              title="Add to Cart"
              onPress={handleAddToCart}
              loading={cartLoading}
              fullWidth
              size="lg"
              leftIcon={
                <Ionicons
                  name="cart-outline"
                  size={20}
                  color={colors.text.onPrimary}
                />
              }
            />
          </View>
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Image
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.border.light,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backBtn: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  shareBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  discountBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.text.white,
  },

  // Content
  content: {
    padding: spacing.xl,
  },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  price: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.text.primary,
  },
  comparePrice: {
    fontFamily: fontFamily.regular,
    fontSize: 17,
    color: colors.text.light,
    textDecorationLine: 'line-through',
  },
  category: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
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
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  // Nutrition Table
  nutritionTable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.gray,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  nutritionRowAlt: {
    backgroundColor: colors.border.light,
  },
  nutritionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
  nutritionValue: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    backgroundColor: colors.background.white,
  },
  secondaryBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  bottomPriceWrap: {
    marginRight: spacing.lg,
  },
  bottomPriceLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.secondary,
  },
  bottomPrice: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.text.primary,
  },
  bottomBtnWrap: {
    flex: 1,
  },
});
