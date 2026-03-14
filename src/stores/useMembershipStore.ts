import { create } from 'zustand';
import {
  membershipPlansApi,
  membershipsApi,
  type CreateMembershipPlanRequest,
  type UpdateMembershipPlanRequest,
  type AssignMembershipRequest,
  type RecordFeesRequest,
} from '../api/endpoints/memberships';
import type { MembershipPlan, Membership } from '../types/models';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface MembershipState {
  // Plans state
  plans: MembershipPlan[];
  selectedPlan: MembershipPlan | null;
  plansLoading: boolean;
  plansError: string | null;
  plansPagination: Pagination;

  // Memberships state
  memberships: Membership[];
  myMemberships: Membership[];
  selectedMembership: Membership | null;
  membershipsLoading: boolean;
  membershipsError: string | null;
  membershipsPagination: Pagination;

  // Plan actions
  fetchPlans: (page?: number, gymId?: string) => Promise<void>;
  fetchPlanById: (id: string) => Promise<void>;
  createPlan: (data: CreateMembershipPlanRequest) => Promise<void>;
  updatePlan: (id: string, data: UpdateMembershipPlanRequest) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;

  // Membership actions
  assignMembership: (data: AssignMembershipRequest) => Promise<void>;
  fetchMemberships: (
    page?: number,
    filters?: { userId?: string; gymId?: string; status?: string }
  ) => Promise<void>;
  fetchMyMemberships: (page?: number) => Promise<void>;
  fetchMembershipById: (id: string) => Promise<void>;
  cancelMembership: (id: string) => Promise<void>;
  recordFees: (id: string, data: RecordFeesRequest) => Promise<void>;
  applyCredit: (id: string, amount: number) => Promise<void>;

  // Utility actions
  clearPlansError: () => void;
  clearMembershipsError: () => void;
  clearSelectedPlan: () => void;
  clearSelectedMembership: () => void;
}

export const useMembershipStore = create<MembershipState>((set, get) => ({
  // ─── Initial State ─────────────────────────────────────────────────

  plans: [],
  selectedPlan: null,
  plansLoading: false,
  plansError: null,
  plansPagination: { page: 1, limit: 10, total: 0, pages: 0 },

  memberships: [],
  myMemberships: [],
  selectedMembership: null,
  membershipsLoading: false,
  membershipsError: null,
  membershipsPagination: { page: 1, limit: 10, total: 0, pages: 0 },

  // ─── Plan Actions ──────────────────────────────────────────────────

  fetchPlans: async (page = 1, gymId?: string) => {
    set({ plansLoading: true, plansError: null });
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (gymId) params.gymId = gymId;

      const response = await membershipPlansApi.list(params);

      set({
        plans: page === 1 ? response.data : [...get().plans, ...response.data],
        plansPagination: response.pagination,
        plansLoading: false,
      });
    } catch (err: any) {
      set({
        plansError: err.message || 'Failed to fetch membership plans',
        plansLoading: false,
      });
    }
  },

  fetchPlanById: async (id: string) => {
    set({ plansLoading: true, plansError: null });
    try {
      const response = await membershipPlansApi.getById(id);
      set({ selectedPlan: response.data, plansLoading: false });
    } catch (err: any) {
      set({
        plansError: err.message || 'Failed to fetch plan details',
        plansLoading: false,
      });
    }
  },

  createPlan: async (data: CreateMembershipPlanRequest) => {
    set({ plansLoading: true, plansError: null });
    try {
      const response = await membershipPlansApi.create(data);
      set((state) => ({
        plans: [response.data, ...state.plans],
        plansLoading: false,
      }));
    } catch (err: any) {
      set({
        plansError: err.message || 'Failed to create plan',
        plansLoading: false,
      });
      throw err;
    }
  },

  updatePlan: async (id: string, data: UpdateMembershipPlanRequest) => {
    set({ plansLoading: true, plansError: null });
    try {
      const response = await membershipPlansApi.update(id, data);
      set((state) => ({
        plans: state.plans.map((p) => (p._id === id ? response.data : p)),
        selectedPlan: response.data,
        plansLoading: false,
      }));
    } catch (err: any) {
      set({
        plansError: err.message || 'Failed to update plan',
        plansLoading: false,
      });
      throw err;
    }
  },

  deletePlan: async (id: string) => {
    set({ plansLoading: true, plansError: null });
    try {
      await membershipPlansApi.delete(id);
      set((state) => ({
        plans: state.plans.filter((p) => p._id !== id),
        plansLoading: false,
      }));
    } catch (err: any) {
      set({
        plansError: err.message || 'Failed to delete plan',
        plansLoading: false,
      });
      throw err;
    }
  },

  // ─── Membership Actions ────────────────────────────────────────────

  assignMembership: async (data: AssignMembershipRequest) => {
    set({ membershipsLoading: true, membershipsError: null });
    try {
      const response = await membershipsApi.assign(data);
      set((state) => ({
        memberships: [response.data, ...state.memberships],
        membershipsLoading: false,
      }));
    } catch (err: any) {
      set({
        membershipsError: err.message || 'Failed to assign membership',
        membershipsLoading: false,
      });
      throw err;
    }
  },

  fetchMemberships: async (
    page = 1,
    filters?: { userId?: string; gymId?: string; status?: string }
  ) => {
    set({ membershipsLoading: true, membershipsError: null });
    try {
      const params: Record<string, any> = { page, limit: 10, ...filters };

      const response = await membershipsApi.list(params);

      set({
        memberships:
          page === 1 ? response.data : [...get().memberships, ...response.data],
        membershipsPagination: response.pagination,
        membershipsLoading: false,
      });
    } catch (err: any) {
      set({
        membershipsError: err.message || 'Failed to fetch memberships',
        membershipsLoading: false,
      });
    }
  },

  fetchMyMemberships: async (page = 1) => {
    set({ membershipsLoading: true, membershipsError: null });
    try {
      const response = await membershipsApi.getMyMemberships({ page, limit: 10 });

      set({
        myMemberships:
          page === 1 ? response.data : [...get().myMemberships, ...response.data],
        membershipsPagination: response.pagination,
        membershipsLoading: false,
      });
    } catch (err: any) {
      set({
        membershipsError: err.message || 'Failed to fetch my memberships',
        membershipsLoading: false,
      });
    }
  },

  fetchMembershipById: async (id: string) => {
    set({ membershipsLoading: true, membershipsError: null });
    try {
      const response = await membershipsApi.getById(id);
      set({ selectedMembership: response.data, membershipsLoading: false });
    } catch (err: any) {
      set({
        membershipsError: err.message || 'Failed to fetch membership details',
        membershipsLoading: false,
      });
    }
  },

  cancelMembership: async (id: string) => {
    // Optimistic update
    const prevMemberships = get().memberships;
    const prevMyMemberships = get().myMemberships;
    const prevSelected = get().selectedMembership;

    set((state) => ({
      memberships: state.memberships.map((m) =>
        m._id === id ? { ...m, status: 'cancelled' as const } : m
      ),
      myMemberships: state.myMemberships.map((m) =>
        m._id === id ? { ...m, status: 'cancelled' as const } : m
      ),
      selectedMembership:
        state.selectedMembership?._id === id
          ? { ...state.selectedMembership, status: 'cancelled' as const }
          : state.selectedMembership,
    }));

    try {
      const response = await membershipsApi.cancel(id);
      // Update with actual response
      set((state) => ({
        memberships: state.memberships.map((m) =>
          m._id === id ? response.data : m
        ),
        myMemberships: state.myMemberships.map((m) =>
          m._id === id ? response.data : m
        ),
        selectedMembership:
          state.selectedMembership?._id === id
            ? response.data
            : state.selectedMembership,
      }));
    } catch (err: any) {
      // Rollback on error
      set({
        memberships: prevMemberships,
        myMemberships: prevMyMemberships,
        selectedMembership: prevSelected,
        membershipsError: err.message || 'Failed to cancel membership',
      });
      throw err;
    }
  },

  recordFees: async (id: string, data: RecordFeesRequest) => {
    set({ membershipsLoading: true, membershipsError: null });
    try {
      const response = await membershipsApi.recordFees(id, data);
      set((state) => ({
        memberships: state.memberships.map((m) =>
          m._id === id ? response.data : m
        ),
        selectedMembership:
          state.selectedMembership?._id === id
            ? response.data
            : state.selectedMembership,
        membershipsLoading: false,
      }));
    } catch (err: any) {
      set({
        membershipsError: err.message || 'Failed to record fee payment',
        membershipsLoading: false,
      });
      throw err;
    }
  },

  applyCredit: async (id: string, amount: number) => {
    set({ membershipsLoading: true, membershipsError: null });
    try {
      const response = await membershipsApi.applyCredit(id, amount);
      set((state) => ({
        memberships: state.memberships.map((m) => (m._id === id ? response.data : m)),
        selectedMembership:
          state.selectedMembership?._id === id ? response.data : state.selectedMembership,
        membershipsLoading: false,
      }));
    } catch (err: any) {
      set({ membershipsError: err.message || 'Failed to apply credit', membershipsLoading: false });
      throw err;
    }
  },

  // ─── Utility Actions ───────────────────────────────────────────────

  clearPlansError: () => set({ plansError: null }),
  clearMembershipsError: () => set({ membershipsError: null }),
  clearSelectedPlan: () => set({ selectedPlan: null }),
  clearSelectedMembership: () => set({ selectedMembership: null }),
}));
