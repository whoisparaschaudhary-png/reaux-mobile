import type { Gender, DietCategory, DietType, DiscountType, ChallengeType, ProductVisibility, PaymentMethod, CycleCategory, CycleLevel, CycleType, CyclePhase, CyclePct, CycleRisk } from './models';

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
  age?: number;
  gender?: Gender;
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
  instructions?: string;
  meals?: any[];
  image?: string;
  totalCalories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  tags?: string[];
  isPublished?: boolean;
}

export interface CreateCandidateRequest {
  name: string;
  phone: string;
  monthlyFees?: number;
  startDate?: string;   // ISO date the membership starts
  avatar?: string;
}

export interface CreateCycleRequest {
  title: string;
  category: CycleCategory;
  level?: CycleLevel;
  type?: CycleType;
  description?: string;
  durationWeeks?: number;
  estimatedGain?: string;
  image?: string;
  phases?: CyclePhase[];
  pct?: CyclePct;
  risks?: CycleRisk[];
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
  flavours?: string[];
  stock?: number;
  visibility?: ProductVisibility;
  isActive?: boolean;
  nutrition?: {
    servingSize?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
  };
}

export interface AddToCartRequest {
  productId: string;
  quantity?: number;
  flavour?: string;
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
  paymentMethod?: PaymentMethod;
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
  isActive?: boolean;
}

export interface CreateChallengeRequest {
  title: string;
  type: ChallengeType;
  target: number;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface UpdateChallengeRequest extends Partial<CreateChallengeRequest> {
  /** Setting this false retires the challenge — the list only returns active ones. */
  isActive?: boolean;
}
