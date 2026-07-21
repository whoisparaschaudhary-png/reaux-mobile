import { create } from 'zustand';
import { cyclesApi } from '../api/endpoints/cycles';
import type { CyclePlan, CycleCategory, CycleLevel, CycleType, User } from '../types/models';
import type { CreateCycleRequest } from '../types/api';

interface CyclePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface CycleState {
  cycles: CyclePlan[];
  selectedCycle: CyclePlan | null;
  isLoading: boolean;
  error: string | null;
  pagination: CyclePagination;

  fetchCycles: (
    page?: number,
    category?: CycleCategory,
    options?: { includeUnpublished?: boolean; level?: CycleLevel; type?: CycleType },
  ) => Promise<void>;
  getCycleById: (id: string) => Promise<void>;
  followCycle: (id: string) => Promise<void>;
  likeCycle: (id: string) => Promise<void>;
  createCycle: (data: CreateCycleRequest | FormData, currentUser?: User | null) => Promise<void>;
  updateCycle: (id: string, data: Partial<CreateCycleRequest> | FormData) => Promise<void>;
  deleteCycle: (id: string) => Promise<void>;
  setCyclePublished: (id: string, isPublished: boolean) => Promise<void>;
  clearError: () => void;
  clearSelectedCycle: () => void;
}

// Backend may omit denormalized counts / return an unpopulated author — normalize
// exactly like the diet store so the UI always has numbers and keeps the author.
const withCounts = (cycle: CyclePlan, existing?: CyclePlan): CyclePlan => {
  const createdByPopulated =
    typeof cycle.createdBy === 'object' && cycle.createdBy !== null && (cycle.createdBy as User).name;
  return {
    ...cycle,
    likesCount: cycle.likesCount ?? cycle.likes?.length ?? 0,
    followersCount: cycle.followersCount ?? cycle.followers?.length ?? 0,
    createdBy: createdByPopulated ? cycle.createdBy : (existing?.createdBy ?? cycle.createdBy),
  };
};

export const useCycleStore = create<CycleState>((set, get) => ({
  cycles: [],
  selectedCycle: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },

  fetchCycles: async (page = 1, category?, options?) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (category) params.category = category;
      if (options?.level) params.level = options.level;
      if (options?.type) params.type = options.type;
      if (options?.includeUnpublished) params.includeUnpublished = options.includeUnpublished;
      const response = await cyclesApi.list(params);

      const currentCycles = get().cycles;
      const cyclesWithCounts = response.data.map((cycle) =>
        withCounts(cycle, currentCycles.find((c) => c._id === cycle._id)),
      );

      set({
        cycles: page === 1 ? cyclesWithCounts : [...currentCycles, ...cyclesWithCounts],
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch cycles', isLoading: false });
    }
  },

  getCycleById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cyclesApi.getById(id);
      set({ selectedCycle: withCounts(response.data), isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch cycle', isLoading: false });
    }
  },

  followCycle: async (id) => {
    const { cycles, selectedCycle } = get();

    const optimisticUpdate = (cycle: CyclePlan) => {
      if (cycle._id !== id) return cycle;
      const currentCount = cycle.followersCount ?? 0;
      const isCurrentlyFollowed = cycle.isFollowed ?? false;
      return {
        ...cycle,
        isFollowed: !isCurrentlyFollowed,
        followersCount: isCurrentlyFollowed ? currentCount - 1 : currentCount + 1,
      };
    };

    set({
      cycles: cycles.map(optimisticUpdate),
      selectedCycle: selectedCycle ? optimisticUpdate(selectedCycle) : null,
    });

    try {
      const response = await cyclesApi.follow(id);
      const serverCycle = response.data;
      const createdByPopulated =
        typeof serverCycle.createdBy === 'object' && serverCycle.createdBy !== null && (serverCycle.createdBy as User).name;

      set((state) => ({
        cycles: state.cycles.map((c) => {
          if (c._id !== id) return c;
          const merged = {
            ...c,
            ...serverCycle,
            likesCount: serverCycle.likesCount ?? serverCycle.likes?.length ?? c.likesCount,
            followersCount: serverCycle.followersCount ?? serverCycle.followers?.length ?? c.followersCount,
          };
          if (!createdByPopulated && c.createdBy) merged.createdBy = c.createdBy;
          return merged;
        }),
        selectedCycle: state.selectedCycle?._id === id ? (() => {
          const merged = { ...state.selectedCycle!, ...serverCycle, likesCount: serverCycle.likesCount ?? state.selectedCycle!.likesCount, followersCount: serverCycle.followersCount ?? state.selectedCycle!.followersCount };
          if (!createdByPopulated && state.selectedCycle!.createdBy) merged.createdBy = state.selectedCycle!.createdBy;
          return merged;
        })() : state.selectedCycle,
      }));
    } catch (err: any) {
      set({ cycles, selectedCycle, error: err.message || 'Failed to follow cycle' });
      throw err;
    }
  },

  likeCycle: async (id) => {
    const { cycles, selectedCycle } = get();

    const optimisticUpdate = (cycle: CyclePlan) => {
      if (cycle._id !== id) return cycle;
      const currentCount = cycle.likesCount ?? 0;
      const isCurrentlyLiked = cycle.isLiked ?? false;
      return {
        ...cycle,
        isLiked: !isCurrentlyLiked,
        likesCount: isCurrentlyLiked ? currentCount - 1 : currentCount + 1,
      };
    };

    set({
      cycles: cycles.map(optimisticUpdate),
      selectedCycle: selectedCycle ? optimisticUpdate(selectedCycle) : null,
    });

    try {
      const response = await cyclesApi.like(id);
      const serverCycle = response.data;
      const createdByPopulated =
        typeof serverCycle.createdBy === 'object' && serverCycle.createdBy !== null && (serverCycle.createdBy as User).name;

      set((state) => ({
        cycles: state.cycles.map((c) => {
          if (c._id !== id) return c;
          const merged = {
            ...c,
            ...serverCycle,
            likesCount: serverCycle.likesCount ?? serverCycle.likes?.length ?? c.likesCount,
            followersCount: serverCycle.followersCount ?? serverCycle.followers?.length ?? c.followersCount,
          };
          if (!createdByPopulated && c.createdBy) merged.createdBy = c.createdBy;
          return merged;
        }),
        selectedCycle: state.selectedCycle?._id === id ? (() => {
          const merged = { ...state.selectedCycle!, ...serverCycle, likesCount: serverCycle.likesCount ?? state.selectedCycle!.likesCount, followersCount: serverCycle.followersCount ?? state.selectedCycle!.followersCount };
          if (!createdByPopulated && state.selectedCycle!.createdBy) merged.createdBy = state.selectedCycle!.createdBy;
          return merged;
        })() : state.selectedCycle,
      }));
    } catch (err: any) {
      set({ cycles, selectedCycle, error: err.message || 'Failed to like cycle' });
      throw err;
    }
  },

  createCycle: async (data, currentUser) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cyclesApi.create(data);
      const newCycle = response.data;
      const createdByPopulated =
        typeof newCycle.createdBy === 'object' && newCycle.createdBy !== null && (newCycle.createdBy as User).name;
      const cycleToPrepend: CyclePlan = createdByPopulated
        ? withCounts(newCycle)
        : withCounts({ ...newCycle, createdBy: currentUser ?? newCycle.createdBy });
      set((state) => ({
        cycles: [cycleToPrepend, ...state.cycles],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to create cycle', isLoading: false });
      throw err;
    }
  },

  updateCycle: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cyclesApi.update(id, data);
      const updated = withCounts(response.data, get().cycles.find((c) => c._id === id));
      set((state) => ({
        cycles: state.cycles.map((c) => (c._id === id ? updated : c)),
        selectedCycle: state.selectedCycle?._id === id ? updated : state.selectedCycle,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to update cycle', isLoading: false });
      throw err;
    }
  },

  deleteCycle: async (id) => {
    const { cycles, selectedCycle } = get();
    // Optimistically remove; roll back on failure.
    set({
      cycles: cycles.filter((c) => c._id !== id),
      selectedCycle: selectedCycle?._id === id ? null : selectedCycle,
    });
    try {
      await cyclesApi.remove(id);
    } catch (err: any) {
      set({ cycles, selectedCycle, error: err.message || 'Failed to delete cycle' });
      throw err;
    }
  },

  setCyclePublished: async (id, isPublished) => {
    try {
      const response = await cyclesApi.update(id, { isPublished });
      const updated = response.data;
      const createdByPopulated =
        typeof updated.createdBy === 'object' && updated.createdBy !== null && (updated.createdBy as User).name;
      set((state) => {
        const merge = (target: CyclePlan) => {
          const m = { ...target, ...updated };
          if (!createdByPopulated && target.createdBy) m.createdBy = target.createdBy;
          return m;
        };
        return {
          cycles: state.cycles.map((c) => (c._id === id ? merge(c) : c)),
          selectedCycle: state.selectedCycle?._id === id ? merge(state.selectedCycle) : state.selectedCycle,
        };
      });
    } catch (err: any) {
      throw err;
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedCycle: () => set({ selectedCycle: null }),
}));
