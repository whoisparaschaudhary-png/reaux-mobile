import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { showAppAlert } from '../../../src/stores/useUIStore';
import client from '../../../src/api/client';
import { colors, fontFamily, spacing, borderRadius, layout } from '../../../src/theme';

export default function ContactUsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { showAppAlert('Validation', 'Please enter your name'); return; }
    if (!email.trim()) { showAppAlert('Validation', 'Please enter your email'); return; }
    if (!subject.trim()) { showAppAlert('Validation', 'Please enter a subject'); return; }
    if (!message.trim()) { showAppAlert('Validation', 'Please enter your message'); return; }

    setLoading(true);
    try {
      await client.post('/contact', {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      showAppAlert('Message Sent', 'We\'ll get back to you shortly.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreen>
      <Header title="Contact Us" showBack onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Get in touch</Text>
            <Text style={styles.infoText}>
              Have a question or feedback? Fill in the form below and we'll respond as soon as possible.
            </Text>
          </View>

          <View style={styles.field}>
            <Input
              label="Your Name"
              placeholder="Full name"
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={styles.field}>
            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.field}>
            <Input
              label="Subject"
              placeholder="What is this about?"
              value={subject}
              onChangeText={setSubject}
            />
          </View>
          <View style={styles.field}>
            <Input
              label="Message"
              placeholder="Write your message here..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
            />
          </View>

          <View style={styles.submitContainer}>
            <Button
              title="Send Message"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: colors.primary.yellowLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  field: {
    marginBottom: spacing.md,
  },
  submitContainer: {
    marginTop: spacing.xl,
  },
});
