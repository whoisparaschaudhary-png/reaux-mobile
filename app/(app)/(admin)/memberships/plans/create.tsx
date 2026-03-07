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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../../src/components/layout/Header';
import { Input } from '../../../../../src/components/ui/Input';
import { Button } from '../../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../../src/components/guards/RoleGuard';
import { useMembershipStore } from '../../../../../src/stores/useMembershipStore';
import { gymsApi } from '../../../../../src/api/endpoints/gyms';
import { showAppAlert } from '../../../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius, layout } from '../../../../../src/theme';
import type { Gym } from '../../../../../src/types/models';

const DURATIONS = [
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
];

export default function CreateMembershipPlanScreen() {
  const router = useRouter();
  const { createPlan, plansLoading } = useMembershipStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [features, setFeatures] = useState<string[]>(['']);
  const [selectedGymId, setSelectedGymId] = useState('');
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(true);

  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    try {
      const response = await gymsApi.list({ limit: 100 });
      setGyms(response.data || []);
      if (response.data?.length > 0) {
        setSelectedGymId(response.data[0]._id);
      }
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to load gyms');
    } finally {
      setLoadingGyms(false);
    }
  };

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
    if (!selectedGymId) {
      showAppAlert('Validation', 'Please select a gym');
      return;
    }

    const filteredFeatures = features.filter((f) => f.trim().length > 0);

    try {
      await createPlan({
        name: name.trim(),
        gymId: selectedGymId,
        durationDays,
        price: Number(price),
        description: description.trim() || undefined,
        features: filteredFeatures.length > 0 ? filteredFeatures : undefined,
      });

      showAppAlert('Success', 'Membership plan created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to create plan');
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Create Plan" showBack onBack={() => router.back()} />

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

            {/* Gym Selection */}
            <Text style={styles.sectionTitle}>Gym *</Text>
            {loadingGyms ? (
              <Text style={styles.loadingText}>Loading gyms...</Text>
            ) : gyms.length === 0 ? (
              <Text style={styles.emptyText}>No gyms available</Text>
            ) : (
              <View style={styles.gymGrid}>
                {gyms.map((gym) => {
                  const isActive = gym._id === selectedGymId;
                  return (
                    <TouchableOpacity
                      key={gym._id}
                      style={[styles.gymChip, isActive && styles.gymChipActive]}
                      onPress={() => setSelectedGymId(gym._id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.gymChipText, isActive && styles.gymChipTextActive]}
                      >
                        {gym.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Duration */}
            <Text style={styles.sectionTitle}>Duration *</Text>
            <View style={styles.durationGrid}>
              {DURATIONS.map((duration) => {
                const isActive = duration.days === durationDays;
                return (
                  <TouchableOpacity
                    key={duration.days}
                    style={[styles.durationChip, isActive && styles.durationChipActive]}
                    onPress={() => setDurationDays(duration.days)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        isActive && styles.durationChipTextActive,
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
                title="Create Plan"
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
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.light,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  gymGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gymChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  gymChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  gymChipText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  gymChipTextActive: {
    color: colors.text.onPrimary,
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
