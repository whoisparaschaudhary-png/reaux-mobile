import client from '../client';
import type { ApiResponse } from '../types';
import type { Cart } from '../../types/models';
import type { AddToCartRequest } from '../../types/api';

export const cartApi = {
  get: () =>
    client.get<ApiResponse<Cart>>('/cart').then(r => r.data),

  addItem: (data: AddToCartRequest) =>
    client.post<ApiResponse<Cart>>('/cart/add', data).then(r => r.data),

  updateItem: (productId: string, quantity: number, flavour?: string | null) =>
    client
      .patch<ApiResponse<Cart>>(`/cart/item/${productId}`, {
        quantity,
        ...(flavour ? { flavour } : {}),
      })
      .then(r => r.data),

  removeItem: (productId: string, flavour?: string | null) =>
    client
      .delete<ApiResponse<Cart>>(`/cart/item/${productId}`, {
        params: flavour ? { flavour } : undefined,
      })
      .then(r => r.data),
};
