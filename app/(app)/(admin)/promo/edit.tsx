import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { promosApi } from '../../../../src/api/endpoints/promos';
import { useUIStore } from '../../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import type { DiscountType } from '../../../../src/types/models';

export default function EditPromoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useUIStore((s) => s.showToast);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (id) {
      loadPromo();
    }
  }, [id]);

  const loadPromo = async () => {
    setIsLoading(true);
    try {
      const response = await promosApi.getById(id!);
      const promo = response.data;
      setCode(promo.code);
      setDiscountType(promo.discountType);
      setDiscountValue(promo.discountValue.toString());
      setMinOrderAmount(promo.minOrderAmount?.toString() || '');
      setMaxDiscount(promo.maxDiscount?.toString() || '');
      setUsageLimit(promo.usageLimit?.toString() || '');
      setValidFrom(promo.validFrom ? promo.validFrom.split('T')[0] : '');
      setValidUntil(promo.validUntil ? promo.validUntil.split('T')[0] : '');
      setIsActive(promo.isActive);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load promo code', 'error');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!code.trim() || !discountValue) {
      showToast('Code and discount value are required', 'error');
      return;
    }

    const numDiscountValue = parseFloat(discountValue);
    if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
      showToast('Discount value must be a positive number', 'error');
      return;
    }

    if (discountType === 'percentage' && numDiscountValue > 100) {
      showToast('Percentage discount cannot exceed 100%', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const data: any = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: numDiscountValue,
      };

      if (minOrderAmount) {
        const num = parseFloat(minOrderAmount);
        if (!isNaN(num)) data.minOrderAmount = num;
      }

      if (maxDiscount && discountType === 'percentage') {
        const num = parseFloat(maxDiscount);
        if (!isNaN(num)) data.maxDiscount = num;
      }

      if (usageLimit) {
        const num = parseInt(usageLimit, 10);
        if (!isNaN(num)) data.usageLimit = num;
      }

      if (validFrom) data.validFrom = validFrom;
      if (validUntil) data.validUntil = validUntil;

      await promosApi.update(id!, data);
      showToast('Promo code updated successfully', 'success');
      router.back();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update promo code', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <Header title="Edit Promo Code" showBack onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Edit Promo Code" showBack onBack={() => router.back()} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Promo Code */}
            <Input
              label="Promo Code *"
              placeholder="e.g., SUMMER20"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />

            <View style={styles.spacer} />

            {/* Discount Type */}
            <Text style={styles.label}>Discount Type *</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  discountType === 'percentage' && styles.typeButtonActive,
                ]}
                onPress={() => setDiscountType('percentage')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={18}
                  color={
                    discountType === 'percentage'
                      ? colors.text.onPrimary
                      : colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.typeText,
                    discountType === 'percentage' && styles.typeTextActive,
                  ]}
                >
                  Percentage
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  discountType === 'fixed' && styles.typeButtonActive,
                ]}
                onPress={() => setDiscountType('fixed')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={
                    discountType === 'fixed'
                      ? colors.text.onPrimary
                      : colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.typeText,
                    discountType === 'fixed' && styles.typeTextActive,
                  ]}
                >
                  Fixed Amount
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.spacer} />

            {/* Discount Value */}
            <Input
              label={`Discount Value * (${discountType === 'percentage' ? '%' : '₹'})`}
              placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 200'}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="numeric"
            />

            <View style={styles.spacer} />

            {/* Min Order Amount */}
            <Input
              label="Minimum Order Amount (₹)"
              placeholder="e.g., 999"
              value={minOrderAmount}
              onChangeText={setMinOrderAmount}
              keyboardType="numeric"
            />

            <View style={styles.spacer} />

            {/* Max Discount (only for percentage) */}
            {discountType === 'percentage' && (
              <>
                <Input
                  label="Maximum Discount Cap (₹)"
                  placeholder="e.g., 500"
                  value={maxDiscount}
                  onChangeText={setMaxDiscount}
                  keyboardType="numeric"
                />
                <View style={styles.spacer} />
              </>
            )}

            {/* Usage Limit */}
            <Input
              label="Usage Limit"
              placeholder="Leave empty for unlimited"
              value={usageLimit}
              onChangeText={setUsageLimit}
              keyboardType="numeric"
            />

            <View style={styles.spacer} />

            {/* Date Range */}
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Input
                  label="Valid From"
                  placeholder="YYYY-MM-DD"
                  value={validFrom}
                  onChangeText={setValidFrom}
                />
              </View>
              <View style={styles.dateField}>
                <Input
                  label="Valid Until"
                  placeholder="YYYY-MM-DD"
                  value={validUntil}
                  onChangeText={setValidUntil}
                />
              </View>
            </View>

            <View style={styles.spacer} />

            {/* Active Toggle */}
            <TouchableOpacity
              style={styles.activeToggle}
              onPress={() => setIsActive(!isActive)}
              activeOpacity={0.7}
            >
              <View style={styles.activeToggleLeft}>
                <Ionicons
                  name={isActive ? 'checkmark-circle' : 'close-circle-outline'}
                  size={24}
                  color={isActive ? colors.status.success : colors.text.light}
                />
                <Text style={styles.activeToggleText}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <Text style={styles.activeToggleHint}>
                {isActive ? 'Users can use this promo code' : 'Promo code is disabled'}
              </Text>
            </TouchableOpacity>

            <View style={styles.spacerLarge} />

            {/* Save Button */}
            <Button
              title="Save Changes"
              onPress={handleSave}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSaving}
              disabled={isSaving}
            />

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  spacer: {
    height: spacing.lg,
  },
  spacerLarge: {
    height: spacing.xxl,
  },
  bottomSpacer: {
    height: 40,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    backgroundColor: colors.background.white,
  },
  typeButtonActive: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
  typeText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  typeTextActive: {
    color: colors.text.onPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
  },
  activeToggle: {
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
  },
  activeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  activeToggleText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  activeToggleHint: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    paddingLeft: 36,
  },
});
