import { create } from 'zustand';
import { dietsApi } from '../api/endpoints/diets';
import type { DietPlan, DietCategory, DietType, User } from '../types/models';
import type { CreateDietRequest } from '../types/api';

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

  fetchPlans: (page?: number, category?: DietCategory, options?: { includeUnpublished?: boolean; dietType?: DietType }) => Promise<void>;
  getPlanById: (id: string) => Promise<void>;
  fetchSuggestedPlans: (page?: number) => Promise<void>;
  followPlan: (id: string) => Promise<void>;
  likePlan: (id: string) => Promise<void>;
  createPlan: (data: CreateDietRequest | FormData, currentUser?: User | null) => Promise<void>;
  updatePlan: (id: string, data: Partial<CreateDietRequest> | FormData) => Promise<void>;
  setPlanPublished: (id: string, isPublished: boolean) => Promise<void>;
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

  fetchPlans: async (page = 1, category?, options?) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (category) params.category = category;
      const response = await dietsApi.list(params);

      const currentPlans = get().plans;
      const plansWithCounts = response.data.map(plan => {
        const existing = currentPlans.find(p => p._id === plan._id);
        const createdByPopulated =
          typeof plan.createdBy === 'object' && plan.createdBy !== null && (plan.createdBy as User).name;
        return {
          ...plan,
          likesCount: plan.likesCount ?? plan.likes?.length ?? 0,
          followersCount: plan.followersCount ?? plan.followers?.length ?? 0,
          createdBy: createdByPopulated ? plan.createdBy : (existing?.createdBy ?? plan.createdBy),
        };
      });

      set({
        plans: page === 1 ? plansWithCounts : [...currentPlans, ...plansWithCounts],
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

      // Ensure count fields exist (initialize from arrays if not provided by backend)
      const planWithCounts = {
        ...response.data,
        likesCount: response.data.likesCount ?? response.data.likes?.length ?? 0,
        followersCount: response.data.followersCount ?? response.data.followers?.length ?? 0,
      };

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

    // Optimistic update: toggle isFollowed and followersCount
    const optimisticUpdate = (plan: DietPlan) => {
      if (plan._id !== id) return plan;
      const currentCount = plan.followersCount ?? 0;
      const isCurrentlyFollowed = plan.isFollowed ?? false;
      return {
        ...plan,
        isFollowed: !isCurrentlyFollowed,
        followersCount: isCurrentlyFollowed ? currentCount - 1 : currentCount + 1,
      };
    };

    set({
      plans: plans.map(optimisticUpdate),
      selectedPlan: selectedPlan ? optimisticUpdate(selectedPlan) : null,
    });

    try {
      const response = await dietsApi.follow(id);
      const serverPlan = response.data;
      const createdByPopulated =
        typeof serverPlan.createdBy === 'object' && serverPlan.createdBy !== null && (serverPlan.createdBy as User).name;

      set((state) => ({
        plans: state.plans.map((p) => {
          if (p._id !== id) return p;
          const merged = {
            ...p,
            ...serverPlan,
            likesCount: serverPlan.likesCount ?? serverPlan.likes?.length ?? p.likesCount,
            followersCount: serverPlan.followersCount ?? serverPlan.followers?.length ?? p.followersCount,
          };
          if (!createdByPopulated && p.createdBy) merged.createdBy = p.createdBy;
          return merged;
        }),
        selectedPlan: state.selectedPlan?._id === id ? (() => {
          const merged = { ...state.selectedPlan!, ...serverPlan, likesCount: serverPlan.likesCount ?? state.selectedPlan!.likesCount, followersCount: serverPlan.followersCount ?? state.selectedPlan!.followersCount };
          if (!createdByPopulated && state.selectedPlan!.createdBy) merged.createdBy = state.selectedPlan!.createdBy;
          return merged;
        })() : state.selectedPlan,
      }));
    } catch (err: any) {
      // Revert optimistic update on failure
      set({ plans, selectedPlan, error: err.message || 'Failed to follow plan' });
      throw err;
    }
  },

  likePlan: async (id) => {
    const { plans, selectedPlan } = get();

    // Optimistic update: toggle isLiked and likesCount
    const optimisticUpdate = (plan: DietPlan) => {
      if (plan._id !== id) return plan;
      const currentCount = plan.likesCount ?? 0;
      const isCurrentlyLiked = plan.isLiked ?? false;
      return {
        ...plan,
        isLiked: !isCurrentlyLiked,
        likesCount: isCurrentlyLiked ? currentCount - 1 : currentCount + 1,
      };
    };

    set({
      plans: plans.map(optimisticUpdate),
      selectedPlan: selectedPlan ? optimisticUpdate(selectedPlan) : null,
    });

    try {
      const response = await dietsApi.like(id);
      const serverPlan = response.data;
      const createdByPopulated =
        typeof serverPlan.createdBy === 'object' && serverPlan.createdBy !== null && (serverPlan.createdBy as User).name;

      set((state) => ({
        plans: state.plans.map((p) => {
          if (p._id !== id) return p;
          const merged = {
            ...p,
            ...serverPlan,
            likesCount: serverPlan.likesCount ?? serverPlan.likes?.length ?? p.likesCount,
            followersCount: serverPlan.followersCount ?? serverPlan.followers?.length ?? p.followersCount,
          };
          if (!createdByPopulated && p.createdBy) merged.createdBy = p.createdBy;
          return merged;
        }),
        selectedPlan: state.selectedPlan?._id === id ? (() => {
          const merged = { ...state.selectedPlan!, ...serverPlan, likesCount: serverPlan.likesCount ?? state.selectedPlan!.likesCount, followersCount: serverPlan.followersCount ?? state.selectedPlan!.followersCount };
          if (!createdByPopulated && state.selectedPlan!.createdBy) merged.createdBy = state.selectedPlan!.createdBy;
          return merged;
        })() : state.selectedPlan,
      }));
    } catch (err: any) {
      // Revert optimistic update on failure
      set({ plans, selectedPlan, error: err.message || 'Failed to like plan' });
      throw err;
    }
  },

  createPlan: async (data, currentUser) => {
    set({ isLoading: true, error: null });
    try {
      const response = await dietsApi.create(data);
      const newPlan = response.data;
      const createdByPopulated =
        typeof newPlan.createdBy === 'object' && newPlan.createdBy !== null && (newPlan.createdBy as User).name;
      const planToPrepend: DietPlan = createdByPopulated
        ? newPlan
        : { ...newPlan, createdBy: currentUser ?? newPlan.createdBy };
      set((state) => ({
        plans: [planToPrepend, ...state.plans],
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

  setPlanPublished: async (id, isPublished) => {
    const { plans, selectedPlan } = get();
    try {
      const response = await dietsApi.update(id, { isPublished });
      const updated = response.data;
      const createdByPopulated =
        typeof updated.createdBy === 'object' && updated.createdBy !== null && (updated.createdBy as User).name;
      set((state) => {
        const prevSelected = state.selectedPlan?._id === id ? state.selectedPlan : null;
        const merge = (target: DietPlan) => {
          const m = { ...target, ...updated };
          if (!createdByPopulated && target.createdBy) m.createdBy = target.createdBy;
          return m;
        };
        return {
          plans: state.plans.map((p) => (p._id === id ? merge(p) : p)),
          selectedPlan: prevSelected ? merge(prevSelected) : state.selectedPlan,
        };
      });
    } catch (err: any) {
      throw err;
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedPlan: () => set({ selectedPlan: null }),
}));
