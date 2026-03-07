import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { showAppAlert } from '../../../src/stores/useUIStore';
import {
  colors,
  typography,
  fontFamily,
  spacing,
  borderRadius,
  layout,
} from '../../../src/theme';
import type { Gender } from '../../../src/types/models';

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

export default function EditProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [name, setName] = useState(user?.name || '');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [weight, setWeight] = useState(user?.weight?.toString() || '');
  const [gender, setGender] = useState<Gender | undefined>(user?.gender);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAppAlert('Validation', 'Name is required');
      return;
    }

    const data: Record<string, any> = {
      name: name.trim(),
    };

    // Phone is non-editable (set at registration only)
    if (height) data.height = parseFloat(height);
    if (weight) data.weight = parseFloat(weight);
    if (gender) data.gender = gender;
    if (dateOfBirth) data.dateOfBirth = dateOfBirth.toISOString();

    try {
      await updateProfile(data);
      showAppAlert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      showAppAlert('Error', 'Failed to update profile');
    }
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeScreen>
      <Header
        title="Edit Profile"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View style={styles.fieldGroup}>
          <Input
            label="Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Phone - compulsory at registration, non-editable */}
        <View style={styles.fieldGroup}>
          <Input
            label="Phone"
            placeholder="Phone number"
            value={user?.phone ? `+91 ${user.phone}` : '—'}
            onChangeText={() => {}}
            style={styles.readOnlyField}
          />
          <Text style={styles.readOnlyHint}>Phone cannot be changed</Text>
        </View>

        {/* Height */}
        <View style={styles.fieldGroup}>
          <Input
            label="Height (cm)"
            placeholder="Enter your height in cm"
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
          />
        </View>

        {/* Weight */}
        <View style={styles.fieldGroup}>
          <Input
            label="Weight (kg)"
            placeholder="Enter your weight in kg"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
        </View>

        {/* Date of Birth */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dateButtonText,
                !dateOfBirth && styles.dateButtonPlaceholder,
              ]}
            >
              {dateOfBirth
                ? formatDisplayDate(dateOfBirth)
                : 'Select your date of birth'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={dateOfBirth || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.datePickerDone}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Gender */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.pillRow}>
            {GENDER_OPTIONS.map((option) => {
              const isSelected = gender === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pill,
                    isSelected && styles.pillSelected,
                  ]}
                  onPress={() => setGender(option.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      isSelected && styles.pillTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.white,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dateButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
  },
  dateButtonPlaceholder: {
    color: colors.text.light,
  },
  datePickerContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  datePickerDone: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  datePickerDoneText: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.status.info,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    backgroundColor: colors.background.white,
  },
  pillSelected: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
  pillText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  pillTextSelected: {
    color: colors.text.onPrimary,
  },
  saveContainer: {
    marginTop: spacing.xxl,
  },
  readOnlyField: {
    opacity: 0.8,
  },
  readOnlyHint: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.light,
    marginTop: spacing.xs,
  },
});
