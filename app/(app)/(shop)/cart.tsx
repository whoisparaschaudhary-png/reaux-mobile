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
import { useUIStore } from '../../../src/stores/useUIStore';
import { formatCurrency } from '../../../src/utils/formatters';
import { ONLINE_PAYMENT_ENABLED } from '../../../src/utils/constants';
import { colors, fontFamily, borderRadius, spacing, shadows } from '../../../src/theme';
import { ms, mvs } from '../../../src/utils/responsive';
import type { Product } from '../../../src/types/models';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: 'cash-outline' as const },
  { id: 'online', label: 'Pay Online (UPI, card, netbanking)', icon: 'card-outline' as const },
];

export default function CartScreen() {
  const { cart, isLoading, fetchCart, removeFromCart, updateQuantity, cartTotal, selectedAddress } =
    useCartStore();
  const showToast = useUIStore((s) => s.showToast);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('cod');

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, []);

  const handleRemove = useCallback(
    async (productId: string, flavour?: string | null) => {
      await removeFromCart(productId, flavour);
    },
    [removeFromCart],
  );

  // updateQuantity is optimistic and rethrows on failure — catch here so a failed
  // stepper tap surfaces a toast instead of an unhandled rejection + silent revert.
  const handleQty = useCallback(
    (productId: string, quantity: number, flavour?: string | null) => {
      updateQuantity(productId, quantity, flavour).catch((e: any) =>
        showToast(e?.message || 'Failed to update cart', 'error'),
      );
    },
    [updateQuantity, showToast],
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
          // Was router.back(), which only happened to land on the Marketplace
          // depending on how you got here. Navigate explicitly instead.
          onAction={() => router.replace('/(app)/(shop)/')}
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
              </View>

              {items.map((item) => {
                const product = item.product as Product;
                const productId =
                  typeof item.product === 'string'
                    ? item.product
                    : product._id;
                // One product can appear once per flavour, so the key needs both.
                return (
                  <CartItemCard
                    key={`${productId}::${item.flavour ?? ''}`}
                    item={item}
                    onRemove={() => handleRemove(productId, item.flavour)}
                    onIncrement={() => handleQty(productId, item.quantity + 1, item.flavour)}
                    onDecrement={() => handleQty(productId, item.quantity - 1, item.flavour)}
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
              {PAYMENT_METHODS.map((method) => {
                const disabled = method.id === 'online' && !ONLINE_PAYMENT_ENABLED;
                const active = selectedPayment === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentOption,
                      active && styles.paymentOptionActive,
                      disabled && styles.paymentOptionDisabled,
                    ]}
                    activeOpacity={disabled ? 1 : 0.7}
                    disabled={disabled}
                    onPress={() => {
                      if (!disabled) setSelectedPayment(method.id);
                    }}
                  >
                    <Ionicons
                      name={method.icon}
                      size={22}
                      color={active ? colors.text.primary : colors.text.secondary}
                    />
                    <Text
                      style={[styles.paymentLabel, active && styles.paymentLabelActive]}
                    >
                      {method.label}
                    </Text>
                    {disabled ? (
                      <View style={styles.comingSoonPill}>
                        <Text style={styles.comingSoonText}>Coming Soon</Text>
                      </View>
                    ) : (
                      <View style={styles.radioOuter}>
                        {active && <View style={styles.radioInner} />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(shop)/checkout',
                    params: { payment: selectedPayment },
                  })
                }
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
    paddingBottom: mvs(120),
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
    fontSize: ms(18),
    lineHeight: ms(22),
    color: colors.text.primary,
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
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
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
    fontSize: ms(15),
    color: colors.text.primary,
    marginBottom: 2,
  },
  addressText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
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
    fontSize: ms(15),
    color: colors.text.secondary,
    flex: 1,
  },
  paymentLabelActive: {
    color: colors.text.primary,
    fontFamily: fontFamily.bold,
  },
  radioOuter: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    borderWidth: 2,
    borderColor: colors.border.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    backgroundColor: colors.primary.yellow,
  },
  paymentOptionDisabled: {
    opacity: 0.55,
  },
  comingSoonPill: {
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(10),
    lineHeight: ms(14),
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    fontSize: ms(12),
    color: colors.text.secondary,
  },
  totalAmount: {
    fontFamily: fontFamily.bold,
    fontSize: ms(20),
    color: colors.text.primary,
  },
  continueWrap: {
    flex: 1,
  },
});
