import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { candidatesApi } from '../../../../src/api/endpoints/candidates';
import { showAppAlert } from '../../../../src/stores/useUIStore';
import { useImagePicker } from '../../../../src/hooks/useImagePicker';
import { colors, fontFamily, typography, spacing, borderRadius } from '../../../../src/theme';
import { ms, mvs } from '../../../../src/utils/responsive';

export default function AddCandidateScreen() {
  const router = useRouter();
  const { image, pickImage, clearImage } = useImagePicker();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      showAppAlert('Validation', 'Please enter the full name.');
      return;
    }
    if (!phone.trim()) {
      showAppAlert('Validation', 'Please enter a phone number.');
      return;
    }
    const amountNum = amount.trim() ? Number(amount) : NaN;
    if (amount.trim() && (Number.isNaN(amountNum) || amountNum < 0)) {
      showAppAlert('Validation', 'Membership amount must be a valid number.');
      return;
    }

    setSubmitting(true);
    try {
      if (image && image.uri) {
        const form = new FormData();
        form.append('name', name.trim());
        form.append('phone', phone.trim());
        if (amount.trim()) form.append('monthlyFees', String(amountNum));
        if (startDate) form.append('startDate', startDate);
        const file: any = { uri: image.uri, type: image.type || 'image/jpeg', name: image.fileName || `candidate-${Date.now()}.jpg` };
        form.append('avatar', file);
        await candidatesApi.create(form);
      } else {
        await candidatesApi.create({
          name: name.trim(),
          phone: phone.trim(),
          monthlyFees: amount.trim() ? amountNum : undefined,
          startDate: startDate || undefined,
        });
      }
      router.replace({ pathname: '/(app)/(admin)/candidates/confirmation', params: { name: name.trim() } } as any);
    } catch (error: any) {
      let msg = error?.message || 'Failed to add candidate';
      if (error?.status === 404 || /not found|404/i.test(msg)) {
        msg = 'The candidate service is not available yet. Please try again later.';
      }
      showAppAlert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }, [name, phone, amount, startDate, image, router]);

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header title="Add New Candidate" showBack onBack={() => router.back()} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar upload */}
            {image ? (
              <View style={styles.avatarPreviewWrap}>
                <Image source={{ uri: image.uri }} style={styles.avatarPreview} contentFit="cover" transition={200} />
                <TouchableOpacity style={styles.avatarRemove} onPress={clearImage} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={ms(28)} color={colors.status.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.7}>
                <Text style={styles.uploadHint}>Tap to upload their account profile picture</Text>
                <View style={styles.uploadBtn}>
                  <Text style={styles.uploadBtnText}>Upload</Text>
                </View>
              </TouchableOpacity>
            )}

            <Text style={styles.label}>Full Name</Text>
            <Input placeholder="Enter their name" value={name} onChangeText={setName} />

            <Text style={[styles.label, styles.spaced]}>Phone Number</Text>
            <Input placeholder="Enter Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={[styles.label, styles.spaced]}>Membership Amount per Month</Text>
            <Input placeholder="Add Amount" value={amount} onChangeText={setAmount} keyboardType="number-pad" />

            <Text style={[styles.label, styles.spaced]}>Start Date</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
              <Text style={[styles.dateText, !startDate && styles.datePlaceholder]}>
                {startDate || 'Select Date'}
              </Text>
              <Ionicons name="calendar-outline" size={ms(20)} color={colors.text.secondary} />
            </TouchableOpacity>

            {Platform.OS === 'ios' ? (
              <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                <TouchableOpacity style={styles.dateModalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
                  <View style={styles.dateModalContent}>
                    <View style={styles.dateModalHeader}>
                      <Text style={styles.dateModalTitle}>Select Start Date</Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.dateModalDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="spinner"
                      onChange={(_, date) => {
                        if (date) {
                          setSelectedDate(date);
                          setStartDate(date.toISOString().split('T')[0]);
                        }
                      }}
                      textColor={colors.text.primary}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            ) : showDatePicker ? (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setSelectedDate(date);
                    setStartDate(date.toISOString().split('T')[0]);
                  }
                }}
              />
            ) : null}

            <View style={styles.submitWrap}>
              <Button title="Add Candidate" onPress={handleSubmit} variant="primary" size="lg" fullWidth loading={submitting} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border.gray,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  uploadHint: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  uploadBtn: {
    backgroundColor: colors.primary.yellowLight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  uploadBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    color: colors.text.primary,
  },
  avatarPreviewWrap: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  avatarPreview: {
    width: ms(120),
    height: ms(120),
    borderRadius: ms(60),
  },
  avatarRemove: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  spaced: {
    marginTop: spacing.lg,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.white,
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    minHeight: mvs(52),
  },
  dateText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(16),
    color: colors.text.primary,
  },
  datePlaceholder: {
    color: colors.text.light,
  },
  submitWrap: {
    marginTop: spacing.xxl,
  },
  dateModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay.medium,
  },
  dateModalContent: {
    backgroundColor: colors.background.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xxl,
  },
  dateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dateModalTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  dateModalDone: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    color: colors.primary.yellowDark,
  },
});
