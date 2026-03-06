import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { useFeedStore } from '../../../src/stores/useFeedStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useImagePicker } from '../../../src/hooks/useImagePicker';
import {
  colors,
  fontFamily,
  spacing,
  borderRadius,
  shadows,
} from '../../../src/theme';

const POST_CATEGORIES = ['General', 'Workouts', 'Nutrition', 'Tips', 'Motivation'] as const;
type PostCategory = (typeof POST_CATEGORIES)[number];

export default function UploadPostScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { createPost, isLoading } = useFeedStore();
  const { image, pickImage, clearImage, isLoading: isPickingImage } = useImagePicker();

  const [content, setContent] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('General');

  const handleAddHashtag = useCallback(() => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags((prev) => [...prev, tag]);
    }
    setHashtagInput('');
  }, [hashtagInput, hashtags]);

  const handleRemoveHashtag = useCallback((tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handlePost = useCallback(async () => {
    if (!content.trim() && !image) {
      Alert.alert('Missing content', 'Please add some text or an image to your post.');
      return;
    }

    try {
      await createPost(
        {
          content: content.trim() || undefined,
          mediaType: image ? 'image' : 'text',
          mediaUrl: image?.uri,
          hashtags: hashtags.length > 0 ? hashtags : undefined,
          category: selectedCategory.toLowerCase(),
        },
        user ?? undefined
      );
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create post.');
    }
  }, [content, image, hashtags, selectedCategory, createPost, router, user]);

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
      <Header
        title="New Post"
        showBack
        onBack={() => router.back()}
        rightAction={
          <Button
            title="Post"
            onPress={handlePost}
            size="sm"
            loading={isLoading}
            disabled={!content.trim() && !image}
          />
        }
      />

      <KeyboardAvoidingView
        style={styles.scroll}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Content input */}
        <Input
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          multiline
          style={styles.contentInput}
        />

        {/* Image picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Photo</Text>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: image.uri }}
                style={styles.imagePreview}
                contentFit="cover"
                transition={200}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={clearImage}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={28} color={colors.text.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons
                name="image-outline"
                size={32}
                color={colors.text.light}
              />
              <Text style={styles.imagePickerText}>
                {isPickingImage ? 'Opening gallery...' : 'Add a photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hashtags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hashtags</Text>
          <View style={styles.hashtagInputRow}>
            <View style={styles.hashtagInputWrapper}>
              <Input
                placeholder="Add hashtag"
                value={hashtagInput}
                onChangeText={setHashtagInput}
                leftIcon={
                  <Text style={styles.hashSymbol}>#</Text>
                }
              />
            </View>
            <TouchableOpacity
              style={styles.addHashtagButton}
              onPress={handleAddHashtag}
              disabled={!hashtagInput.trim()}
            >
              <Ionicons
                name="add-circle"
                size={36}
                color={
                  hashtagInput.trim()
                    ? colors.primary.yellow
                    : colors.text.light
                }
              />
            </TouchableOpacity>
          </View>

          {hashtags.length > 0 && (
            <View style={styles.hashtagList}>
              {hashtags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.hashtagChip}
                  onPress={() => handleRemoveHashtag(tag)}
                >
                  <Text style={styles.hashtagChipText}>#{tag}</Text>
                  <Ionicons
                    name="close"
                    size={14}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Category selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {POST_CATEGORIES.map((cat) => {
              const isActive = cat === selectedCategory;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
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
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  contentInput: {
    marginTop: spacing.sm,
  },

  // Section
  section: {
    marginTop: spacing.xl,
  },
  sectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  // Image picker
  imagePicker: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.border.light,
  },
  imagePickerText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.light,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },

  // Hashtags
  hashtagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hashtagInputWrapper: {
    flex: 1,
  },
  hashSymbol: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.text.light,
  },
  addHashtagButton: {
    marginTop: spacing.xs,
  },
  hashtagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  hashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary.yellowLight,
  },
  hashtagChipText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.primary,
  },

  // Categories
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
});
