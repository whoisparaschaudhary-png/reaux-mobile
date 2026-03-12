import type { Gender, DietCategory, DietType, DiscountType, ChallengeType } from './models';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  gymId?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  height?: number;
  weight?: number;
  dateOfBirth?: string;
  gender?: Gender;
}

export interface RecordBmiRequest {
  height: number;
  weight: number;
}

export interface CreatePostRequest {
  content?: string;
  mediaType?: string;
  mediaUrl?: string;
  hashtags?: string[];
  category?: string;
}

export interface CreateDietRequest {
  title: string;
  category: DietCategory;
  dietType?: DietType;
  description?: string;
  meals?: any[];
  image?: string;
  totalCalories?: number;
  tags?: string[];
  isPublished?: boolean;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  description?: string;
  compareAtPrice?: number;
  images?: string[];
  category?: string;
  stock?: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity?: number;
}

export interface CreateOrderRequest {
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  promoCode?: string;
}

export interface CreatePromoRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom?: string;
  validUntil?: string;
}

export interface CreateChallengeRequest {
  title: string;
  type: ChallengeType;
  target: number;
  startDate: string;
  endDate: string;
  description?: string;
}
