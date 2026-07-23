import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { resetPassword } from '../../src/api/endpoints/auth';
import { useUIStore } from '../../src/stores/useUIStore';
import { colors, fontFamily, spacing } from '../../src/theme';
import { ms, mvs } from '../../src/utils/responsive';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Kept apart so a message always renders under the field it belongs to —
  // one shared `error` string meant "Passwords do not match" also matched the
  // new-password field's check and showed under both inputs at once.
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');
  const [tokenMissing, setTokenMissing] = useState(false);

  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    setTokenMissing(!token);
  }, [token]);

  const goToLogin = () => router.replace('/(auth)/login');

  // The screen is usually opened by replacing the entry route from an email
  // deep link, so there is nothing to pop back to — fall back to login.
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      goToLogin();
    }
  };

  const handleReset = async () => {
    setPasswordError('');
    setConfirmError('');
    setFormError('');

    if (!newPassword) {
      setPasswordError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (!confirmPassword) {
      setConfirmError('Please re-enter your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }

    if (!token) {
      setTokenMissing(true);
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      showToast('Password reset successful!', 'success');
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to reset password';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const subtext = success
    ? 'Your password has been updated.'
    : tokenMissing
      ? 'This reset link is no longer valid.'
      : 'Choose a new password for your account.';

  return (
    <SafeScreen
      style={styles.screen}
      edges={['top', 'left', 'right']}
      statusBarStyle="light-content"
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
          {/* Dark header */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={ms(24)} color={colors.text.white} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoR}>R</Text>
              </View>
              <Text style={styles.logoText}>REAUX LABS</Text>
            </View>
            <Text style={styles.heading}>Reset Password</Text>
            <Text style={styles.subtext}>{subtext}</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {success ? (
              <View style={styles.stateContainer}>
                <View style={[styles.stateIcon, styles.successIcon]}>
                  <Ionicons
                    name="checkmark-circle"
                    size={ms(40)}
                    color={colors.status.success}
                  />
                </View>
                <Text style={styles.stateTitle}>Password Reset!</Text>
                <Text style={styles.stateMessage}>
                  Your password has been successfully reset. You can now log in with
                  your new password.
                </Text>
                <Button
                  title="Go to Login"
                  onPress={goToLogin}
                  variant="primary"
                  size="lg"
                  fullWidth
                />
              </View>
            ) : tokenMissing ? (
              <View style={styles.stateContainer}>
                <View style={[styles.stateIcon, styles.errorIcon]}>
                  <Ionicons
                    name="alert-circle"
                    size={ms(40)}
                    color={colors.status.error}
                  />
                </View>
                <Text style={styles.stateTitle}>Invalid Link</Text>
                <Text style={styles.stateMessage}>
                  This password reset link is invalid or has expired. Reset links are
                  only valid for one hour — please request a new one.
                </Text>
                <Button
                  title="Request New Link"
                  onPress={() => router.replace('/(auth)/forgot-password')}
                  variant="primary"
                  size="lg"
                  fullWidth
                />
              </View>
            ) : (
              <>
                <Input
                  label="NEW PASSWORD"
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  error={passwordError || undefined}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={ms(20)}
                        color={colors.text.light}
                      />
                    </TouchableOpacity>
                  }
                />

                <Input
                  label="CONFIRM PASSWORD"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  error={confirmError || undefined}
                />

                {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                <Button
                  title="Reset Password  →"
                  onPress={handleReset}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                />

                <View style={styles.backRow}>
                  <TouchableOpacity onPress={goToLogin}>
                    <Text style={styles.backLink}>{'←'} Back to Login</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.dark,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    backgroundColor: colors.background.dark,
    paddingHorizontal: spacing.xl,
    paddingTop: mvs(20),
    paddingBottom: mvs(32),
  },
  backBtn: {
    marginBottom: mvs(16),
    alignSelf: 'flex-start',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginBottom: mvs(24),
  },
  logoBox: {
    width: ms(36),
    height: ms(36),
    backgroundColor: colors.primary.yellow,
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoR: {
    fontFamily: fontFamily.bold,
    fontSize: ms(20),
    color: colors.text.onPrimary,
  },
  logoText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(18),
    color: colors.text.white,
    letterSpacing: 2,
  },
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: ms(28),
    lineHeight: ms(34),
    color: colors.text.white,
    marginBottom: mvs(8),
  },
  subtext: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: 'rgba(255,255,255,0.6)',
  },
  formSection: {
    flex: 1,
    backgroundColor: colors.background.light,
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingHorizontal: spacing.xl,
    paddingTop: mvs(28),
    paddingBottom: mvs(40),
  },
  backRow: {
    alignItems: 'center',
    marginTop: mvs(24),
  },
  backLink: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    color: colors.text.primary,
  },
  formError: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    color: colors.status.error,
    marginBottom: spacing.md,
  },
  stateContainer: {
    alignItems: 'center',
    paddingTop: mvs(24),
  },
  stateIcon: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successIcon: {
    backgroundColor: colors.primary.yellowLight,
  },
  errorIcon: {
    backgroundColor: '#fee',
  },
  stateTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(22),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  stateMessage: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
