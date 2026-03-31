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
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleReset = async () => {
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      showToast('Password reset successful!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeScreen style={styles.screen} edges={['top', 'left', 'right']} statusBarStyle="light-content">
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
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.white} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoR}>R</Text>
              </View>
              <Text style={styles.logoText}>REAUX LABS</Text>
            </View>
            <Text style={styles.heading}>Reset Password</Text>
            <Text style={styles.subtext}>
              Enter your new password below.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {success ? (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.status.success} />
                </View>
                <Text style={styles.successTitle}>Password Reset!</Text>
                <Text style={styles.successMessage}>
                  Your password has been successfully reset. You can now log in with your new password.
                </Text>
                <Button
                  title="Go to Login"
                  onPress={handleBackToLogin}
                  variant="primary"
                  size="lg"
                  fullWidth
                />
              </View>
            ) : error && !token ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorIcon}>
                  <Ionicons name="alert-circle" size={40} color={colors.status.error} />
                </View>
                <Text style={styles.errorTitle}>Invalid Link</Text>
                <Text style={styles.errorMessage}>{error}</Text>
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
                  secureTextEntry
                  error={error && error.includes('Password') ? error : undefined}
                />

                <Input
                  label="CONFIRM PASSWORD"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  error={error && error.includes('match') ? error : undefined}
                />

                {error && !error.includes('Password') && !error.includes('match') && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

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
                  <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                    <Text style={styles.backLink}>
                      ← Back to Login
                    </Text>
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
    paddingTop: 20,
    paddingBottom: 32,
  },
  backBtn: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary.yellow,
    borderRadius: 8,
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
    marginBottom: 8,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: 40,
  },
  backRow: {
    alignItems: 'center',
    marginTop: 24,
  },
  backLink: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    color: colors.text.primary,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    color: colors.status.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(22),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(22),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
