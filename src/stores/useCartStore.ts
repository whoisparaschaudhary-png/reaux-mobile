import { create } from 'zustand';
import { cartApi } from '../api/endpoints/cart';
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
  /** Currently selected shipping address for this checkout session */
  selectedAddress: ShippingAddressState | null;

  // Derived
  itemCount: () => number;
  cartTotal: () => number;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  setSelectedAddress: (address: ShippingAddressState | null) => void;
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
      set({ error: err.message || 'Failed to fetch cart', isLoading: false });
    }
  },

  addToCart: async (productId: string, quantity: number = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.addItem({ productId, quantity });
      set({ cart: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to add to cart', isLoading: false });
    }
  },

  removeFromCart: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.removeItem(productId);
      set({ cart: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to remove from cart', isLoading: false });
    }
  },

  setSelectedAddress: (address) => {
    set({ selectedAddress: address });
  },

  clearError: () => set({ error: null }),
}));
