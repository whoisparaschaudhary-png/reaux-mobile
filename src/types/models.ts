// SavedAddress (user profile addresses)
export interface SavedAddress {
  _id: string;
  label: string; // e.g. "Home", "Work"
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

// Role types
export type Role = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'disabled';
export type Gender = 'male' | 'female' | 'other';
export type MediaType = 'text' | 'image' | 'video';
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export type DietCategory = 'weight-loss' | 'muscle-gain' | 'bulking' | 'cutting' | 'other';
export type DietType = 'veg' | 'non-veg' | 'both';
// Cycle (steroid protocol) taxonomy
export type CycleCategory = 'bulking' | 'cutting' | 'recomp' | 'pct' | 'other';
export type CycleLevel = 'beginner' | 'intermediate' | 'advanced';
export type CycleType = 'oral' | 'injectable' | 'inj-oral';
export type CycleRiskSeverity = 'low' | 'medium' | 'high';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type ChallengeType = 'steps' | 'workout' | 'diet' | 'custom';
export type WorkoutCategory = 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'yoga' | 'crossfit' | 'other';
export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type NotificationType = 'system' | 'order' | 'challenge' | 'community' | 'diet' | 'announcement';
export type DiscountType = 'percentage' | 'fixed';
export type ProductVisibility = 'all' | 'admin' | 'user';
export type MembershipStatus = 'active' | 'expired' | 'cancelled';
export type ContactStatus = 'open' | 'resolved';

// User
export interface User {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: Role;
  gymId?: string | Gym;
  gymIds?: (string | Gym)[];
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
  instructions?: string;
  slug: string;
  category: DietCategory;
  meals: Meal[];
  image?: string;
  totalCalories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
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

// ---------------------------------------------------------------------------
// Cycles (steroid protocol plans) — an admin-authored content library that
// mirrors the DietPlan shape: a plan has ordered phases, each phase lists the
// compounds/dosages, plus a Post-Cycle-Therapy block and a risks block.
// ---------------------------------------------------------------------------
export interface CycleCompound {
  name: string;         // e.g. "Testosterone Enanthate"
  dosage?: string;      // e.g. "500mg / week"
  frequency?: string;   // e.g. "Pin Mon/Thu" — scheduling note
}

export interface CyclePhase {
  name: string;              // e.g. "Weeks 1-6"
  label?: string;            // e.g. "Kickstart Phase"
  compounds: CycleCompound[];
  note?: string;             // e.g. "Drop Dianabol. Monitor E2 levels."
}

export interface CyclePctItem {
  name: string;         // e.g. "Nolvadex"
  dosage?: string;      // e.g. "40/40/20/20 mg"
  duration?: string;    // e.g. "Daily for 4 weeks"
}

export interface CyclePct {
  startNote?: string;   // e.g. "Start 14-18 days after your last Testosterone injection."
  items: CyclePctItem[];
}

export interface CycleRisk {
  title: string;                  // e.g. "Water Retention"
  description?: string;           // e.g. "High due to Deca and Dbol. Watch sodium intake."
  severity?: CycleRiskSeverity;
}

export interface CyclePlan {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  category: CycleCategory;
  level?: CycleLevel;
  type?: CycleType;
  durationWeeks?: number;
  estimatedGain?: string;    // free text, e.g. "15-20 lbs"
  image?: string;
  phases: CyclePhase[];
  pct?: CyclePct;
  risks: CycleRisk[];
  tags: string[];
  createdBy: string | User;
  isPublished: boolean;
  followers: string[];
  likes: string[];
  likesCount: number;
  followersCount: number;
  createdAt: string;
  updatedAt: string;
  // Runtime properties from API responses
  isLiked?: boolean;    // From like/unlike API
  isFollowed?: boolean; // From follow/unfollow API (backend returns this)
}

// Per-post analytics (admin / author view)
export interface PostAnalytics {
  postId: string;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  engagementRate: number;   // percentage, e.g. 5.2
  engagementDelta?: number; // change over the period, e.g. +1.2
  periodLabel?: string;     // e.g. "Last 7 Days"
  series?: number[];        // engagement values for the trend chart
  seriesLabels?: string[];  // x-axis labels, e.g. ["Mon", ...]
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
  /** Flavour names offered for this product, e.g. ['French Cake', 'Choco Blast'] */
  flavours?: string[];
  stock: number;
  visibility?: ProductVisibility;
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
  flavour?: string | null;
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
  flavour?: string;
}

export type PaymentMethod = 'cod' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  _id: string;
  userId: string | User;
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  promoCode?: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
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

// Contact
export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: ContactStatus;
  userId?: string | User;
  createdAt: string;
  updatedAt?: string;
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
  paidAt?: string; // legacy alias
  date?: string;   // API returns this field
  recordedBy?: string | User;
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
  advanceCredit?: number;
  lastPaymentDate?: string;
  paymentHistory?: FeePayment[];
  assignedBy: string | User;
  createdAt: string;
  updatedAt: string;
}
