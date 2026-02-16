import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  return data;
}

export async function searchCreators(
  query: string,
  limit = 20
): Promise<Profile[]> {
  const supabase = await createClient();
  const cleaned = query.trim().toLowerCase().replace("@", "");
  if (!cleaned) return [];

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "creator")
    .eq("is_banned", false)
    .or(`username.ilike.%${cleaned}%,display_name.ilike.%${cleaned}%`)
    .limit(limit);

  return data ?? [];
}
