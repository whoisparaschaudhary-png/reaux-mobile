import { create } from 'zustand';
import { dietsApi } from '../api/endpoints/diets';
import type { DietPlan, DietCategory } from '../types/models';
import type { CreateDietRequest } from '../types/api';

// Backend returns isLiked/isFollowed directly when Bearer token is present
const computePlanFlags = (plan: DietPlan): DietPlan => ({
  ...plan,
  isLiked: plan.isLiked ?? false,
  isFollowed: plan.isFollowed ?? false,
  likesCount: plan.likesCount ?? 0,
  followersCount: plan.followersCount ?? 0,
});

interface DietPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface DietState {
  plans: DietPlan[];
  selectedPlan: DietPlan | null;
  suggestedPlans: DietPlan[];
  isLoading: boolean;
  error: string | null;
  pagination: DietPagination;
  suggestedPagination: DietPagination;

  fetchPlans: (page?: number, category?: DietCategory) => Promise<void>;
  getPlanById: (id: string) => Promise<void>;
  fetchSuggestedPlans: (page?: number) => Promise<void>;
  followPlan: (id: string) => Promise<void>;
  likePlan: (id: string) => Promise<void>;
  createPlan: (data: CreateDietRequest | FormData) => Promise<void>;
  updatePlan: (id: string, data: Partial<CreateDietRequest> | FormData) => Promise<void>;
  clearError: () => void;
  clearSelectedPlan: () => void;
}

export const useDietStore = create<DietState>((set, get) => ({
  plans: [],
  selectedPlan: null,
  suggestedPlans: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  suggestedPagination: { page: 1, limit: 10, total: 0, pages: 0 },

  fetchPlans: async (page = 1, category?) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (category) params.category = category;
      const response = await dietsApi.list(params);

      const plansWithCounts = response.data.map(computePlanFlags);

      set({
        plans: page === 1 ? plansWithCounts : [...get().plans, ...plansWithCounts],
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch diet plans',
        isLoading: false,
      });
    }
  },

  getPlanById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await dietsApi.getById(id);

      const planWithCounts = computePlanFlags(response.data);

      set({ selectedPlan: planWithCounts, isLoading: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch diet plan',
        isLoading: false,
      });
    }
  },

  fetchSuggestedPlans: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const params = { page, limit: 10 };
      const response = await dietsApi.getSuggested(params);
      set({
        suggestedPlans: page === 1 ? response.data : [...get().suggestedPlans, ...response.data],
        suggestedPagination: response.pagination,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch suggested diet plans',
        isLoading: false,
      });
    }
  },

  followPlan: async (id) => {
    const { plans, selectedPlan } = get();

    // Optimistic update
    const optimisticUpdate = (plan: DietPlan) => {
      if (plan._id !== id) return plan;
      const isCurrentlyFollowed = plan.isFollowed ?? false;
      return {
        ...plan,
        isFollowed: !isCurrentlyFollowed,
        followersCount: isCurrentlyFollowed ? (plan.followersCount ?? 1) - 1 : (plan.followersCount ?? 0) + 1,
      };
    };

    set({
      plans: plans.map(optimisticUpdate),
      selectedPlan: selectedPlan ? optimisticUpdate(selectedPlan) : null,
    });

    try {
      const response = await dietsApi.follow(id);
      const serverPlan = response.data;

      set((state) => ({
        plans: state.plans.map((p) =>
          p._id !== id ? p : {
            ...p,
            isFollowed: serverPlan.isFollowed ?? p.isFollowed,
            followersCount: serverPlan.followersCount ?? p.followersCount,
          }
        ),
        selectedPlan: state.selectedPlan?._id === id ? {
          ...state.selectedPlan,
          isFollowed: serverPlan.isFollowed ?? state.selectedPlan.isFollowed,
          followersCount: serverPlan.followersCount ?? state.selectedPlan.followersCount,
        } : state.selectedPlan,
      }));
    } catch (err: any) {
      set({ plans, selectedPlan, error: err.message || 'Failed to follow plan' });
      throw err;
    }
  },

  likePlan: async (id) => {
    const { plans, selectedPlan } = get();

    // Optimistic update
    const optimisticUpdate = (plan: DietPlan) => {
      if (plan._id !== id) return plan;
      const isCurrentlyLiked = plan.isLiked ?? false;
      return {
        ...plan,
        isLiked: !isCurrentlyLiked,
        likesCount: isCurrentlyLiked ? (plan.likesCount ?? 1) - 1 : (plan.likesCount ?? 0) + 1,
      };
    };

    set({
      plans: plans.map(optimisticUpdate),
      selectedPlan: selectedPlan ? optimisticUpdate(selectedPlan) : null,
    });

    try {
      const response = await dietsApi.like(id);
      const serverPlan = response.data;

      set((state) => ({
        plans: state.plans.map((p) =>
          p._id !== id ? p : {
            ...p,
            isLiked: serverPlan.isLiked ?? p.isLiked,
            likesCount: serverPlan.likesCount ?? p.likesCount,
          }
        ),
        selectedPlan: state.selectedPlan?._id === id ? {
          ...state.selectedPlan,
          isLiked: serverPlan.isLiked ?? state.selectedPlan.isLiked,
          likesCount: serverPlan.likesCount ?? state.selectedPlan.likesCount,
        } : state.selectedPlan,
      }));
    } catch (err: any) {
      set({ plans, selectedPlan, error: err.message || 'Failed to like plan' });
      throw err;
    }
  },

  createPlan: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await dietsApi.create(data);
      set((state) => ({
        plans: [response.data, ...state.plans],
        isLoading: false,
      }));
    } catch (err: any) {
      set({
        error: err.message || 'Failed to create diet plan',
        isLoading: false,
      });
      throw err;
    }
  },

  updatePlan: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await dietsApi.update(id, data);
      set((state) => ({
        plans: state.plans.map((p) => (p._id === id ? response.data : p)),
        selectedPlan:
          state.selectedPlan?._id === id ? response.data : state.selectedPlan,
        isLoading: false,
      }));
    } catch (err: any) {
      set({
        error: err.message || 'Failed to update diet plan',
        isLoading: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedPlan: () => set({ selectedPlan: null }),
}));
