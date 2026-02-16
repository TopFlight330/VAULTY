import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreatorStats, AdminStats } from "@/types/database";

export async function getCreatorStats(creatorId: string): Promise<CreatorStats> {
  const supabase = await createClient();

  // Active subscribers count
  const { count: activeSubs } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .eq("status", "active");

  // Post count
  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId);

  // Total earnings (subscription_earning + tip_received + ppv_earning)
  const { data: earningTx } = await supabase
    .from("transactions")
    .select("amount, type, created_at")
    .eq("user_id", creatorId)
    .in("type", ["subscription_earning", "tip_received", "ppv_earning"]);

  const allEarnings = earningTx ?? [];
  const totalEarnings = allEarnings.reduce((sum, tx) => sum + tx.amount, 0);

  const tipTotal = allEarnings
    .filter((tx) => tx.type === "tip_received")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Earnings this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const earningsThisMonth = allEarnings
    .filter((tx) => tx.created_at >= monthStart)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Subscribers this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: subsThisWeek } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .gte("created_at", weekAgo);

  return {
    total_earnings: totalEarnings,
    active_subscribers: activeSubs ?? 0,
    post_count: postCount ?? 0,
    tip_total: tipTotal,
    earnings_this_month: earningsThisMonth,
    subscribers_this_week: subsThisWeek ?? 0,
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient();

  const { count: totalUsers } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: totalCreators } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "creator");

  const { count: totalSubs } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "user");

  // Total credits in circulation
  const { data: balances } = await admin
    .from("profiles")
    .select("credit_balance");
  const totalCredits = (balances ?? []).reduce(
    (sum, p) => sum + (p.credit_balance ?? 0),
    0
  );

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { count: signupsWeek } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo);

  const { count: signupsMonth } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthAgo);

  return {
    total_users: totalUsers ?? 0,
    total_creators: totalCreators ?? 0,
    total_subscribers: totalSubs ?? 0,
    total_credits_in_circulation: totalCredits,
    signups_this_week: signupsWeek ?? 0,
    signups_this_month: signupsMonth ?? 0,
  };
}
