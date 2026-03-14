import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
import { showAppAlert } from '../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius } from '../../../src/theme';

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

export default function AddressScreen() {
  const [form, setForm] = useState({
    fullName: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStatePicker, setShowStatePicker] = useState(false);

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.street.trim()) newErrors.street = 'Street address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!form.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (form.phone.trim().length !== 10) newErrors.phone = 'Enter a valid 10-digit number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const setSelectedAddress = useCartStore((s) => s.setSelectedAddress);

  const handleSave = useCallback(() => {
    if (!validate()) return;

    const streetLine = [form.street.trim(), form.apartment.trim()].filter(Boolean).join(', ');
    setSelectedAddress({
      street: streetLine || form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      phone: form.phone.trim(),
    });
    showAppAlert('Address Saved', 'Your shipping address has been saved.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [validate, setSelectedAddress, form.street, form.apartment, form.city, form.state, form.pincode, form.phone]);

  return (
    <SafeScreen>
      <Header title="Add Address" showBack onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Enter your shipping address details below
          </Text>

          <Input
            label="Full Name"
            placeholder="John Doe"
            value={form.fullName}
            onChangeText={(t) => updateField('fullName', t)}
            error={errors.fullName}
          />
          <View style={styles.spacer} />

          <Input
            label="Street Address"
            placeholder="123 Main Street"
            value={form.street}
            onChangeText={(t) => updateField('street', t)}
            error={errors.street}
          />
          <View style={styles.spacer} />

          <Input
            label="Apartment / Suite (optional)"
            placeholder="Apt 4B"
            value={form.apartment}
            onChangeText={(t) => updateField('apartment', t)}
          />
          <View style={styles.spacer} />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="City"
                placeholder="Bangalore"
                value={form.city}
                onChangeText={(t) => updateField('city', t)}
                error={errors.city}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>State</Text>
              <TouchableOpacity
                style={[styles.stateDropdown, errors.state ? styles.stateDropdownError : null]}
                onPress={() => setShowStatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.stateDropdownText, !form.state && styles.statePlaceholder]}>
                  {form.state || 'Select State'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.text.light} />
              </TouchableOpacity>
              {errors.state ? <Text style={styles.errorText}>{errors.state}</Text> : null}
            </View>
          </View>
          <View style={styles.spacer} />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Pincode"
                placeholder="560001"
                value={form.pincode}
                onChangeText={(t) => updateField('pincode', t)}
                keyboardType="number-pad"
                error={errors.pincode}
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Phone (10 digits)"
                placeholder="9876543210"
                value={form.phone}
                onChangeText={(t) => updateField('phone', t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={10}
                error={errors.phone}
              />
            </View>
          </View>

          <View style={styles.buttonWrap}>
            <Button
              title="Save Address"
              onPress={handleSave}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
                  style={[styles.stateOption, form.state === item && styles.stateOptionActive]}
                  onPress={() => {
                    updateField('state', item);
                    setShowStatePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stateOptionText, form.state === item && styles.stateOptionTextActive]}>
                    {item}
                  </Text>
                  {form.state === item && (
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
  },
  spacer: {
    height: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
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
  stateDropdownError: {
    borderColor: colors.status.error,
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
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.status.error,
    marginTop: spacing.xs,
  },
  buttonWrap: {
    marginTop: spacing.xxxl,
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
