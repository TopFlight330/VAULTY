"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, AdminStats, Profile } from "@/types/database";

async function requireAdmin(): Promise<{ userId: string } | ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, message: "Unauthorized." };
  }

  return { userId: user.id };
}

export async function banUser(
  userId: string,
  reason: string
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if ("success" in auth) return auth;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_banned: true, ban_reason: reason })
    .eq("id", userId);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "User banned." };
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if ("success" in auth) return auth;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_banned: false, ban_reason: null })
    .eq("id", userId);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "User unbanned." };
}

export async function getAllUsers(
  page = 1,
  limit = 20,
  search?: string,
  roleFilter?: string
): Promise<{ users: Profile[]; total: number }> {
  const auth = await requireAdmin();
  if ("success" in auth) return { users: [], total: 0 };

  const admin = createAdminClient();
  const from = (page - 1) * limit;

  let query = admin
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (roleFilter && roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }

  if (search) {
    query = query.or(
      `username.ilike.%${search}%,display_name.ilike.%${search}%`
    );
  }

  const { data, count } = await query.range(from, from + limit - 1);
  return { users: data ?? [], total: count ?? 0 };
}

export async function fetchAdminStats(): Promise<AdminStats | null> {
  const auth = await requireAdmin();
  if ("success" in auth) return null;

  const admin = createAdminClient();

  const [usersResult, creatorsResult, membersResult, balancesResult, weekResult, monthResult] =
    await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "creator"),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
      admin.from("profiles").select("credit_balance"),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

  const totalCredits = (balancesResult.data ?? []).reduce(
    (sum, p) => sum + (p.credit_balance ?? 0),
    0
  );

  return {
    total_users: usersResult.count ?? 0,
    total_creators: creatorsResult.count ?? 0,
    total_subscribers: membersResult.count ?? 0,
    total_credits_in_circulation: totalCredits,
    signups_this_week: weekResult.count ?? 0,
    signups_this_month: monthResult.count ?? 0,
  };
}
