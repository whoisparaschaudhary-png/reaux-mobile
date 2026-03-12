import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { useDietStore } from '../../../src/stores/useDietStore';
import { showAppAlert } from '../../../src/stores/useUIStore';
import { dietsApi } from '../../../src/api/endpoints/diets';
import { useImagePicker } from '../../../src/hooks/useImagePicker';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../../src/theme';
import type { DietCategory, DietType, DietPlan } from '../../../src/types/models';

const CATEGORIES: { label: string; value: DietCategory }[] = [
  { label: 'Weight Loss', value: 'weight-loss' },
  { label: 'Muscle Gain', value: 'muscle-gain' },
  { label: 'Bulking', value: 'bulking' },
  { label: 'Cutting', value: 'cutting' },
  { label: 'Other', value: 'other' },
];

const DIET_TYPES: { label: string; value: DietType }[] = [
  { label: 'Veg', value: 'veg' },
  { label: 'Non-Veg', value: 'non-veg' },
  { label: 'Both', value: 'both' },
];

export default function EditDietScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [title, setTitle] = useState('');
  const [calories, setCalories] = useState('');
  const [category, setCategory] = useState<DietCategory>('weight-loss');
  const [description, setDescription] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [snacks, setSnacks] = useState('');
  const [dinner, setDinner] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dietType, setDietType] = useState<DietType>('both');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDietTypePicker, setShowDietTypePicker] = useState(false);
  const [existingImage, setExistingImage] = useState<string | undefined>();
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  const { updatePlan, isLoading } = useDietStore();
  const { image, pickImage, clearImage } = useImagePicker();

  // Load existing plan data
  useEffect(() => {
    if (!id) return;

    const loadPlan = async () => {
      try {
        const response = await dietsApi.getById(id);
        const plan: DietPlan = response.data;

        setTitle(plan.title || '');
        setCalories(plan.totalCalories ? String(plan.totalCalories) : '');
        setCategory(plan.category || 'weight-loss');
        setDietType(plan.dietType || 'both');
        setDescription(plan.description || '');
        setExistingImage(plan.image);

        // Extract meal text from structured meals
        const getMealText = (mealName: string) => {
          const meal = plan.meals?.find(
            (m) => m.name?.toLowerCase() === mealName.toLowerCase(),
          );
          if (!meal?.items?.length) return '';
          return meal.items.map((item) => item.name).join('\n');
        };

        setBreakfast(getMealText('Breakfast'));
        setLunch(getMealText('Lunch'));
        setSnacks(getMealText('Snacks'));
        setDinner(getMealText('Dinner'));
      } catch {
        showAppAlert('Error', 'Failed to load diet plan.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    loadPlan();
  }, [id]);

  const handleRemoveImage = useCallback(() => {
    if (image) {
      clearImage();
    } else {
      setExistingImage(undefined);
    }
  }, [image, clearImage]);

  const displayImageUri = image?.uri || existingImage;

  const handleSubmit = useCallback(async () => {
    if (!id) return;
    if (!title.trim()) {
      showAppAlert('Validation', 'Please enter a plan title.');
      return;
    }

    // Parse meal text areas into meal items
    const parseMealText = (text: string) =>
      text
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => ({ name: line.trim() }));

    const meals: { name: string; items: { name: string }[] }[] = [];
    if (breakfast.trim()) meals.push({ name: 'Breakfast', items: parseMealText(breakfast) });
    if (lunch.trim()) meals.push({ name: 'Lunch', items: parseMealText(lunch) });
    if (snacks.trim()) meals.push({ name: 'Snacks', items: parseMealText(snacks) });
    if (dinner.trim()) meals.push({ name: 'Dinner', items: parseMealText(dinner) });

    try {
      if (image && image.uri) {
        // New image selected -- use FormData
        const form = new FormData();
        form.append('title', title.trim());
        form.append('category', category);
        form.append('dietType', dietType);
        if (description.trim()) form.append('description', description.trim());
        if (calories) form.append('totalCalories', calories);
        if (meals.length > 0) form.append('meals', JSON.stringify(meals));

        // React Native FormData requires proper typing
        const imageFile: any = {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `diet-${Date.now()}.jpg`,
        };
        form.append('image', imageFile);

        await updatePlan(id, form);
      } else {
        // No new image -- use JSON
        await updatePlan(id, {
          title: title.trim(),
          category,
          dietType,
          description: description.trim() || undefined,
          totalCalories: calories ? Number(calories) : undefined,
          meals,
          image: existingImage,
        });
      }
      showAppAlert('Success', 'Diet plan updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Update diet plan error:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to update diet plan';
      showAppAlert('Error', errorMessage);
    }
  }, [id, title, category, dietType, description, calories, breakfast, lunch, snacks, dinner, image, existingImage, updatePlan]);

  if (isLoadingPlan) {
    return (
      <RoleGuard allowedRoles={['admin', 'superadmin']}>
        <SafeScreen>
          <Header title="Edit Diet Plan" showBack onBack={() => router.back()} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.yellow} />
          </View>
        </SafeScreen>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Edit Diet Plan" showBack onBack={() => router.back()} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Plan Title */}
          <Input
            label="Plan Title"
            placeholder="e.g. High Protein Lean Bulk"
            value={title}
            onChangeText={setTitle}
          />

          {/* Calories per Day */}
          <Input
            label="Calories per Day"
            placeholder="e.g. 2500"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            style={styles.fieldSpacing}
          />

          {/* Category Dropdown */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownText}>
                {CATEGORIES.find((c) => c.value === category)?.label || 'Select Category'}
              </Text>
              <Ionicons
                name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            {showCategoryPicker && (
              <View style={[styles.categoryList, shadows.card]}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryOption,
                      category === cat.value && styles.categoryOptionActive,
                    ]}
                    onPress={() => {
                      setCategory(cat.value);
                      setShowCategoryPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === cat.value && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                    {category === cat.value && (
                      <Ionicons name="checkmark" size={18} color={colors.primary.yellowDark} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Diet Type Dropdown */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Diet Type</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDietTypePicker(!showDietTypePicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownText}>
                {DIET_TYPES.find((d) => d.value === dietType)?.label || 'Select Diet Type'}
              </Text>
              <Ionicons
                name={showDietTypePicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            {showDietTypePicker && (
              <View style={[styles.categoryList, shadows.card]}>
                {DIET_TYPES.map((dt) => (
                  <TouchableOpacity
                    key={dt.value}
                    style={[
                      styles.categoryOption,
                      dietType === dt.value && styles.categoryOptionActive,
                    ]}
                    onPress={() => {
                      setDietType(dt.value);
                      setShowDietTypePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        dietType === dt.value && styles.categoryOptionTextActive,
                      ]}
                    >
                      {dt.value === 'veg' ? '🟢 ' : dt.value === 'non-veg' ? '🔴 ' : '🟡 '}{dt.label}
                    </Text>
                    {dietType === dt.value && (
                      <Ionicons name="checkmark" size={18} color={colors.primary.yellowDark} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          <Input
            label="Description"
            placeholder="Describe the diet plan..."
            value={description}
            onChangeText={setDescription}
            multiline
            style={styles.fieldSpacing}
          />

          {/* Upload Main Image */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Main Image</Text>
            {displayImageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: displayImageUri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                  transition={200}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={28} color={colors.status.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="cloud-upload-outline" size={28} color={colors.text.light} />
                <Text style={styles.uploadText}>Tap to upload image</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Macro Nutrients */}
          <Text style={[styles.sectionTitle, styles.fieldSpacing]}>Macro Nutrients</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroField}>
              <Input
                label="Protein (g)"
                placeholder="0"
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroField}>
              <Input
                label="Carbs (g)"
                placeholder="0"
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroField}>
              <Input
                label="Fats (g)"
                placeholder="0"
                value={fats}
                onChangeText={setFats}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Daily Meal Breakdown */}
          <Text style={[styles.sectionTitle, styles.fieldSpacing]}>Daily Meal Breakdown</Text>
          <Text style={styles.mealHint}>Enter one item per line</Text>

          <Input
            label="Breakfast"
            placeholder="e.g. 4 egg whites&#10;1 cup oatmeal&#10;1 banana"
            value={breakfast}
            onChangeText={setBreakfast}
            multiline
            style={styles.fieldSpacing}
          />
          <Input
            label="Lunch"
            placeholder="e.g. Grilled chicken breast 200g&#10;Brown rice 1 cup&#10;Steamed broccoli"
            value={lunch}
            onChangeText={setLunch}
            multiline
            style={styles.fieldSpacing}
          />
          <Input
            label="Snacks"
            placeholder="e.g. Greek yogurt 200g&#10;Mixed nuts 30g"
            value={snacks}
            onChangeText={setSnacks}
            multiline
            style={styles.fieldSpacing}
          />
          <Input
            label="Dinner"
            placeholder="e.g. Salmon fillet 200g&#10;Sweet potato 150g&#10;Mixed salad"
            value={dinner}
            onChangeText={setDinner}
            multiline
            style={styles.fieldSpacing}
          />

          {/* Preparation Instructions */}
          <Input
            label="Preparation Instructions"
            placeholder="Add any special preparation instructions..."
            value={instructions}
            onChangeText={setInstructions}
            multiline
            style={styles.fieldSpacing}
          />

          {/* Submit */}
          <View style={styles.submitSection}>
            <Button
              title="Update Plan"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            />
          </View>
        </ScrollView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldSpacing: {
    marginTop: spacing.lg,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  mealHint: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.light,
    marginTop: spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.white,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  dropdownText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
  },
  categoryList: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary.yellowLight,
  },
  categoryOptionText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
  },
  categoryOptionTextActive: {
    fontFamily: fontFamily.medium,
    color: colors.text.primary,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.gray,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.border.light,
    gap: spacing.sm,
  },
  uploadText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.light,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  macroField: {
    flex: 1,
  },
  submitSection: {
    marginTop: spacing.xxl,
  },
});
