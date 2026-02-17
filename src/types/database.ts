/* ══════════════════════════════════════════════
   Database types matching Supabase tables
   ══════════════════════════════════════════════ */

export type Role = "user" | "creator" | "admin";
export type Visibility = "free" | "premium" | "ppv";
export type SubscriptionStatus = "active" | "cancelled" | "expired";
export type MediaType = "image" | "video";

export type TransactionType =
  | "credit_purchase"
  | "subscription_payment"
  | "subscription_earning"
  | "tip_sent"
  | "tip_received"
  | "ppv_payment"
  | "ppv_earning";

export type NotificationType =
  | "new_subscriber"
  | "tip_received"
  | "new_like"
  | "ppv_purchase"
  | "subscription_expired"
  | "system";

/* ── Table types ── */

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  role: Role;
  category: string;
  social_reach: string | null;
  credit_balance: number;
  subscription_price: number | null;
  is_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tier {
  id: string;
  creator_id: string;
  name: string;
  price: number;
  description: string;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  creator_id: string;
  title: string;
  body: string;
  visibility: Visibility;
  ppv_price: number | null;
  like_count: number;
  view_count: number;
  comment_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostMedia {
  id: string;
  post_id: string;
  storage_path: string;
  media_type: MediaType;
  sort_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  creator_id: string;
  tier_id: string;
  status: SubscriptionStatus;
  started_at: string;
  current_period_end: string;
  created_at: string;
}

export interface PpvPurchase {
  id: string;
  buyer_id: string;
  post_id: string;
  price_paid: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  related_id: string | null;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  body: string;
  created_at: string;
}

export interface CommentWithProfile extends Comment {
  profile: Profile;
}

export interface Bookmark {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface AchievementBadge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  description: string;
}

/* ── Joined / computed types ── */

export interface PostWithMedia extends Post {
  media: PostMedia[];
}

export type AccessLevel = "full" | "blur";

export interface PostWithAccess extends Post {
  media: PostMedia[];
  access_level: AccessLevel;
}

export interface PostWithInteractions extends PostWithAccess {
  is_liked: boolean;
  is_bookmarked: boolean;
}

export interface SubscriptionWithCreator extends Subscription {
  creator: Profile;
  tier: Tier;
}

export interface SubscriptionWithProfile extends Subscription {
  subscriber: Profile;
  tier: Tier;
}

export interface CreatorStats {
  total_earnings: number;
  active_subscribers: number;
  post_count: number;
  tip_total: number;
  earnings_this_month: number;
  subscribers_this_week: number;
}

export interface AdminStats {
  total_users: number;
  total_creators: number;
  total_subscribers: number;
  total_credits_in_circulation: number;
  signups_this_week: number;
  signups_this_month: number;
}

export interface CreditPackage {
  id: string;
  amount: number;
  price: string;
  per_credit: string;
  popular: boolean;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

/* ── Constants ── */

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "pkg_50", amount: 50, price: "$4.99", per_credit: "$0.10", popular: false },
  { id: "pkg_100", amount: 100, price: "$8.99", per_credit: "$0.09", popular: false },
  { id: "pkg_250", amount: 250, price: "$19.99", per_credit: "$0.08", popular: true },
  { id: "pkg_500", amount: 500, price: "$34.99", per_credit: "$0.07", popular: false },
];
