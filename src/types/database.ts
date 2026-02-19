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
  | "ppv_earning"
  | "chat_tip_sent"
  | "chat_tip_received"
  | "message_ppv_payment"
  | "message_ppv_earning"
  | "message_purchase";

export type NotificationType =
  | "new_subscriber"
  | "tip_received"
  | "new_like"
  | "ppv_purchase"
  | "subscription_expired"
  | "system"
  | "new_message"
  | "message_tip"
  | "message_ppv_purchase";

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
  is_deactivated: boolean;
  deactivation_reason: string | null;
  setting_watermark: boolean;
  setting_2fa: boolean;
  setting_notif_subs: boolean;
  setting_notif_tips: boolean;
  setting_notif_payouts: boolean;
  setting_marketing: boolean;
  online_status: "available" | "invisible";
  purchased_messages: number;
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
  is_pinned: boolean;
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

/* ── Chat / Messaging types ── */

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  last_message_preview: string;
  is_pinned_by_1: boolean;
  is_pinned_by_2: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  media_url: string | null;
  media_type: string | null;
  is_ppv: boolean;
  ppv_price: number | null;
  is_ppv_unlocked: boolean;
  is_tip: boolean;
  tip_amount: number | null;
  is_pinned: boolean;
  is_read: boolean;
  created_at: string;
}

export interface ConversationWithProfile extends Conversation {
  other_user: Profile;
  unread_count: number;
}

export interface MessageWithSender extends Message {
  sender: Profile;
}

export interface MessagePpvPurchase {
  id: string;
  message_id: string;
  buyer_id: string;
  price_paid: number;
  created_at: string;
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
