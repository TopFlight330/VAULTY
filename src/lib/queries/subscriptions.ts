import { createClient } from "@/lib/supabase/server";
import type {
  Subscription,
  SubscriptionWithCreator,
  SubscriptionWithProfile,
} from "@/types/database";

export async function getActiveSubscription(
  subscriberId: string,
  creatorId: string
): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("subscriber_id", subscriberId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .gte("current_period_end", new Date().toISOString())
    .limit(1)
    .single();
  return data;
}

export async function getUserSubscriptions(
  userId: string
): Promise<SubscriptionWithCreator[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*, creator:profiles!subscriptions_creator_id_fkey(*), tier:tiers(*)")
    .eq("subscriber_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return (data as SubscriptionWithCreator[]) ?? [];
}

export async function getCreatorSubscribers(
  creatorId: string,
  page = 1,
  limit = 20,
  search?: string
): Promise<{ subscribers: SubscriptionWithProfile[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * limit;

  let query = supabase
    .from("subscriptions")
    .select("*, subscriber:profiles!subscriptions_subscriber_id_fkey(*), tier:tiers(*)", { count: "exact" })
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (search) {
    // We'll filter client-side since we can't filter on joined table directly in a simple way
  }

  const { data, count } = await query.range(from, from + limit - 1);

  let results = (data as SubscriptionWithProfile[]) ?? [];

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (s) =>
        s.subscriber.display_name.toLowerCase().includes(q) ||
        s.subscriber.username.toLowerCase().includes(q)
    );
  }

  return { subscribers: results, total: count ?? 0 };
}
