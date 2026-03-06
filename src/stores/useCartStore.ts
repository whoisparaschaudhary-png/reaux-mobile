import { create } from 'zustand';
import { cartApi } from '../api/endpoints/cart';
import { getItem, setItem, removeItem } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import type { Cart, Product } from '../types/models';

export interface ShippingAddressState {
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  /** Saved shipping address used for checkout (set when user saves on Add Address screen) */
  selectedAddress: ShippingAddressState | null;

  // Derived
  itemCount: () => number;
  cartTotal: () => number;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  setSelectedAddress: (address: ShippingAddressState | null) => void;
  loadSavedAddress: () => Promise<void>;
  clearError: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,
  selectedAddress: null,

  itemCount: () => {
    const cart = get().cart;
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  cartTotal: () => {
    const cart = get().cart;
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => {
      const product = item.product as Product;
      if (product && typeof product === 'object' && product.price) {
        return sum + product.price * item.quantity;
      }
      return sum;
    }, 0);
  },

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.get();
      set({ cart: response.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch cart',
        isLoading: false,
      });
    }
  },

  addToCart: async (productId: string, quantity: number = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.addItem({ productId, quantity });
      set({ cart: response.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to add to cart',
        isLoading: false,
      });
    }
  },

  removeFromCart: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.removeItem(productId);
      set({ cart: response.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to remove from cart',
        isLoading: false,
      });
    }
  },

  setSelectedAddress: (address) => {
    set({ selectedAddress: address });
    if (address) {
      setItem(STORAGE_KEYS.SHIPPING_ADDRESS, JSON.stringify(address)).catch(() => {});
    } else {
      removeItem(STORAGE_KEYS.SHIPPING_ADDRESS).catch(() => {});
    }
  },

  /** Load saved shipping address from storage (e.g. on app/cart mount) */
  loadSavedAddress: async () => {
    const json = await getItem(STORAGE_KEYS.SHIPPING_ADDRESS);
    if (json) {
      try {
        const parsed = JSON.parse(json) as ShippingAddressState;
        if (parsed && typeof parsed.street === 'string' && typeof parsed.city === 'string') {
          set({ selectedAddress: parsed });
        }
      } catch {}
    }
  },

  clearError: () => set({ error: null }),
}));
