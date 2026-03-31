import { useFeedStore } from './useFeedStore';
import { useReelStore } from './useReelStore';
import { useDietStore } from './useDietStore';
import { useProductStore } from './useProductStore';
import { useCartStore } from './useCartStore';
import { useOrderStore } from './useOrderStore';
import { useNotificationStore } from './useNotificationStore';
import { useMembershipStore } from './useMembershipStore';
import { useBmiStore } from './useBmiStore';
import { useChallengeStore } from './useChallengeStore';
import { useAdminStore } from './useAdminStore';
import { useWorkoutStore } from './useWorkoutStore';

/**
 * Clears all user-scoped store data.
 * Call this on logout AND before setting new user data on login,
 * so switching accounts never shows stale data from a previous session.
 */
export function resetAllStores() {
  useFeedStore.setState({ postsByCategory: {}, isLoading: false, isRefreshing: false, error: null });
  useReelStore.setState({ reels: [], isLoading: false, isRefreshing: false, error: null, comments: [], commentsLoading: false });
  useDietStore.setState({ plans: [], selectedPlan: null, suggestedPlans: [], isLoading: false, error: null });
  useProductStore.setState({ products: [], selectedProduct: null, isLoading: false, error: null });
  useCartStore.setState({ cart: null, isLoading: false, error: null, selectedAddress: null });
  useOrderStore.setState({ orders: [], selectedOrder: null, isLoading: false, error: null });
  useNotificationStore.setState({ notifications: [], unreadCount: 0, isLoading: false, isRefreshing: false, error: null });
  useMembershipStore.setState({ memberships: [], myMemberships: [], selectedMembership: null, plans: [], selectedPlan: null, membershipsLoading: false, plansLoading: false });
  useBmiStore.setState({ records: [], latestRecord: null, isLoading: false, error: null });
  useChallengeStore.setState({ challenges: [], isLoading: false, isRefreshing: false, error: null });
  useAdminStore.setState({ stats: null, salesReport: null, users: [], isLoading: false, error: null });
  useWorkoutStore.setState({ workouts: [], selectedWorkout: null, isLoading: false, isRefreshing: false, error: null });
}
