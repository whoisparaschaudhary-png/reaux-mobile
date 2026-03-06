import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ImageBackground,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useUIStore } from '../../src/stores/useUIStore';
import { isValidEmail, isValidIndianPhone, isValidName, isValidPassword, isValidDateOfBirth } from '../../src/utils/validators';
import { colors, fontFamily, spacing, borderRadius } from '../../src/theme';

const maxDate = new Date();
maxDate.setFullYear(maxDate.getFullYear() - 10);

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const showToast = useUIStore((s) => s.showToast);

  const handleRegister = async () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!firstName.trim()) {
      showToast('First name is required', 'error');
      return;
    }
    if (!lastName.trim()) {
      showToast('Last name is required', 'error');
      return;
    }
    if (!isValidName(fullName)) {
      showToast('Name must be at least 2 characters', 'error');
      return;
    }
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (!phone.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      showToast('Please enter a valid 10-digit Indian phone number', 'error');
      return;
    }
    if (!isValidPassword(password)) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (!dateOfBirth) {
      showToast('Please select your date of birth', 'error');
      return;
    }
    if (!isValidDateOfBirth(dateOfBirth.toISOString())) {
      showToast('You must be at least 10 years old to register', 'error');
      return;
    }
    try {
      await register(fullName, email.trim(), password, phone.trim() || undefined, dateOfBirth.toISOString());
      router.replace('/(app)/(feed)');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    }
  };

  return (
    <SafeScreen style={styles.screen} edges={[]} statusBarStyle="light-content">
      <ImageBackground
        source={require('../../assets/login.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(28, 28, 13, 0.85)',
            'rgba(248, 248, 245, 0.75)',

            'rgba(248, 248, 245, 0.75)',
            'rgba(248, 248, 245, 0.92)',
            'rgba(255, 255, 255, 0.97)'
          ]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Logo at top */}
              <View style={styles.logoSection}>
                <Image
                  source={require('../../assets/logo-temp.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Form section at bottom */}
              <View style={styles.formSection}>
                <Text style={styles.heading}>Create Account</Text>
                <Text style={styles.subtext}>
                  Join the community and start your fitness journey.
                </Text>

                <View style={styles.formInputs}>
                  <View style={styles.nameRow}>
                    <Input
                      label="FIRST NAME"
                      placeholder="First name"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      style={styles.nameField}
                    />
                    <Input
                      label="LAST NAME"
                      placeholder="Last name"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      style={styles.nameField}
                    />
                  </View>

                  <Input
                    label="EMAIL"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Input
                    label="PHONE"
                    placeholder="10-digit number"
                    value={phone}
                    onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="phone-pad"
                    leftIcon={<Text style={styles.phonePrefix}>+91</Text>}
                  />

                  <View style={styles.dateField}>
                    <Text style={styles.inputLabel}>DATE OF BIRTH</Text>
                    <TouchableOpacity
                      style={styles.dateTouchable}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          !dateOfBirth && styles.datePlaceholder,
                        ]}
                      >
                        {dateOfBirth ? formatDisplayDate(dateOfBirth) : 'Select date of birth'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showDatePicker && (
                    <View style={styles.datePickerWrap}>
                      <DateTimePicker
                        value={dateOfBirth || maxDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={maxDate}
                        onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                          if (Platform.OS === 'android') setShowDatePicker(false);
                          if (event.type === 'set' && selectedDate) setDateOfBirth(selectedDate);
                        }}
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

                  <Input
                    label="PASSWORD"
                    placeholder="Create a password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />

                  <Button
                    title="Create Account"
                    onPress={handleRegister}
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={isLoading}
                  />

                  <View style={styles.signinRow}>
                    <Text style={styles.signinText}>Already have an account? </Text>
                    <Link href="/(auth)/login" asChild>
                      <TouchableOpacity>
                        <Text style={styles.signinLink}>Sign in</Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,

  },
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  logoSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  logo: {
    width: 200,
    height: 60,
  },
  formSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  formInputs: {
    gap: spacing.sm,
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  nameField: {
    flex: 1,
  },
  phonePrefix: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  dateField: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  dateTouchable: {
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
  dateText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
  },
  datePlaceholder: {
    color: colors.text.light,
  },
  datePickerWrap: {
    marginBottom: spacing.md,
  },
  datePickerDone: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary.yellow,
    borderRadius: borderRadius.lg,
  },
  datePickerDoneText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.text.primary,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signinText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  signinLink: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
});
