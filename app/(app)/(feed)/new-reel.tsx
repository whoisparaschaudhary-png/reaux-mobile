import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { RoleGuard } from '../../../src/components/guards/RoleGuard';
import { reelsApi } from '../../../src/api/endpoints/reels';
import { showAppAlert } from '../../../src/stores/useUIStore';
import {
  colors,
  fontFamily,
  spacing,
  borderRadius,
} from '../../../src/theme';

const REEL_CATEGORIES = ['Workout', 'Nutrition', 'Tips', 'Motivation', 'Other'] as const;
type ReelCategory = (typeof REEL_CATEGORIES)[number];

interface PickedVideo {
  uri: string;
  type: string;
  fileName: string;
}

export default function NewReelScreen() {
  const router = useRouter();

  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReelCategory>('Workout');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickVideo = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAppAlert(
        'Permission needed',
        'Please grant camera roll permissions to upload videos.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setVideo({
        uri: asset.uri,
        type: asset.mimeType || 'video/mp4',
        fileName: asset.fileName || 'reel.mp4',
      });
    }
  }, []);

  const pickThumbnail = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAppAlert(
        'Permission needed',
        'Please grant camera roll permissions to select a thumbnail.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setThumbnail(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!video) {
      showAppAlert('Missing video', 'Please select a video for your reel.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('video', {
        uri: video.uri,
        type: video.type,
        name: video.fileName,
      } as any);

      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }
      if (affiliateLink.trim()) {
        formData.append('linkedProduct', affiliateLink.trim());
      }
      formData.append('category', selectedCategory.toLowerCase());

      if (thumbnail) {
        formData.append('thumbnail', {
          uri: thumbnail,
          type: 'image/jpeg',
          name: 'thumbnail.jpg',
        } as any);
      }

      await reelsApi.create(formData);
      router.back();
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to upload reel.');
    } finally {
      setIsSubmitting(false);
    }
  }, [video, caption, affiliateLink, selectedCategory, thumbnail, router]);

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
      <Header
        title="New Reel"
        showBack
        onBack={() => router.back()}
        rightAction={
          <Button
            title="Post Reel"
            onPress={handleSubmit}
            size="sm"
            loading={isSubmitting}
            disabled={!video}
          />
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Video picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Video</Text>
          {video ? (
            <View style={styles.videoPreview}>
              <Ionicons name="videocam" size={40} color={colors.primary.yellow} />
              <Text style={styles.videoFileName} numberOfLines={1}>
                {video.fileName}
              </Text>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={pickVideo}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setVideo(null)}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.status.error}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.mediaPicker}
              onPress={pickVideo}
              activeOpacity={0.7}
            >
              <Ionicons
                name="videocam-outline"
                size={40}
                color={colors.text.light}
              />
              <Text style={styles.mediaPickerText}>Select a video</Text>
              <Text style={styles.mediaPickerHint}>Max 60 seconds</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Thumbnail selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Thumbnail (optional)</Text>
          {thumbnail ? (
            <View style={styles.thumbnailPreviewContainer}>
              <Image
                source={{ uri: thumbnail }}
                style={styles.thumbnailPreview}
                contentFit="cover"
                transition={200}
              />
              <TouchableOpacity
                style={styles.removeThumbnailButton}
                onPress={() => setThumbnail(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={colors.text.white}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.thumbnailPicker}
              onPress={pickThumbnail}
              activeOpacity={0.7}
            >
              <Ionicons
                name="image-outline"
                size={28}
                color={colors.text.light}
              />
              <Text style={styles.mediaPickerText}>Select thumbnail</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Caption */}
        <View style={styles.section}>
          <Input
            label="Caption"
            placeholder="Write a caption for your reel..."
            value={caption}
            onChangeText={setCaption}
            multiline
          />
        </View>

        {/* Affiliate link */}
        <View style={styles.section}>
          <Input
            label="Affiliate / Product Link (optional)"
            placeholder="https://..."
            value={affiliateLink}
            onChangeText={setAffiliateLink}
            keyboardType="url"
            leftIcon={
              <Ionicons
                name="link-outline"
                size={20}
                color={colors.text.light}
              />
            }
          />
        </View>

        {/* Category dropdown as chips */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {REEL_CATEGORIES.map((cat) => {
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

        {/* Submit button (full-width alternate) */}
        <View style={styles.submitSection}>
          <Button
            title="Post Reel"
            onPress={handleSubmit}
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={!video}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
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

  // Media picker
  mediaPicker: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.border.light,
  },
  mediaPickerText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.light,
  },
  mediaPickerHint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
  },

  // Video preview
  videoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.border.light,
    gap: spacing.sm,
  },
  videoFileName: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  changeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary.yellowLight,
  },
  changeButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.primary,
  },
  removeButton: {
    padding: spacing.xs,
  },

  // Thumbnail
  thumbnailPicker: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.border.light,
  },
  thumbnailPreviewContainer: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    width: 120,
    height: 200,
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
  },
  removeThumbnailButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
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

  // Submit
  submitSection: {
    marginTop: spacing.xxxl,
  },
});
