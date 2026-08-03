import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useModerationStore } from '../../../src/stores/useModerationStore';
import { useUIStore } from '../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius } from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';
import type { User } from '../../../src/types/models';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const blockedUsers = useModerationStore((s) => s.blockedUsers);
  const blockedLoading = useModerationStore((s) => s.blockedLoading);
  const fetchBlockedUsers = useModerationStore((s) => s.fetchBlockedUsers);
  const unblockUser = useModerationStore((s) => s.unblockUser);
  const showToast = useUIStore((s) => s.showToast);

  useFocusEffect(
    useCallback(() => {
      fetchBlockedUsers();
    }, [fetchBlockedUsers])
  );

  const handleUnblock = useCallback(
    (user: User) => {
      Alert.alert(
        `Unblock ${user.name}?`,
        'Their posts, reels and comments will appear in your feeds again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: () => {
              unblockUser(user._id)
                .then(() => showToast(`${user.name} has been unblocked`, 'success'))
                .catch((err: any) => showToast(err.message || 'Failed to unblock user', 'error'));
            },
          },
        ],
      );
    },
    [unblockUser, showToast],
  );

  return (
    <SafeScreen>
      <Header title="Blocked Users" showBack onBack={() => router.back()} />

      {blockedLoading && blockedUsers.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="person-remove-outline"
              title="No blocked users"
              message="When you block someone, their content disappears from your feeds instantly and they show up here."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar uri={item.avatar} name={item.name} size={ms(44)} />
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Button title="Unblock" variant="outline" size="sm" onPress={() => handleUnblock(item)} />
            </View>
          )}
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  name: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(21),
    color: colors.text.primary,
  },
});
