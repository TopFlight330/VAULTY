"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  CreatorStats,
  Notification,
  Transaction,
  SubscriptionWithProfile,
} from "@/types/database";

export async function getDashboardStats(): Promise<{
  stats: CreatorStats;
  notifications: Notification[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      stats: {
        total_earnings: 0,
        active_subscribers: 0,
        post_count: 0,
        tip_total: 0,
        earnings_this_month: 0,
        subscribers_this_week: 0,
      },
      notifications: [],
    };

  const userId = user.id;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [subsResult, postResult, txResult, weekSubsResult, notifsResult] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", userId)
        .eq("status", "active"),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", userId),
      supabase
        .from("transactions")
        .select("amount, type, created_at")
        .eq("user_id", userId)
        .in("type", ["subscription_earning", "tip_received", "ppv_earning"]),
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", userId)
        .gte("created_at", weekAgo),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const allEarnings = txResult.data ?? [];
  const totalEarnings = allEarnings.reduce((sum, tx) => sum + tx.amount, 0);
  const tipTotal = allEarnings
    .filter((tx) => tx.type === "tip_received")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();
  const earningsThisMonth = allEarnings
    .filter((tx) => tx.created_at >= monthStart)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    stats: {
      total_earnings: totalEarnings,
      active_subscribers: subsResult.count ?? 0,
      post_count: postResult.count ?? 0,
      tip_total: tipTotal,
      earnings_this_month: earningsThisMonth,
      subscribers_this_week: weekSubsResult.count ?? 0,
    },
    notifications: (notifsResult.data ?? []) as Notification[],
  };
}

export async function getEarningsData(): Promise<{
  transactions: Transaction[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { transactions: [] };

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .in("type", ["subscription_earning", "tip_received", "ppv_earning"])
    .order("created_at", { ascending: false });

  return { transactions: (data ?? []) as Transaction[] };
}

export async function getSubscribersData(): Promise<{
  subscribers: SubscriptionWithProfile[];
  total: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { subscribers: [], total: 0 };

  const { data, count } = await supabase
    .from("subscriptions")
    .select(
      "*, subscriber:profiles!subscriptions_subscriber_id_fkey(*), tier:tiers(*)",
      { count: "exact" }
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  return {
    subscribers: (data as SubscriptionWithProfile[]) ?? [],
    total: count ?? 0,
  };
}
