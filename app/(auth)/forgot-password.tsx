import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { forgotPassword } from '../../src/api/endpoints/auth';
import { useUIStore } from '../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius } from '../../src/theme';
import { ms, mvs } from '../../src/utils/responsive';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const showToast = useUIStore((s) => s.showToast);

  const handleSend = async () => {
    if (!email.trim()) {
      showToast('Please enter your email', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
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
              Enter your email and we'll send you a link to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {sent ? (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="mail-outline" size={40} color={colors.primary.yellow} />
                </View>
                <Text style={styles.successTitle}>Check your email</Text>
                <Text style={styles.successMessage}>
                  We sent a password reset link to {email}. Please check your inbox and click the link to reset your password.
                </Text>
                <Button
                  title="Back to Login"
                  onPress={() => router.replace('/(auth)/login')}
                  variant="primary"
                  size="lg"
                  fullWidth
                />
              </View>
            ) : (
              <>
                <Input
                  label="EMAIL"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Button
                  title="Send Reset Link  \u2192"
                  onPress={handleSend}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                />

                <View style={styles.backRow}>
                  <Link href="/(auth)/login" asChild>
                    <TouchableOpacity>
                      <Text style={styles.backLink}>
                        {'\u2190'} Back to Login
                      </Text>
                    </TouchableOpacity>
                  </Link>
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
  successContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  successIcon: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
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
});
