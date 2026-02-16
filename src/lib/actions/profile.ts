"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/database";

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
