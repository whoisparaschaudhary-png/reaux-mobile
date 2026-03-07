import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../../src/components/layout/Header';
import { Input } from '../../../../../src/components/ui/Input';
import { Button } from '../../../../../src/components/ui/Button';
import { SkeletonLoader } from '../../../../../src/components/ui/SkeletonLoader';
import { RoleGuard } from '../../../../../src/components/guards/RoleGuard';
import { useMembershipStore } from '../../../../../src/stores/useMembershipStore';
import { showAppAlert } from '../../../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius, layout } from '../../../../../src/theme';

const DURATIONS = [
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
];

export default function EditMembershipPlanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedPlan, plansLoading, fetchPlanById, updatePlan, clearSelectedPlan } =
    useMembershipStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [features, setFeatures] = useState<string[]>(['']);
  const [isActive, setIsActive] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPlanById(id);
    }
    return () => {
      clearSelectedPlan();
    };
  }, [id]);

  useEffect(() => {
    if (selectedPlan && !isLoaded) {
      setName(selectedPlan.name);
      setDescription(selectedPlan.description || '');
      setPrice(selectedPlan.price.toString());
      setDurationDays(selectedPlan.durationDays);
      setFeatures(
        selectedPlan.features && selectedPlan.features.length > 0
          ? selectedPlan.features
          : ['']
      );
      setIsActive(selectedPlan.isActive);
      setIsLoaded(true);
    }
  }, [selectedPlan, isLoaded]);

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const updateFeature = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAppAlert('Validation', 'Plan name is required');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      showAppAlert('Validation', 'Valid price is required');
      return;
    }

    const filteredFeatures = features.filter((f) => f.trim().length > 0);

    try {
      await updatePlan(id, {
        name: name.trim(),
        durationDays,
        price: Number(price),
        description: description.trim() || undefined,
        features: filteredFeatures.length > 0 ? filteredFeatures : undefined,
        isActive,
      });

      showAppAlert('Success', 'Membership plan updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to update plan');
    }
  };

  if (plansLoading || !selectedPlan || !isLoaded) {
    return (
      <RoleGuard allowedRoles={['admin', 'superadmin']}>
        <SafeScreen>
          <Header title="Edit Plan" showBack onBack={() => router.back()} />
          <View style={styles.skeletonContainer}>
            <SkeletonLoader width="100%" height={60} borderRadius={8} />
            <SkeletonLoader width="100%" height={100} borderRadius={8} />
            <SkeletonLoader width="100%" height={60} borderRadius={8} />
          </View>
        </SafeScreen>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Edit Plan" showBack onBack={() => router.back()} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Basic Info */}
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.field}>
              <Input
                label="Plan Name *"
                placeholder="e.g. Premium Membership"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.field}>
              <Input
                label="Description"
                placeholder="Describe the membership plan..."
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            {/* Duration */}
            <Text style={styles.sectionTitle}>Duration *</Text>
            <View style={styles.durationGrid}>
              {DURATIONS.map((duration) => {
                const isActiveBtn = duration.days === durationDays;
                return (
                  <TouchableOpacity
                    key={duration.days}
                    style={[
                      styles.durationChip,
                      isActiveBtn && styles.durationChipActive,
                    ]}
                    onPress={() => setDurationDays(duration.days)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        isActiveBtn && styles.durationChipTextActive,
                      ]}
                    >
                      {duration.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Price */}
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.field}>
              <Input
                label="Price (Rs) *"
                placeholder="2500"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>

            {/* Status */}
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[styles.statusChip, isActive && styles.statusChipActive]}
                onPress={() => setIsActive(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    isActive && styles.statusChipTextActive,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusChip, !isActive && styles.statusChipActive]}
                onPress={() => setIsActive(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    !isActive && styles.statusChipTextActive,
                  ]}
                >
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>

            {/* Features */}
            <View style={styles.featuresHeader}>
              <Text style={styles.sectionTitle}>Features (Optional)</Text>
              <TouchableOpacity onPress={addFeature} activeOpacity={0.7}>
                <Ionicons name="add-circle" size={24} color={colors.primary.yellow} />
              </TouchableOpacity>
            </View>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureInput}>
                  <Input
                    placeholder={`Feature ${index + 1}`}
                    value={feature}
                    onChangeText={(val) => updateFeature(index, val)}
                  />
                </View>
                {features.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeFeature(index)}
                    activeOpacity={0.7}
                    style={styles.removeFeatureBtn}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.status.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Submit */}
            <View style={styles.submitContainer}>
              <Button
                title="Update Plan"
                onPress={handleSubmit}
                variant="primary"
                size="lg"
                fullWidth
                loading={plansLoading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  skeletonContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  durationChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  durationChipText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  durationChipTextActive: {
    color: colors.text.onPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border.light,
    alignItems: 'center',
  },
  statusChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  statusChipText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  statusChipTextActive: {
    color: colors.text.onPrimary,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  featureInput: {
    flex: 1,
  },
  removeFeatureBtn: {
    padding: spacing.sm,
  },
  submitContainer: {
    marginTop: spacing.xxl,
  },
});
