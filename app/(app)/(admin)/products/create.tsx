import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { productsApi } from '../../../../src/api/endpoints/products';
import { showAppAlert } from '../../../../src/stores/useUIStore';
import { useImagePicker } from '../../../../src/hooks/useImagePicker';
import { colors, fontFamily, spacing, borderRadius, layout } from '../../../../src/theme';
import client from '../../../../src/api/client';

const CATEGORIES = [
  'Supplements',
  'Equipment',
  'Apparel',
  'Accessories',
  'Nutrition',
  'Other',
] as const;

export default function CreateProductScreen() {
  const router = useRouter();
  const { pickImage } = useImagePicker();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState<string>('Supplements');
  const [imageUris, setImageUris] = useState<string[]>([]);

  // Nutrition
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sugar, setSugar] = useState('');

  const buildNutrition = () => {
    const n: Record<string, any> = {};
    if (servingSize.trim()) n.servingSize = servingSize.trim();
    if (calories) n.calories = Number(calories);
    if (protein) n.protein = Number(protein);
    if (carbs) n.carbs = Number(carbs);
    if (fat) n.fat = Number(fat);
    if (sugar) n.sugar = Number(sugar);
    return Object.keys(n).length > 0 ? n : undefined;
  };

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) {
      setImageUris((prev) => [...prev, result.uri]);
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAppAlert('Validation', 'Product name is required');
      return;
    }
    if (!price || isNaN(Number(price))) {
      showAppAlert('Validation', 'Valid price is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // If images were picked, upload them first via multipart,
      // otherwise just send JSON with no images
      let uploadedUrls: string[] = [];

      if (imageUris.length > 0) {
        // Upload images via a FormData request to products endpoint
        const form = new FormData();
        imageUris.forEach((uri, idx) => {
          if (uri) {
            const imageFile: any = {
              uri,
              type: 'image/jpeg',
              name: `product_${idx}.jpg`,
            };
            form.append('images', imageFile);
          }
        });
        form.append('name', name.trim());
        form.append('price', price);
        if (description.trim()) form.append('description', description.trim());
        if (compareAtPrice) form.append('compareAtPrice', compareAtPrice);
        if (stock) form.append('stock', stock);
        form.append('category', category);
        const nutrition = buildNutrition();
        if (nutrition) form.append('nutrition', JSON.stringify(nutrition));

        const response = await client.post('/products', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60_000,
        });
        showAppAlert('Success', 'Product created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      await productsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        stock: stock ? Number(stock) : undefined,
        category,
        nutrition: buildNutrition(),
      } as any);

      showAppAlert('Success', 'Product created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to create product';
      showAppAlert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Add Product" showBack onBack={() => router.back()} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Images */}
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={styles.imagesRow}>
            {imageUris.map((uri, idx) => (
              <View key={idx} style={styles.imageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                  transition={200}
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => removeImage(idx)}
                >
                  <Ionicons name="close-circle" size={22} color={colors.text.white} />
                </TouchableOpacity>
              </View>
            ))}
            {imageUris.length < 5 && (
              <TouchableOpacity
                style={styles.addImageBtn}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={28} color={colors.text.light} />
                <Text style={styles.addImageText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Basic Info */}
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.field}>
            <Input
              label="Product Name *"
              placeholder="e.g. Whey Protein 1kg"
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={styles.field}>
            <Input
              label="Description"
              placeholder="Describe the product..."
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Pricing */}
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                label="Price (Rs) *"
                placeholder="2500"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Input
                label="Compare Price"
                placeholder="3500"
                value={compareAtPrice}
                onChangeText={setCompareAtPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.field}>
            <Input
              label="Stock"
              placeholder="100"
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
            />
          </View>

          {/* Nutrition */}
          <Text style={styles.sectionTitle}>Nutritional Info (optional)</Text>
          <View style={styles.field}>
            <Input
              label="Serving Size"
              placeholder="e.g. 1 scoop (30g)"
              value={servingSize}
              onChangeText={setServingSize}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                label="Calories (kcal)"
                placeholder="120"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Input
                label="Protein (g)"
                placeholder="24"
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                label="Carbs (g)"
                placeholder="3"
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Input
                label="Fat (g)"
                placeholder="1.5"
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.field}>
            <Input
              label="Sugar (g)"
              placeholder="1"
              value={sugar}
              onChangeText={setSugar}
              keyboardType="numeric"
            />
          </View>

          {/* Category */}
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isActive = cat === category;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isActive && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit */}
          <View style={styles.submitContainer}>
            <Button
              title="Create Product"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
            />
          </View>
        </ScrollView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addImageText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.text.light,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.yellow,
  },
  categoryChipText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.text.onPrimary,
  },
  submitContainer: {
    marginTop: spacing.xxl,
  },
});
