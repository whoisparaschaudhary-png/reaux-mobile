import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { promosApi } from '../../../../src/api/endpoints/promos';
import { useUIStore } from '../../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import { ms } from '../../../../src/utils/responsive';
import type { DiscountType } from '../../../../src/types/models';

export default function CreatePromoScreen() {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);

  const [isSaving, setIsSaving] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const handleCreate = async () => {
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
        const n = parseFloat(minOrderAmount);
        if (!isNaN(n)) data.minOrderAmount = n;
      }
      if (maxDiscount && discountType === 'percentage') {
        const n = parseFloat(maxDiscount);
        if (!isNaN(n)) data.maxDiscount = n;
      }
      if (usageLimit) {
        const n = parseInt(usageLimit, 10);
        if (!isNaN(n)) data.usageLimit = n;
      }
      if (validFrom) data.validFrom = validFrom;
      if (validUntil) data.validUntil = validUntil;

      await promosApi.create(data);
      showToast('Promo code created successfully', 'success');
      router.back();
    } catch (err: any) {
      showToast(err.message || 'Failed to create promo code', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <SafeScreen>
        <Header title="Create Promo Code" showBack onBack={() => router.back()} />

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
            <Input
              label="Promo Code *"
              placeholder="e.g., SUMMER20"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />

            <View style={styles.spacer} />

            <Text style={styles.label}>Discount Type *</Text>
            <View style={styles.typeRow}>
              {(['percentage', 'fixed'] as DiscountType[]).map((t) => {
                const active = discountType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeButton, active && styles.typeButtonActive]}
                    onPress={() => setDiscountType(t)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={t === 'percentage' ? 'pricetag-outline' : 'cash-outline'}
                      size={18}
                      color={active ? colors.text.onPrimary : colors.text.secondary}
                    />
                    <Text style={[styles.typeText, active && styles.typeTextActive]}>
                      {t === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.spacer} />

            <Input
              label={discountType === 'percentage' ? 'Discount Value (%) *' : 'Discount Amount (₹) *'}
              placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 200'}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="numeric"
            />

            <View style={styles.spacer} />

            <Input
              label="Minimum Order Amount (₹)"
              placeholder="e.g., 999"
              value={minOrderAmount}
              onChangeText={setMinOrderAmount}
              keyboardType="numeric"
            />

            {discountType === 'percentage' && (
              <>
                <View style={styles.spacer} />
                <Input
                  label="Max Discount Cap (₹)"
                  placeholder="e.g., 500"
                  value={maxDiscount}
                  onChangeText={setMaxDiscount}
                  keyboardType="numeric"
                />
              </>
            )}

            <View style={styles.spacer} />

            <Input
              label="Usage Limit"
              placeholder="e.g., 100 (leave blank for unlimited)"
              value={usageLimit}
              onChangeText={setUsageLimit}
              keyboardType="numeric"
            />

            <View style={styles.spacer} />

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

            <View style={styles.spacerLarge} />

            <Button
              title="Create Promo Code"
              onPress={handleCreate}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSaving}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: ms(40),
  },
  spacer: { height: spacing.lg },
  spacerLarge: { height: spacing.xxxl },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
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
    fontSize: ms(14),
    color: colors.text.secondary,
  },
  typeTextActive: {
    color: colors.text.onPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateField: { flex: 1 },
});
