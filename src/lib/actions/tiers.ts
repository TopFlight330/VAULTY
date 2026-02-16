"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/database";

export async function createTier(data: {
  name: string;
  price: number;
  description: string;
  is_featured?: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  if (!data.name.trim()) return { success: false, message: "Tier name is required." };
  if (data.price <= 0) return { success: false, message: "Price must be greater than 0." };

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("tiers")
    .select("sort_order")
    .eq("creator_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await supabase.from("tiers").insert({
    creator_id: user.id,
    name: data.name.trim(),
    price: data.price,
    description: data.description.trim(),
    is_featured: data.is_featured ?? false,
    sort_order: nextOrder,
  });

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Tier created." };
}

export async function updateTier(
  tierId: string,
  data: {
    name?: string;
    price?: number;
    description?: string;
    is_featured?: boolean;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.price !== undefined) updates.price = data.price;
  if (data.description !== undefined) updates.description = data.description.trim();
  if (data.is_featured !== undefined) updates.is_featured = data.is_featured;

  const { error } = await supabase
    .from("tiers")
    .update(updates)
    .eq("id", tierId)
    .eq("creator_id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Tier updated." };
}

export async function deleteTier(tierId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  // Check for active subscriptions
  const { count } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("tier_id", tierId)
    .eq("status", "active");

  if (count && count > 0) {
    return {
      success: false,
      message: "Cannot delete a tier with active subscribers. Deactivate it instead.",
    };
  }

  // Soft delete - mark as inactive
  const { error } = await supabase
    .from("tiers")
    .update({ is_active: false })
    .eq("id", tierId)
    .eq("creator_id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Tier deleted." };
}
