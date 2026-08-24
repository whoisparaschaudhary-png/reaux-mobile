import { create } from 'zustand';
import { productsApi } from '../api/endpoints/products';
import type { Product } from '../types/models';

interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  pagination: ProductPagination;
  searchQuery: string;
  category: string;

  fetchProducts: (
    page?: number,
    search?: string,
    category?: string,
    options?: { manage?: boolean },
  ) => Promise<void>;
  getProductById: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setCategory: (category: string) => void;
  clearError: () => void;
  clearSelectedProduct: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  searchQuery: '',
  category: '',

  fetchProducts: async (page = 1, search?: string, category?: string, options?) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, any> = { page, limit: 10 };
      const searchQuery = search ?? get().searchQuery;
      const cat = category ?? get().category;

      if (searchQuery) params.search = searchQuery;
      if (cat && cat !== 'All') params.category = cat;
      // Admin catalogue only: hidden and members-only products must stay listed
      // so they can be edited or switched back on.
      if (options?.manage) params.manage = true;

      const response = await productsApi.list(params);

      set({
        products: page === 1 ? (response.data ?? []) : [...get().products, ...(response.data ?? [])],
        pagination: response.pagination,
        isLoading: false,
        searchQuery: searchQuery,
        category: cat,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch products',
        isLoading: false,
      });
    }
  },

  getProductById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productsApi.getById(id);
      set({ selectedProduct: response.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch product',
        isLoading: false,
      });
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setCategory: (category: string) => set({ category }),
  clearError: () => set({ error: null }),
  clearSelectedProduct: () => set({ selectedProduct: null }),
}));
