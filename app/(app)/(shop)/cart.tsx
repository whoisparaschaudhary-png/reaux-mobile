import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Button } from '../../../src/components/ui/Button';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { CartItemCard } from '../../../src/components/cards/CartItemCard';
import { useCartStore } from '../../../src/stores/useCartStore';
import { formatCurrency } from '../../../src/utils/formatters';
import { colors, fontFamily, borderRadius, spacing, shadows } from '../../../src/theme';
import type { Product } from '../../../src/types/models';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: 'cash-outline' as const },
];

export default function CartScreen() {
  const { cart, isLoading, fetchCart, removeFromCart, cartTotal, selectedAddress, loadSavedAddress } = useCartStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('cod');

  useEffect(() => {
    fetchCart();
    loadSavedAddress();
  }, [fetchCart, loadSavedAddress]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, []);

  const handleRemove = useCallback(
    async (productId: string) => {
      await removeFromCart(productId);
    },
    [],
  );

  const total = cartTotal();
  const items = cart?.items ?? [];
  const hasItems = items.length > 0;

  if (isLoading && !cart) {
    return (
      <SafeScreen>
        <Header title="Your Order" showBack onBack={() => router.back()} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <Header title="Your Order" showBack onBack={() => router.back()} />

      {!hasItems ? (
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Browse the marketplace and add products to your cart"
          actionLabel="Browse Products"
          onAction={() => router.back()}
        />
      ) : (
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary.yellow}
              />
            }
          >
            {/* Cart Items */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Items ({items.length})
                </Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>

              {items.map((item) => {
                const product = item.product as Product;
                const productId =
                  typeof item.product === 'string'
                    ? item.product
                    : product._id;
                return (
                  <CartItemCard
                    key={productId}
                    item={item}
                    onRemove={() => handleRemove(productId)}
                  />
                );
              })}
            </View>

            {/* Shipping Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <TouchableOpacity
                style={styles.addressCard}
                activeOpacity={0.7}
                onPress={() => router.push('/(app)/(shop)/address')}
              >
                <View style={styles.addressIcon}>
                  <Ionicons
                    name="location"
                    size={20}
                    color={colors.primary.yellow}
                  />
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Home</Text>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {selectedAddress
                      ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`
                      : 'Add your shipping address'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.light}
                />
              </TouchableOpacity>
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentOption,
                    selectedPayment === method.id &&
                      styles.paymentOptionActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedPayment(method.id)}
                >
                  <Ionicons
                    name={method.icon}
                    size={22}
                    color={
                      selectedPayment === method.id
                        ? colors.text.primary
                        : colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.paymentLabel,
                      selectedPayment === method.id &&
                        styles.paymentLabelActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                  <View style={styles.radioOuter}>
                    {selectedPayment === method.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Bar */}
          <View style={[styles.bottomBar, shadows.card]}>
            <View style={styles.totalWrap}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
            </View>
            <View style={styles.continueWrap}>
              <Button
                title="Continue"
                onPress={() => router.push('/(app)/(shop)/checkout')}
                fullWidth
                size="lg"
              />
            </View>
          </View>
        </View>
      )}
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },

  // Sections
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  editLink: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.primary.yellowDark,
    marginBottom: spacing.md,
  },

  // Address
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 2,
  },
  addressText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.text.secondary,
  },

  // Payment
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    gap: spacing.md,
  },
  paymentOptionActive: {
    borderColor: colors.primary.yellow,
    backgroundColor: colors.primary.yellowLight + '20',
  },
  paymentLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.text.secondary,
    flex: 1,
  },
  paymentLabelActive: {
    color: colors.text.primary,
    fontFamily: fontFamily.bold,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.yellow,
  },

  // Bottom
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
  totalWrap: {
    marginRight: spacing.lg,
  },
  totalLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.secondary,
  },
  totalAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.text.primary,
  },
  continueWrap: {
    flex: 1,
  },
});
