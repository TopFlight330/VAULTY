"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Tier, PostWithMedia } from "@/types/database";

export async function updateProfile(data: {
  display_name?: string;
  bio?: string;
  category?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const updates: Record<string, string> = {};
  if (data.display_name !== undefined) updates.display_name = data.display_name;
  if (data.bio !== undefined) updates.bio = data.bio;
  if (data.category !== undefined) updates.category = data.category;

  if (Object.keys(updates).length === 0) {
    return { success: false, message: "Nothing to update." };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Profile updated." };
}

export async function updateAvatar(url: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Avatar updated." };
}

export async function updateBanner(url: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ banner_url: url })
    .eq("id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Banner updated." };
}

export async function getMyPageData(): Promise<{
  tiers: Tier[];
  posts: PostWithMedia[];
  postCount: number;
  subCount: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { tiers: [], posts: [], postCount: 0, subCount: 0 };

  const [tiersResult, postsResult, subsResult] = await Promise.all([
    supabase
      .from("tiers")
      .select("*")
      .eq("creator_id", user.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("posts")
      .select("*, media:post_media(*)")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .eq("status", "active"),
  ]);

  const posts = (postsResult.data ?? []) as PostWithMedia[];

  return {
    tiers: (tiersResult.data ?? []) as Tier[],
    posts,
    postCount: posts.length,
    subCount: subsResult.count ?? 0,
  };
}
