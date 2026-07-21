import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Button } from '../../../../src/components/ui/Button';
import { colors, fontFamily, typography, spacing } from '../../../../src/theme';
import { ms } from '../../../../src/utils/responsive';

export default function CandidateConfirmationScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();

  return (
    <SafeScreen>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={ms(56)} color={colors.text.onPrimary} />
        </View>
        <Text style={styles.title}>Candidate Added</Text>
        <Text style={styles.message}>
          {name ? `${name} has been added to your gym.` : 'The candidate has been added to your gym.'}
        </Text>
      </View>
      <View style={styles.footer}>
        <Button
          title="Done"
          onPress={() => router.replace('/(app)/(admin)/candidates' as any)}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  iconCircle: {
    width: ms(104),
    height: ms(104),
    borderRadius: ms(52),
    backgroundColor: colors.primary.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
