import client from '../client';
import type { ApiResponse } from '../types';
import type { Order } from '../../types/models';

export interface RazorpayOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  /** Amount in paise, as Razorpay expects it */
  amount: number;
  currency: string;
  /** Publishable key id — the secret stays on the server */
  keyId: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}

export const paymentsApi = {
  createRazorpayOrder: (orderId: string) =>
    client
      .post<ApiResponse<RazorpayOrderResponse>>('/payments/razorpay/order', { orderId })
      .then(r => r.data),

  verify: (data: VerifyPaymentRequest) =>
    client.post<ApiResponse<Order>>('/payments/razorpay/verify', data).then(r => r.data),

  markFailed: (orderId: string) =>
    client.post<ApiResponse<Order>>('/payments/razorpay/failed', { orderId }).then(r => r.data),
};
