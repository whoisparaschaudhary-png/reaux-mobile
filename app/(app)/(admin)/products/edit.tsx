import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import type { Product } from '../../../../src/types/models';

const CATEGORIES = [
  'Supplements',
  'Equipment',
  'Apparel',
  'Accessories',
  'Nutrition',
  'Other',
] as const;

export default function EditProductScreen() {
  const router = useRouter();
  const { id, backRoute } = useLocalSearchParams<{ id: string; backRoute?: string }>();
  const handleBack = () => backRoute === 'shop' ? router.navigate('/(app)/(shop)') : router.back();
  const { pickImage } = useImagePicker();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Supplements');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageUris, setNewImageUris] = useState<string[]>([]);

  // Nutrition
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sugar, setSugar] = useState('');

  const handlePickImage = async () => {
    const totalImages = existingImages.length + newImageUris.length;
    if (totalImages >= 5) return;
    const result = await pickImage();
    if (result) {
      setNewImageUris((prev) => [...prev, result.uri]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageUris((prev) => prev.filter((_, i) => i !== index));
  };

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

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const response = await productsApi.getById(id);
        const p = response.data;
        setProduct(p);
        setName(p.name);
        setDescription(p.description || '');
        setPrice(p.price.toString());
        setCompareAtPrice(p.compareAtPrice?.toString() || '');
        setStock(p.stock.toString());
        setCategory(p.category || 'Supplements');
        setExistingImages(p.images || []);
        if (p.nutrition) {
          setServingSize(p.nutrition.servingSize || '');
          setCalories(p.nutrition.calories?.toString() || '');
          setProtein(p.nutrition.protein?.toString() || '');
          setCarbs(p.nutrition.carbs?.toString() || '');
          setFat(p.nutrition.fat?.toString() || '');
          setSugar(p.nutrition.sugar?.toString() || '');
        }
      } catch (err: any) {
        showAppAlert('Error', err.message || 'Failed to load product');
        handleBack();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async () => {
    if (!id || !name.trim()) {
      showAppAlert('Validation', 'Product name is required');
      return;
    }
    if (!price || isNaN(Number(price))) {
      showAppAlert('Validation', 'Valid price is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (newImageUris.length > 0) {
        // Use FormData when new images are being uploaded
        const form = new FormData();
        newImageUris.forEach((uri, idx) => {
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
        // Pass existing images so the backend knows which to keep
        existingImages.forEach((url) => form.append('existingImages[]', url));
        const nutrition = buildNutrition();
        if (nutrition) form.append('nutrition', JSON.stringify(nutrition));

        await client.put(`/products/${id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60_000,
        });
      } else {
        // JSON update (no new images)
        await productsApi.update(id, {
          name: name.trim(),
          description: description.trim() || undefined,
          price: Number(price),
          compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
          stock: stock ? Number(stock) : undefined,
          category,
          nutrition: buildNutrition(),
          images: existingImages,
        } as any);
      }

      showAppAlert('Success', 'Product updated successfully', [
        { text: 'OK', onPress: handleBack },
      ]);
    } catch (error: any) {
      console.error('Error updating product:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to update product';
      showAppAlert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <Header title="Edit Product" showBack onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Edit Product" showBack onBack={handleBack} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Images */}
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={styles.imagesRow}>
            {existingImages.map((uri, idx) => (
              <View key={`existing-${idx}`} style={styles.imageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                  transition={200}
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => removeExistingImage(idx)}
                >
                  <Ionicons name="close-circle" size={22} color={colors.text.white} />
                </TouchableOpacity>
              </View>
            ))}
            {newImageUris.map((uri, idx) => (
              <View key={`new-${idx}`} style={styles.imageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                  transition={200}
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => removeNewImage(idx)}
                >
                  <Ionicons name="close-circle" size={22} color={colors.text.white} />
                </TouchableOpacity>
              </View>
            ))}
            {existingImages.length + newImageUris.length < 5 && (
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
          <Text style={styles.sectionTitle}>Nutritional Info</Text>
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
              title="Save Changes"
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
