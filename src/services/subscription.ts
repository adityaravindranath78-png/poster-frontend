import api from './api';
import {ApiResponse} from '../types/api';
import RazorpayCheckout from 'react-native-razorpay';

interface SubscriptionStatus {
  status: 'free' | 'premium' | 'business';
  expiry: number | null;
}

interface OrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  planName: string;
  keyId: string;
}

export async function getSubscriptionStatus(): Promise<
  ApiResponse<SubscriptionStatus>
> {
  const {data} = await api.get('/subscription/status');
  return data;
}

export async function createOrder(
  planId: string,
): Promise<ApiResponse<OrderResponse>> {
  const {data} = await api.post('/subscription/create-order', {planId});
  return data;
}

export async function openRazorpayCheckout(
  order: OrderResponse,
  userInfo: {name: string; email?: string; phone?: string},
): Promise<{paymentId: string; orderId: string; signature: string}> {
  const options = {
    description: order.planName,
    image: '', // app logo URL
    currency: order.currency,
    key: order.keyId,
    amount: order.amount,
    name: 'Poster',
    order_id: order.orderId,
    prefill: {
      name: userInfo.name,
      contact: userInfo.phone || '',
    },
    theme: {color: '#FF6B35'},
  };

  const result = await RazorpayCheckout.open(options);
  return {
    paymentId: result.razorpay_payment_id,
    orderId: result.razorpay_order_id,
    signature: result.razorpay_signature,
  };
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  planId: string,
): Promise<ApiResponse<SubscriptionStatus>> {
  const {data} = await api.post('/subscription/verify', {
    orderId,
    paymentId,
    signature,
    planId,
  });
  return data;
}
