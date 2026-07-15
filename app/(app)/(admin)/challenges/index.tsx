import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { Card } from '../../../../src/components/ui/Card';
import { Badge } from '../../../../src/components/ui/Badge';
import { Button } from '../../../../src/components/ui/Button';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { useChallengeStore } from '../../../../src/stores/useChallengeStore';
import { useAuthStore } from '../../../../src/stores/useAuthStore';
import { formatDate } from '../../../../src/utils/formatters';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import { ms, mvs } from '../../../../src/utils/responsive';
import type { Challenge, ChallengeType } from '../../../../src/types/models';

const TYPE_VARIANT: Record<ChallengeType, 'primary' | 'success' | 'info' | 'warning'> = {
  steps: 'success',
  workout: 'primary',
  diet: 'info',
  custom: 'warning',
};

export default function ChallengesListScreen() {
  const router = useRouter();
  const { challenges, isLoading, isRefreshing, fetchChallenges, refreshChallenges, joinChallenge } =
    useChallengeStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleRefresh = useCallback(async () => {
    await refreshChallenges();
  }, [refreshChallenges]);

  const handleJoin = useCallback(
    (id: string) => {
      if (user?._id) {
        joinChallenge(id, user._id);
      }
    },
    [joinChallenge, user?._id],
  );

  const hasJoined = (challenge: Challenge) => {
    if (!user?._id) return false;
    return (challenge.participants ?? []).some((p) => {
      const participantId = typeof p.userId === 'string' ? p.userId : p.userId?._id;
      return participantId === user._id;
    });
  };

  const renderChallengeItem = ({ item }: { item: Challenge }) => {
    const joined = hasJoined(item);

    return (
      <Card style={styles.challengeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.challengeTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Badge
              text={item.type}
              variant={TYPE_VARIANT[item.type] || 'default'}
              size="sm"
            />
          </View>
          {item.description ? (
            <Text style={styles.challengeDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="flag-outline" size={14} color={colors.text.light} />
            <Text style={styles.metaText}>Target: {item.target}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={colors.text.light} />
            <Text style={styles.metaText}>
              {(item.participants ?? []).length} participant{(item.participants ?? []).length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>

        {!joined && (
          <View style={styles.joinContainer}>
            <Button
              title="Join Challenge"
              onPress={() => handleJoin(item._id)}
              variant="primary"
              size="sm"
            />
          </View>
        )}

        {joined && (
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
            <Text style={styles.joinedText}>Joined</Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Challenges"
          showBack
          onBack={() => router.back()}
          rightAction={
            isAdmin ? (
              <TouchableOpacity
                onPress={() => router.push('/(app)/(admin)/challenges/create')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add-circle-outline" size={26} color={colors.text.primary} />
              </TouchableOpacity>
            ) : undefined
          }
        />

        <View style={styles.listContainer}>
          <FlashList
            data={challenges}
            keyExtractor={(item) => item._id}
            renderItem={renderChallengeItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              !isLoading ? (
                <EmptyState
                  icon="trophy-outline"
                  title="No challenges yet"
                  message="Create your first challenge to get started"
                />
              ) : null
            }
          />
        </View>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  challengeCard: {
    marginTop: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  challengeTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
  challengeDescription: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },
  dateRow: {
    marginBottom: spacing.sm,
  },
  dateText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.secondary,
  },
  joinContainer: {
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  joinedText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.status.success,
  },
});
