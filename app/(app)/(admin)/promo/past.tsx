import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
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
import { promosApi } from '../../../../src/api/endpoints/promos';
import { formatCurrency, formatDate } from '../../../../src/utils/formatters';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../../../src/theme';
import { ms, mvs } from '../../../../src/utils/responsive';
import type { PromoCode } from '../../../../src/types/models';

const getPromoStatus = (promo: PromoCode) => {
  const now = new Date();
  if (!promo.isActive) return 'inactive';
  if (promo.validFrom && now < new Date(promo.validFrom)) return 'scheduled';
  if (promo.validUntil && now > new Date(promo.validUntil)) return 'expired';
  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return 'exhausted';
  return 'active';
};

const statusConfig = {
  active: { text: 'Active', variant: 'success' as const },
  inactive: { text: 'Inactive', variant: 'error' as const },
  scheduled: { text: 'Scheduled', variant: 'warning' as const },
  expired: { text: 'Expired', variant: 'default' as const },
  exhausted: { text: 'Exhausted', variant: 'default' as const },
};

const formatDiscount = (promo: PromoCode) => {
  if (promo.discountType === 'percentage') {
    return `${promo.discountValue}% off`;
  }
  return `${formatCurrency(promo.discountValue)} off`;
};

interface PromoCardProps {
  promo: PromoCode;
  onEdit: () => void;
}

const PromoCard: React.FC<PromoCardProps> = ({ promo, onEdit }) => {
  const status = getPromoStatus(promo);
  const config = statusConfig[status];

  return (
    <Card style={styles.promoCard}>
      <View style={styles.cardHeader}>
        <View style={styles.codeContainer}>
          <Ionicons name="pricetag-outline" size={16} color={colors.primary.yellowDark} />
          <Text style={styles.codeText}>{promo.code}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Badge text={config.text} variant={config.variant} size="sm" />
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.discountRow}>
        <Text style={styles.discountText}>{formatDiscount(promo)}</Text>
        {promo.minOrderAmount > 0 && (
          <Text style={styles.minOrderText}>
            Min. {formatCurrency(promo.minOrderAmount)}
          </Text>
        )}
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={14} color={colors.text.light} />
          <Text style={styles.detailText}>
            {promo.usedCount}{promo.usageLimit ? `/${promo.usageLimit}` : ''} used
          </Text>
        </View>

        {promo.maxDiscount && promo.discountType === 'percentage' ? (
          <View style={styles.detailItem}>
            <Ionicons name="trending-down-outline" size={14} color={colors.text.light} />
            <Text style={styles.detailText}>
              Max {formatCurrency(promo.maxDiscount)}
            </Text>
          </View>
        ) : null}
      </View>

      {(promo.validFrom || promo.validUntil) && (
        <View style={styles.datesRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.text.light} />
          <Text style={styles.dateText}>
            {promo.validFrom ? formatDate(promo.validFrom) : 'Start'} -{' '}
            {promo.validUntil ? formatDate(promo.validUntil) : 'No end'}
          </Text>
        </View>
      )}
    </Card>
  );
};

export default function PastPromosScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPromos = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      const response = await promosApi.list({ page: pageNum, limit: 15 });
      const newData = response.data;

      if (refresh || pageNum === 1) {
        setPromos(newData);
      } else {
        setPromos((prev) => [...prev, ...newData]);
      }

      setPage(pageNum);
      setHasMore(pageNum < response.pagination.pages);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchPromos(1);
      setIsLoading(false);
    };
    load();
  }, [fetchPromos]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPromos(1, true);
    setIsRefreshing(false);
  }, [fetchPromos]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchPromos(page + 1);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, page, fetchPromos]);

  const handleCreateNew = () => {
    router.push('/(app)/(admin)/promo/create');
  };

  const handleEdit = useCallback((promo: PromoCode) => {
    router.push({
      pathname: '/(app)/(admin)/promo/edit',
      params: { id: promo._id },
    } as any);
  }, [router]);

  const renderPromoItem = ({ item }: { item: PromoCode }) => (
    <PromoCard promo={item} onEdit={() => handleEdit(item)} />
  );

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <SafeScreen>
        <Header
          title="Promo Codes"
          showBack
          onBack={() => router.back()}
        />

        <View style={styles.listContainer}>
          <FlashList
            data={promos}
            renderItem={renderPromoItem}
            estimatedItemSize={160}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.text.light} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !isLoading ? (
                <EmptyState
                  icon="pricetag-outline"
                  title="No promo codes"
                  message="Create your first promo code to offer discounts"
                />
              ) : null
            }
          />
        </View>

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, shadows.card]}
          onPress={handleCreateNew}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.text.onPrimary} />
          <Text style={styles.fabText}>New Promo</Text>
        </TouchableOpacity>
      </SafeScreen>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  promoCard: {
    marginTop: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(16),
    lineHeight: ms(22),
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  discountText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.status.success,
  },
  minOrderText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.secondary,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
  },
  loadingMore: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.yellow,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.pill,
    gap: spacing.sm,
  },
  fabText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.onPrimary,
  },
});
