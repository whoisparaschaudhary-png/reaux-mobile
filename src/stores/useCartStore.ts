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
  addToCart: (productId: string, quantity?: number, flavour?: string | null) => Promise<void>;
  removeFromCart: (productId: string, flavour?: string | null) => Promise<void>;
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

  addToCart: async (productId: string, quantity: number = 1, flavour?: string | null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.addItem({
        productId,
        quantity,
        ...(flavour ? { flavour } : {}),
      });
      set({ cart: response.data, isLoading: false });
    } catch (err: any) {
      const message = err.message || 'Failed to add to cart';
      set({ error: message, isLoading: false });
      // Rethrow so callers can avoid navigating to an empty cart / show a toast.
      throw new Error(message);
    }
  },

  removeFromCart: async (productId: string, flavour?: string | null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.removeItem(productId, flavour);
      set({ cart: response.data, isLoading: false });
    } catch (err: any) {
      const message = err.message || 'Failed to remove from cart';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  setSelectedAddress: (address) => {
    set({ selectedAddress: address });
  },

  clearError: () => set({ error: null }),
}));
