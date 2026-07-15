import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { ProductCard } from '../../../src/components/cards/ProductCard';
import { useProductStore } from '../../../src/stores/useProductStore';
import { useCartStore } from '../../../src/stores/useCartStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useDebounce } from '../../../src/hooks/useDebounce';
import { useRefreshOnFocus } from '../../../src/hooks/useRefreshOnFocus';
import { formatCurrency } from '../../../src/utils/formatters';
import { PRODUCT_CATEGORIES } from '../../../src/utils/constants';
import { colors, fontFamily, borderRadius, spacing, shadows, layout } from '../../../src/theme';
import { ms, mvs, getColumns } from '../../../src/utils/responsive';

const CATEGORIES = ['All', ...PRODUCT_CATEGORIES];

export default function MarketplaceScreen() {
  const {
    products,
    isLoading,
    pagination,
    searchQuery,
    category,
    fetchProducts,
    setSearchQuery,
    setCategory,
  } = useProductStore();

  const { fetchCart, addToCart, itemCount, cartTotal } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const { width: screenW } = useWindowDimensions();
  const numCols  = getColumns({ sm: 2, md: 3, lg: 4 });
  const colWidth = (screenW - spacing.xl * 2 - spacing.md * (numCols - 1)) / numCols;

  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    fetchProducts(1);
    fetchCart();
  }, []);

  useEffect(() => {
    fetchProducts(1, debouncedSearch, category);
  }, [debouncedSearch, category]);

  useRefreshOnFocus(
    useCallback(() => { fetchCart(); }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(1), fetchCart()]);
    setRefreshing(false);
  }, [category, debouncedSearch]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || pagination.page >= pagination.pages) return;
    fetchProducts(pagination.page + 1);
  }, [isLoading, pagination]);

  const handleCategoryPress = useCallback(
    (cat: string) => {
      setCategory(cat === 'All' ? '' : (cat === category ? '' : cat));
    },
    [category],
  );

  const handleAddToCart = useCallback(
    (product: any) => {
      // A flavoured product needs a flavour chosen first — send it to the detail
      // screen instead of adding a flavourless (unfulfillable) line.
      if (product.flavours?.length) {
        router.push(`/(app)/(shop)/${product._id}`);
        return;
      }
      addToCart(product._id, 1).catch(() => {});
    },
    [addToCart],
  );

  const count = itemCount();
  const total = cartTotal();

  const renderProduct = useCallback(
    ({ item }: { item: any }) => (
      <ProductCard
        product={item}
        onPress={() => router.push(`/(app)/(shop)/${item._id}`)}
        onAddToCart={() => handleAddToCart(item)}
        numColumns={numCols}
      />
    ),
    [handleAddToCart, numCols],
  );

  const ListHeader = useCallback(
    () => (
      <View>
        <Text style={styles.sectionTitle}>In House Products</Text>
      </View>
    ),
    [isAdmin],
  );

  const ListFooter = useCallback(() => {
    if (isLoading && pagination.page > 1) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary.yellow} />
        </View>
      );
    }
    return <View style={styles.footerSpacer} />;
  }, [isLoading, pagination.page]);

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.header}>Marketplace</Text>

        {/* Search */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
          />
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat === category || (cat === 'All' && !category);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => handleCategoryPress(cat)}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Products Grid */}
        {products.length === 0 && !isLoading ? (
          <EmptyState
            icon="storefront-outline"
            title="No Products Found"
            message="Try adjusting your search or filters"
          />
        ) : (
          <FlashList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item._id}
            numColumns={numCols}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary.yellow}
              />
            }
            ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
          />
        )}

        {/* Skeleton loading for first load */}
        {isLoading && products.length === 0 && (
          <View style={styles.loadingOverlay}>
            <View style={styles.skeletonGrid}>
              {Array.from({ length: numCols * 2 }).map((_, i) => (
                <View key={i} style={[styles.skeletonItem, { width: colWidth }]}>
                  <SkeletonLoader width="100%" height={mvs(140)} borderRadius={ms(12)} />
                  <SkeletonLoader width="70%" height={mvs(14)} style={{ marginTop: ms(10) }} />
                  <SkeletonLoader width="40%" height={mvs(14)} style={{ marginTop: ms(6) }} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Floating Cart Badge */}
        {count > 0 && (
          <TouchableOpacity
            style={[styles.floatingCart, shadows.large]}
            activeOpacity={0.85}
            onPress={() => router.push('/(app)/(shop)/cart')}
          >
            <View style={styles.floatingCartLeft}>
              <Ionicons name="cart" size={ms(22)} color={colors.text.onPrimary} />
              <View style={styles.cartCountBadge}>
                <Text style={styles.cartCountText}>{count}</Text>
              </View>
            </View>
            <Text style={styles.floatingCartText}>View Cart</Text>
            <Text style={styles.floatingCartTotal}>{formatCurrency(total)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontFamily: fontFamily.bold,
    fontSize: ms(28),
    lineHeight: ms(34),
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },

  categoriesScroll: {
    marginBottom: spacing.lg,
    flexGrow: 0,
  },
  categoriesContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border.light,
    marginRight: spacing.sm,
  },
  categoryTabActive: {
    backgroundColor: colors.primary.yellow,
  },
  categoryText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    color: colors.text.secondary,
  },
  categoryTextActive: {
    color: colors.text.onPrimary,
    fontFamily: fontFamily.bold,
  },

  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(18),
    lineHeight: ms(22),
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  listContent: {
    paddingHorizontal: spacing.xl,
  },

  footerLoader: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  footerSpacer: {
    height: layout.tabBarHeight + ms(60),
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  skeletonItem: {
    marginBottom: spacing.md,
  },

  floatingCart: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary.yellow,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    height: mvs(56),
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  cartCountBadge: {
    position: 'absolute',
    top: ms(-6),
    right: ms(-10),
    backgroundColor: colors.background.dark,
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(10),
    color: colors.text.white,
  },
  floatingCartText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(16),
    color: colors.text.onPrimary,
  },
  floatingCartTotal: {
    fontFamily: fontFamily.bold,
    fontSize: ms(16),
    color: colors.text.onPrimary,
  },
});
