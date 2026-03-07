import React, { useEffect, useState, useCallback } from 'react';
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
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { RoleGuard } from '../../../../src/components/guards/RoleGuard';
import { gymsApi } from '../../../../src/api/endpoints/gyms';
import { showAppAlert } from '../../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius } from '../../../../src/theme';
import type { Gym } from '../../../../src/types/models';

export default function GymListScreen() {
  const router = useRouter();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGyms = useCallback(async () => {
    try {
      const response = await gymsApi.list({ limit: 50 });
      setGyms(response.data);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to load gyms');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchGyms();
  };

  const handleDelete = (gym: Gym) => {
    showAppAlert(
      'Deactivate Gym',
      `Are you sure you want to deactivate "${gym.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await gymsApi.remove(gym._id);
              setGyms((prev) => prev.filter((g) => g._id !== gym._id));
            } catch (err: any) {
              showAppAlert('Error', err.message || 'Failed to deactivate gym');
            }
          },
        },
      ],
    );
  };

  const renderGymItem = ({ item }: { item: Gym }) => (
    <Card style={styles.gymCard}>
      <View style={styles.gymHeader}>
        <View style={styles.gymInfo}>
          <Text style={styles.gymName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.address?.city && (
            <Text style={styles.gymLocation}>
              {[item.address.city, item.address.state].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>
        <Badge
          text={item.isActive ? 'Active' : 'Inactive'}
          variant={item.isActive ? 'success' : 'error'}
        />
      </View>

      {item.description ? (
        <Text style={styles.gymDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.gymMeta}>
        {item.phone && (
          <View style={styles.metaItem}>
            <Ionicons name="call-outline" size={14} color={colors.text.light} />
            <Text style={styles.metaText}>{item.phone}</Text>
          </View>
        )}
        {item.email && (
          <View style={styles.metaItem}>
            <Ionicons name="mail-outline" size={14} color={colors.text.light} />
            <Text style={styles.metaText}>{item.email}</Text>
          </View>
        )}
      </View>

      <View style={styles.gymActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/(app)/(admin)/gyms/${item._id}`)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={18} color={colors.primary.yellow} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={colors.status.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <SafeScreen>
        <Header
          title="Gyms"
          showBack
          onBack={() => router.back()}
          rightAction={
            <TouchableOpacity
              onPress={() => router.push('/(app)/(admin)/gyms/create')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />

        <View style={styles.listContainer}>
          <FlashList
            data={gyms}
            renderItem={renderGymItem}
            estimatedItemSize={150}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              !isLoading ? (
                <EmptyState
                  icon="business-outline"
                  title="No gyms yet"
                  message="Create your first gym to get started"
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
  gymCard: {
    marginTop: spacing.md,
  },
  gymHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  gymInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  gymName: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
  },
  gymLocation: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    marginTop: 2,
  },
  gymDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  gymMeta: {
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
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.light,
  },
  gymActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: colors.background.light,
    borderColor: colors.primary.yellow,
  },
  editButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary.yellowDark,
  },
  deleteButton: {
    backgroundColor: colors.background.light,
    borderColor: colors.status.error,
  },
  deleteButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.status.error,
  },
});
