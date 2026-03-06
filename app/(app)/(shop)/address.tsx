import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { useCartStore } from '../../../src/stores/useCartStore';
import { colors, fontFamily, spacing } from '../../../src/theme';

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
    Alert.alert('Address Saved', 'Your shipping address has been saved.', [
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
              <Input
                label="State / Province"
                placeholder="Karnataka"
                value={form.state}
                onChangeText={(t) => updateField('state', t)}
                error={errors.state}
              />
            </View>
          </View>
          <View style={styles.spacer} />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Zip / Postal Code"
                placeholder="560001"
                value={form.pincode}
                onChangeText={(t) => updateField('pincode', t)}
                keyboardType="number-pad"
                error={errors.pincode}
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChangeText={(t) => updateField('phone', t)}
                keyboardType="phone-pad"
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
  buttonWrap: {
    marginTop: spacing.xxxl,
  },
});
