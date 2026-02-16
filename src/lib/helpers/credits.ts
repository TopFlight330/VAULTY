"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TransactionType } from "@/types/database";

interface TransferParams {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromType: TransactionType;
  toType: TransactionType;
  description: string;
  relatedId?: string;
}

export async function transferCredits(
  params: TransferParams
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  // Read both balances
  const { data: fromProfile } = await admin
    .from("profiles")
    .select("credit_balance")
    .eq("id", params.fromUserId)
    .single();

  const { data: toProfile } = await admin
    .from("profiles")
    .select("credit_balance")
    .eq("id", params.toUserId)
    .single();

  if (!fromProfile || !toProfile) {
    return { success: false, error: "User not found." };
  }

  if (fromProfile.credit_balance < params.amount) {
    return { success: false, error: "Insufficient credits." };
  }

  const newFromBalance = fromProfile.credit_balance - params.amount;
  const newToBalance = toProfile.credit_balance + params.amount;

  // Update sender balance
  const { error: e1 } = await admin
    .from("profiles")
    .update({ credit_balance: newFromBalance })
    .eq("id", params.fromUserId);

  if (e1) return { success: false, error: "Failed to debit credits." };

  // Update receiver balance
  const { error: e2 } = await admin
    .from("profiles")
    .update({ credit_balance: newToBalance })
    .eq("id", params.toUserId);

  if (e2) {
    // Rollback sender
    await admin
      .from("profiles")
      .update({ credit_balance: fromProfile.credit_balance })
      .eq("id", params.fromUserId);
    return { success: false, error: "Failed to credit receiver." };
  }

  // Insert sender transaction (negative)
  await admin.from("transactions").insert({
    user_id: params.fromUserId,
    type: params.fromType,
    amount: -params.amount,
    balance_after: newFromBalance,
    description: params.description,
    related_id: params.relatedId ?? null,
  });

  // Insert receiver transaction (positive)
  await admin.from("transactions").insert({
    user_id: params.toUserId,
    type: params.toType,
    amount: params.amount,
    balance_after: newToBalance,
    description: params.description,
    related_id: params.relatedId ?? null,
  });

  return { success: true };
}
