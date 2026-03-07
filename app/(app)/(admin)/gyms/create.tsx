import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { gymsApi } from '../../../../src/api/endpoints/gyms';
import { showAppAlert } from '../../../../src/stores/useUIStore';
import { useImagePicker } from '../../../../src/hooks/useImagePicker';
import { useAdminStore } from '../../../../src/stores/useAdminStore';
import { colors, fontFamily, spacing, borderRadius, layout } from '../../../../src/theme';
import client from '../../../../src/api/client';
import type { User } from '../../../../src/types/models';

export default function CreateGymScreen() {
  const router = useRouter();
  const { pickImage } = useImagePicker();
  const { users, fetchUsers, isLoading: isLoadingUsers } = useAdminStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [amenities, setAmenities] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [showAdminPicker, setShowAdminPicker] = useState(false);

  // Fetch admin users on mount
  useEffect(() => {
    fetchUsers(1);
  }, []);

  // Filter users to get only admins
  const adminUsers = users.filter(
    (u) => u.role === 'admin' || u.role === 'superadmin'
  );

  const selectedAdminUser = adminUsers.find((u) => u._id === selectedAdmin);

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) {
      setImageUris((prev) => [...prev, result.uri]);
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePickLogo = async () => {
    const result = await pickImage();
    if (result) {
      setLogoUri(result.uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAppAlert('Validation', 'Gym name is required');
      return;
    }

    setIsSubmitting(true);
    let createdGymId: string | null = null;

    try {
      const hasMedia = imageUris.length > 0 || logoUri;

      if (hasMedia) {
        const form = new FormData();
        imageUris.forEach((uri, idx) => {
          if (uri) {
            const imageFile: any = {
              uri,
              type: 'image/jpeg',
              name: `gym_${idx}.jpg`,
            };
            form.append('images', imageFile);
          }
        });
        if (logoUri) {
          const logoFile: any = {
            uri: logoUri,
            type: 'image/jpeg',
            name: 'gym_logo.jpg',
          };
          form.append('logo', logoFile);
        }
        form.append('name', name.trim());
        if (description.trim()) form.append('description', description.trim());
        if (phone.trim()) form.append('phone', phone.trim());
        if (email.trim()) form.append('email', email.trim());
        if (street.trim()) form.append('address[street]', street.trim());
        if (city.trim()) form.append('address[city]', city.trim());
        if (state.trim()) form.append('address[state]', state.trim());
        if (pincode.trim()) form.append('address[pincode]', pincode.trim());
        const amenitiesList = amenities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
        amenitiesList.forEach((a) => form.append('amenities[]', a));

        const response = await client.post('/gyms', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60_000,
        });
        createdGymId = response.data?.data?._id;
      } else {
        const response = await gymsApi.create({
          name: name.trim(),
          description: description.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: {
            street: street.trim() || undefined,
            city: city.trim() || undefined,
            state: state.trim() || undefined,
            pincode: pincode.trim() || undefined,
          },
          amenities: amenities
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean),
        });
        createdGymId = response.data?._id;
      }

      // Assign admin if selected
      if (selectedAdmin && createdGymId) {
        try {
          await gymsApi.assignAdmin(createdGymId, selectedAdmin);
          showAppAlert('Success', 'Gym created and admin assigned successfully', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        } catch (assignError: any) {
          console.error('Error assigning admin:', assignError);
          const assignErrorMsg = assignError?.message || 'Failed to assign admin';
          showAppAlert(
            'Partial Success',
            `Gym created successfully, but admin assignment failed: ${assignErrorMsg}`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else {
        showAppAlert('Success', 'Gym created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error('Error creating gym:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to create gym';
      showAppAlert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <SafeScreen>
        <Header title="Create Gym" showBack onBack={() => router.back()} />

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

          {/* Logo */}
          <Text style={styles.sectionTitle}>Logo</Text>
          <View style={styles.imagesRow}>
            {logoUri ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: logoUri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                  transition={200}
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setLogoUri(null)}
                >
                  <Ionicons name="close-circle" size={22} color={colors.text.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addImageBtn}
                onPress={handlePickLogo}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={28} color={colors.text.light} />
                <Text style={styles.addImageText}>Logo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Basic Info */}
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.field}>
            <Input
              label="Gym Name *"
              placeholder="e.g. FitHub Mumbai"
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={styles.field}>
            <Input
              label="Description"
              placeholder="Describe the gym..."
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Contact */}
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.field}>
            <Input
              label="Phone"
              placeholder="+91 9876543210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.field}>
            <Input
              label="Email"
              placeholder="gym@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          {/* Address */}
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.field}>
            <Input
              label="Street"
              placeholder="123 Main Street"
              value={street}
              onChangeText={setStreet}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                label="City"
                placeholder="Mumbai"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={styles.halfField}>
              <Input
                label="State"
                placeholder="Maharashtra"
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Input
              label="Pincode"
              placeholder="400001"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
            />
          </View>

          {/* Amenities */}
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.field}>
            <Input
              label="Amenities (comma separated)"
              placeholder="WiFi, AC, Shower, Parking"
              value={amenities}
              onChangeText={setAmenities}
            />
          </View>

          {/* Admin Selection */}
          <Text style={styles.sectionTitle}>Assign Admin (Optional)</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowAdminPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectButtonContent}>
              <View style={styles.selectButtonLeft}>
                <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.selectButtonText}>
                  {selectedAdminUser ? selectedAdminUser.name : 'Select an admin'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.text.light} />
            </View>
          </TouchableOpacity>
          {selectedAdminUser && (
            <View style={styles.selectedAdminInfo}>
              <Text style={styles.selectedAdminEmail}>{selectedAdminUser.email}</Text>
              <Text style={styles.selectedAdminRole}>
                {selectedAdminUser.role === 'superadmin' ? 'Superadmin' : 'Admin'}
              </Text>
            </View>
          )}

          {/* Submit */}
          <View style={styles.submitContainer}>
            <Button
              title="Create Gym"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
            />
          </View>
        </ScrollView>

        {/* Admin Picker Modal */}
        <Modal
          visible={showAdminPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAdminPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Admin</Text>
                <TouchableOpacity
                  onPress={() => setShowAdminPicker(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {isLoadingUsers ? (
                <View style={styles.modalLoading}>
                  <Text style={styles.modalLoadingText}>Loading admins...</Text>
                </View>
              ) : adminUsers.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>No admin users found</Text>
                </View>
              ) : (
                <FlatList
                  data={adminUsers}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.adminItem,
                        selectedAdmin === item._id && styles.adminItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedAdmin(item._id);
                        setShowAdminPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.adminItemContent}>
                        <View style={styles.adminItemLeft}>
                          <Text style={styles.adminItemName}>{item.name}</Text>
                          <Text style={styles.adminItemEmail}>{item.email}</Text>
                        </View>
                        <View style={styles.adminItemRight}>
                          <Text style={styles.adminItemRole}>
                            {item.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                          </Text>
                          {selectedAdmin === item._id && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary.yellow} />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  contentContainerStyle={styles.modalList}
                />
              )}

              <View style={styles.modalFooter}>
                <Button
                  title="Clear Selection"
                  onPress={() => {
                    setSelectedAdmin('');
                    setShowAdminPicker(false);
                  }}
                  variant="outline"
                  size="md"
                  fullWidth
                />
              </View>
            </View>
          </View>
        </Modal>
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
  submitContainer: {
    marginTop: spacing.xxl,
  },
  selectButton: {
    backgroundColor: colors.background.white,
    borderWidth: 1,
    borderColor: colors.border.gray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  selectButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
  },
  selectedAdminInfo: {
    marginBottom: spacing.md,
    paddingLeft: spacing.lg + spacing.sm,
  },
  selectedAdminEmail: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  selectedAdminRole: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary.yellow,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
  },
  modalList: {
    paddingVertical: spacing.sm,
  },
  modalLoading: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  modalLoadingText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  modalEmpty: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.light,
  },
  adminItem: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
  },
  adminItemSelected: {
    backgroundColor: colors.primary.yellowLight,
  },
  adminItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminItemLeft: {
    flex: 1,
  },
  adminItemName: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: 2,
  },
  adminItemEmail: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  adminItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  adminItemRole: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.text.light,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: layout.screenPadding,
  },
  modalFooter: {
    padding: layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
