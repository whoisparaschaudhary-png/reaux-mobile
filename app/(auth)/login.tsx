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
} from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { FadeInView, SlideInUpView } from '../../src/components/animated/AnimatedComponents';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useUIStore } from '../../src/stores/useUIStore';
import { colors, fontFamily, spacing } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const showToast = useUIStore((s) => s.showToast);

  const handleContinue = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    try {
      await login(email.trim(), password.trim());
      router.replace('/(app)/(feed)');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    }
  };

  return (
    <SafeScreen
      style={styles.screen}
      edges={[]}
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
          {/* Login header */}
          {/* <View style={styles.loginHeader}>
            <Text style={styles.loginTitle}>Login</Text>
          </View> */}

          {/* Hero section with background image */}
          <ImageBackground
            source={require('../../assets/login.jpg')}
            style={styles.heroSection}
            resizeMode="cover"
          >
            {/* Light gradient overlay from bottom to top */}
            <LinearGradient
              colors={[
                'rgba(28, 28, 13, 0.7)',
                'rgba(28, 28, 13, 0.3)',
                'rgba(248, 248, 245, 0.7)',
                'rgba(248, 248, 245, 0.9)',
                'rgba(255, 255, 255, 0.95)'
              ]}
              locations={[0, 0.25, 0.5, 0.75, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.fullOverlay}
            >
              <FadeInView delay={0}>
                <Image
                  source={require('../../assets/logo.svg')}
                  style={styles.logo}
                  contentFit="contain"
                />
              </FadeInView>
              <SlideInUpView delay={100}>
                <Text style={styles.heading}>Unlock Your Potential</Text>
              </SlideInUpView>
              <SlideInUpView delay={200}>
                <Text style={styles.subtext}>
                  Manage your clients, buy supplements, and track your fitness journey.
                </Text>
              </SlideInUpView>
            </LinearGradient>
          </ImageBackground>

          {/* Form section */}
          <View style={styles.formSection}>
            <FadeInView delay={300}>
              <Input
                label="Email Or Phone Number"
                placeholder="Enter your email or phone"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </FadeInView>

            <FadeInView delay={325}>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.text.light}
                    />
                  </TouchableOpacity>
                }
              />
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity style={styles.forgotRow}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </Link>
            </FadeInView>

            <SlideInUpView delay={400}>
              <Button
                title="Continue"
                onPress={handleContinue}
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              />
            </SlideInUpView>

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.light,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loginHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.dark,
  },
  loginTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.text.white,
    opacity: 0.7,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
  },
  fullOverlay: {
    paddingTop: 250,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  logo: {
    width: 200,
    height: 52,
    marginBottom: spacing.lg,
  },
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  formSection: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    marginTop: -30,
    justifyContent: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.gray,
  },
  dividerText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.text.light,
    letterSpacing: 1.5,
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  signupLink: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.primary.yellowDark,
  },
});
