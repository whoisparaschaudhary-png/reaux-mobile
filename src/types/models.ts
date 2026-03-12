// Role types
export type Role = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'disabled';
export type Gender = 'male' | 'female' | 'other';
export type MediaType = 'text' | 'image' | 'video';
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export type DietCategory = 'weight-loss' | 'muscle-gain' | 'bulking' | 'cutting' | 'other';
export type DietType = 'veg' | 'non-veg' | 'both';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type ChallengeType = 'steps' | 'workout' | 'diet' | 'custom';
export type WorkoutCategory = 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'yoga' | 'crossfit' | 'other';
export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type NotificationType = 'system' | 'order' | 'challenge' | 'community' | 'diet';
export type DiscountType = 'percentage' | 'fixed';
export type MembershipStatus = 'active' | 'expired' | 'cancelled';

// User
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  gymId?: string | Gym;
  avatar?: string;
  height?: number;
  weight?: number;
  dateOfBirth?: string;
  gender?: Gender;
  dateOfJoining?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// Birthday
export interface BirthdayUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  dateOfBirth: string;
  gymId?: { name: string; slug?: string };
}

export interface UpcomingBirthdayUser extends BirthdayUser {
  daysUntil: number;
}

// Gym
export interface Gym {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: { lat: number; lng: number };
  };
  phone?: string;
  email?: string;
  images: string[];
  logo?: string;
  amenities: string[];
  openingHours?: Record<string, { open: string; close: string }>;
  isActive: boolean;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

// BMI Record
export interface BmiRecord {
  _id: string;
  userId: string;
  height: number;
  weight: number;
  bmi: number;
  bmr?: number;
  age?: number;
  gender?: Gender;
  category: BmiCategory;
  message?: string;
  createdAt: string;
}

// Diet Plan with nested types
export interface MealItem {
  name: string;
  quantity?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Meal {
  name: string;
  time?: string;
  items: MealItem[];
}

export interface DietPlan {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  category: DietCategory;
  meals: Meal[];
  image?: string;
  totalCalories?: number;
  createdBy: string | User;
  isPublished: boolean;
  followers: string[];
  likes: string[];
  tags: string[];
  dietType?: DietType;
  likesCount: number;
  followersCount: number;
  createdAt: string;
  updatedAt: string;
  // Runtime properties from API responses
  isLiked?: boolean;  // From like/unlike API
  isFollowed?: boolean;  // From follow/unfollow API (backend returns this)
}

// Post
export interface Post {
  _id: string;
  author: string | User;
  content?: string;
  mediaType: MediaType;
  mediaUrl?: string;
  isLiked?: boolean;
  likesCount: number;
  commentsCount: number;
  hashtags: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

// Comment
export interface Comment {
  _id: string;
  postId: string;
  author: string | User;
  content: string;
  createdAt: string;
}

// Reel
export interface Reel {
  _id: string;
  author: string | User;
  videoUrl: string;
  caption?: string;
  linkedProduct?: string | Product;
  isLiked?: boolean;
  likesCount: number;
  commentsCount?: number;
  createdAt: string;
}

export interface ReelComment {
  _id: string;
  reelId: string;
  author: string | User;
  content: string;
  createdAt: string;
}

// Product
export interface NutritionInfo {
  servingSize?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category?: string;
  stock: number;
  nutrition?: NutritionInfo;
  isActive: boolean;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

// Cart
export interface CartItem {
  product: string | Product;
  quantity: number;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// Order
export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
}

export interface OrderItem {
  product: string | Product;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  userId: string | User;
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  promoCode?: string;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
}

// Promo Code
export interface PromoCode {
  _id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  createdBy: string | User;
  createdAt: string;
}

// Challenge
export interface ChallengeParticipant {
  userId: string | User;
  progress: number;
  joinedAt: string;
}

export interface Challenge {
  _id: string;
  title: string;
  description?: string;
  type: ChallengeType;
  target: number;
  startDate: string;
  endDate: string;
  participants: ChallengeParticipant[];
  createdBy: string | User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notification
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message?: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Analytics
export interface PlatformStats {
  totalUsers: number;
  totalPosts: number;
  totalOrders: number;
  totalProducts: number;
  totalChallenges: number;
}

export interface SalesReport {
  totalRevenue: number;
  monthlyBreakdown: Array<{ month: string; revenue: number; orders: number }>;
  topProducts: Array<{ product: Product; totalSold: number; revenue: number }>;
}

// Workout
export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
}

export interface Workout {
  _id: string;
  title: string;
  description?: string;
  category: WorkoutCategory;
  difficulty: WorkoutDifficulty;
  duration: number;
  caloriesBurn?: number;
  image?: string;
  tags: string[];
  exercises: Exercise[];
  createdBy: string | User;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Membership Plan
export interface MembershipPlan {
  _id: string;
  name: string;
  gymId: string | Gym;
  durationDays: number; // 30, 90, 180, 365
  price: number;
  features?: string[];
  description?: string;
  isActive: boolean;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

// Membership Fee Payment
export interface FeePayment {
  amount: number;
  note?: string;
  paidAt: string;
  recordedBy: string | User;
}

// Membership
export interface Membership {
  _id: string;
  userId: string | User;
  planId: string | MembershipPlan;
  gymId: string | Gym;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  feesAmount?: number;
  feesPaid?: number;
  feesDue?: number;
  credit?: number;
  lastPaymentDate?: string;
  paymentHistory?: FeePayment[];
  assignedBy: string | User;
  createdAt: string;
  updatedAt: string;
}
