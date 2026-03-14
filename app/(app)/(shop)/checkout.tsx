import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { useCartStore } from '../../../src/stores/useCartStore';
import { useOrderStore } from '../../../src/stores/useOrderStore';
import { addressesApi } from '../../../src/api/endpoints/users';
import { showAppAlert } from '../../../src/stores/useUIStore';
import { formatCurrency } from '../../../src/utils/formatters';
import { colors, fontFamily, borderRadius, spacing, shadows } from '../../../src/theme';
import type { Product, SavedAddress } from '../../../src/types/models';
import type { ShippingAddressState } from '../../../src/stores/useCartStore';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const emptyAddress: ShippingAddressState = {
  street: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
};

export default function CheckoutScreen() {
  const { cart, cartTotal, fetchCart, selectedAddress } = useCartStore();
  const { createOrder, isLoading: orderLoading } = useOrderStore();

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [address, setAddress] = useState<ShippingAddressState>(emptyAddress);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  // Load saved addresses from API + prefill default
  useEffect(() => {
    addressesApi.list().then((res) => {
      const list = res.data ?? [];
      setSavedAddresses(list);
      const defaultAddr = list.find((a) => a.isDefault) ?? list[0];
      if (defaultAddr && !selectedAddress) {
        setAddress({ street: defaultAddr.street, city: defaultAddr.city, state: defaultAddr.state, pincode: defaultAddr.pincode, phone: defaultAddr.phone });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedAddress) setAddress(selectedAddress);
  }, [selectedAddress]);

  const total = cartTotal();
  const finalAmount = total - discount;
  const items = cart?.items ?? [];

  const handlePlaceOrder = useCallback(async () => {
    if (!address.street || !address.city || !address.state || !address.pincode || !address.phone) {
      showAppAlert('Missing Address', 'Please fill in all address fields to continue.');
      return;
    }

    try {
      const order = await createOrder({
        shippingAddress: address,
        promoCode: promoCode || undefined,
      });
      await fetchCart();
      showAppAlert('Order Placed!', `Your order #${order._id?.slice(-8).toUpperCase() ?? ''} has been placed successfully.`, [
        { text: 'View Orders', onPress: () => router.replace('/(app)/(shop)/orders') },
        { text: 'OK', onPress: () => router.replace('/(app)/(shop)/') },
      ]);
    } catch (err: any) {
      showAppAlert('Order Failed', err.message || 'Something went wrong. Please try again.');
    }
  }, [address, promoCode]);

  return (
    <SafeScreen>
      <Header title="Checkout" showBack onBack={() => router.back()} />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryCard}>
              {items.map((item) => {
                const product = item.product as Product;
                const isPopulated = typeof product === 'object' && product !== null;
                const name = isPopulated ? product.name : 'Product';
                const price = isPopulated ? product.price : 0;
                const productId = isPopulated ? product._id : (item.product as string);
                return (
                  <View key={productId} style={styles.summaryRow}>
                    <Text style={styles.summaryName} numberOfLines={1}>
                      {name} x{item.quantity}
                    </Text>
                    <Text style={styles.summaryPrice}>
                      {formatCurrency(price * item.quantity)}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.status.success }]}>
                    Discount
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.status.success }]}>
                    -{formatCurrency(discount)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryFree}>FREE</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(finalAmount)}</Text>
              </View>
            </View>
          </View>

          {/* Promo Code */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Promo Code</Text>
            <View style={styles.promoRow}>
              <View style={styles.promoInput}>
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChangeText={setPromoCode}
                />
              </View>
              <Button
                title="Apply"
                onPress={() => router.push('/(app)/(shop)/promo')}
                variant="outline"
                size="md"
              />
            </View>
          </View>

          {/* Shipping Address */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <View style={styles.addressActions}>
                {savedAddresses.length > 1 && (
                  <TouchableOpacity
                    onPress={() => setShowAddressPicker(true)}
                    activeOpacity={0.7}
                    style={styles.addressActionBtn}
                  >
                    <Text style={styles.changeLink}>Saved ({savedAddresses.length})</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => router.push('/(app)/(shop)/address')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeLink}>Add New</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Input
              label="Street Address"
              placeholder="123 Main Street"
              value={address.street}
              onChangeText={(t) => setAddress((a) => ({ ...a, street: t }))}
            />
            <View style={styles.inputSpacer} />
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="City"
                  placeholder="City"
                  value={address.city}
                  onChangeText={(t) => setAddress((a) => ({ ...a, city: t }))}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>State</Text>
                <TouchableOpacity
                  style={styles.stateDropdown}
                  onPress={() => setShowStatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stateDropdownText, !address.state && styles.statePlaceholder]}>
                    {address.state || 'Select State'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.text.light} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputSpacer} />
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Pincode"
                  placeholder="560001"
                  value={address.pincode}
                  onChangeText={(t) => setAddress((a) => ({ ...a, pincode: t }))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Phone (10 digits)"
                  placeholder="9876543210"
                  value={address.phone}
                  onChangeText={(t) => setAddress((a) => ({ ...a, phone: t.replace(/\D/g, '') }))}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          {/* Payment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentCard}>
              <View style={styles.paymentOption}>
                <View style={styles.paymentIconCircle}>
                  <Ionicons name="cash-outline" size={24} color={colors.primary.yellowDark} />
                </View>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentMethodName}>Cash on Delivery</Text>
                  <Text style={styles.paymentMethodDesc}>
                    Pay when you receive your order
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Place Order Button */}
        <View style={[styles.bottomBar, shadows.card]}>
          <View style={styles.bottomTotal}>
            <Text style={styles.bottomTotalLabel}>Total</Text>
            <Text style={styles.bottomTotalAmount}>{formatCurrency(finalAmount)}</Text>
          </View>
          <View style={styles.placeOrderWrap}>
            <Button
              title="Place Order"
              onPress={handlePlaceOrder}
              loading={orderLoading}
              fullWidth
              size="lg"
              leftIcon={
                <Ionicons name="checkmark-circle" size={20} color={colors.text.onPrimary} />
              }
            />
          </View>
        </View>
      </View>

      {/* Saved Address Picker Modal */}
      <Modal
        visible={showAddressPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddressPicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Saved Address</Text>
            <FlatList
              data={savedAddresses}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.addressOption,
                    address.street === item.street && address.pincode === item.pincode && styles.addressOptionActive,
                  ]}
                  onPress={() => {
                    setAddress({ street: item.street, city: item.city, state: item.state, pincode: item.pincode, phone: item.phone });
                    setShowAddressPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location-outline" size={18} color={colors.primary.yellowDark} />
                  <View style={styles.addressOptionText}>
                    <Text style={styles.addressOptionStreet} numberOfLines={1}>{item.label} — {item.street}</Text>
                    <Text style={styles.addressOptionDetail}>{item.city}, {item.state} - {item.pincode}</Text>
                    <Text style={styles.addressOptionPhone}>{item.phone}</Text>
                  </View>
                  {address.street === item.street && address.pincode === item.pincode && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary.yellowDark} />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatePicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select State</Text>
            <FlatList
              data={INDIAN_STATES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.stateOption, address.state === item && styles.stateOptionActive]}
                  onPress={() => {
                    setAddress((a) => ({ ...a, state: item }));
                    setShowStatePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stateOptionText, address.state === item && styles.stateOptionTextActive]}>
                    {item}
                  </Text>
                  {address.state === item && (
                    <Ionicons name="checkmark" size={18} color={colors.primary.yellowDark} />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  addressActions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  addressActionBtn: {},
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  addressOptionActive: {
    backgroundColor: colors.primary.yellowLight,
  },
  addressOptionText: {
    flex: 1,
  },
  addressOptionStreet: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
  addressOptionDetail: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  addressOptionPhone: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.light,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  changeLink: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.primary.yellowDark,
    marginBottom: spacing.md,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryName: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  summaryPrice: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
  summaryFree: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.status.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.text.primary,
  },
  totalValue: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.text.primary,
  },

  // Promo
  promoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  promoInput: {
    flex: 1,
  },

  // Inputs
  inputSpacer: {
    height: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },

  // Payment
  paymentCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    borderWidth: 2,
    borderColor: colors.primary.yellow,
    overflow: 'hidden',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  paymentIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: 2,
  },
  paymentMethodDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
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
  bottomTotal: {
    marginRight: spacing.lg,
  },
  bottomTotalLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.secondary,
  },
  bottomTotalAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.text.primary,
  },
  placeOrderWrap: {
    flex: 1,
  },
  // State dropdown
  fieldLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  stateDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.white,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  stateDropdownText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text.primary,
    flex: 1,
  },
  statePlaceholder: {
    color: colors.text.light,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border.gray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  stateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  stateOptionActive: {
    backgroundColor: colors.primary.yellowLight,
  },
  stateOptionText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text.primary,
  },
  stateOptionTextActive: {
    fontFamily: fontFamily.medium,
  },
});
