import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/types/database";

export async function getUserTransactions(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ transactions: Transaction[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * limit;

  const { data, count } = await supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  return { transactions: data ?? [], total: count ?? 0 };
}
