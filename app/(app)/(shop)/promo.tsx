import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { promosApi } from '../../../src/api/endpoints/promos';
import { showAppAlert } from '../../../src/stores/useUIStore';
import { colors, fontFamily, borderRadius, spacing } from '../../../src/theme';
import type { PromoCode } from '../../../src/types/models';

export default function PromoScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromoCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await promosApi.validate(code.trim().toUpperCase());
      setResult(response.data);
    } catch (err: any) {
      setError(err.message || 'Invalid promo code');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const handleUseCode = useCallback(() => {
    if (result) {
      showAppAlert(
        'Promo Applied',
        `Code "${result.code}" has been applied. You'll see the discount at checkout.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }
  }, [result]);

  return (
    <SafeScreen>
      <Header title="Apply Promo Code" showBack onBack={() => router.back()} />

      <View style={styles.container}>
        {/* Promo illustration */}
        <View style={styles.illustrationWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="pricetag" size={36} color={colors.primary.yellow} />
          </View>
          <Text style={styles.heading}>Got a promo code?</Text>
          <Text style={styles.subtext}>
            Enter your code below to unlock exclusive discounts
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          <Input
            label="Promo Code"
            placeholder="e.g. REAUX15"
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              setError(null);
              setResult(null);
            }}
            error={error ?? undefined}
          />

          <View style={styles.applyBtnWrap}>
            <Button
              title="Apply"
              onPress={handleApply}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>
        </View>

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultIcon}>
              <Ionicons
                name="checkmark-circle"
                size={28}
                color={colors.status.success}
              />
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>Code Valid!</Text>
              <Text style={styles.resultDesc}>
                {result.discountType === 'percentage'
                  ? `${result.discountValue}% off`
                  : `Flat ₹${result.discountValue} off`}
                {result.minOrderAmount
                  ? ` on orders above ₹${result.minOrderAmount}`
                  : ''}
              </Text>
              {result.maxDiscount && (
                <Text style={styles.resultMax}>
                  Max discount: ₹{result.maxDiscount}
                </Text>
              )}
            </View>
            <Button
              title="Use Code"
              onPress={handleUseCode}
              size="sm"
            />
          </View>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },

  // Illustration
  illustrationWrap: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtext: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Input
  inputSection: {
    marginBottom: spacing.xxl,
  },
  applyBtnWrap: {
    marginTop: spacing.lg,
  },

  // Result
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resultIcon: {
    width: 40,
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: '#166534',
    marginBottom: 2,
  },
  resultDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: '#166534',
  },
  resultMax: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: '#15803d',
    marginTop: 2,
  },
});
