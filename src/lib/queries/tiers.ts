import { createClient } from "@/lib/supabase/server";
import type { Tier } from "@/types/database";

export async function getCreatorTiers(creatorId: string): Promise<Tier[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tiers")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getTierById(tierId: string): Promise<Tier | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tiers")
    .select("*")
    .eq("id", tierId)
    .single();
  return data;
}
