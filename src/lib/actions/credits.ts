"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transferCredits } from "@/lib/helpers/credits";
import { CREDIT_PACKAGES } from "@/types/database";
import type { ActionResult } from "@/types/database";

export async function purchaseCredits(
  packageId: string
): Promise<{ success: boolean; message: string; newBalance?: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return { success: false, message: "Invalid package." };

  const admin = createAdminClient();

  // Get current balance
  const { data: profile } = await admin
    .from("profiles")
    .select("credit_balance")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, message: "Profile not found." };

  const newBalance = profile.credit_balance + pkg.amount;

  // Update balance
  const { error: updateErr } = await admin
    .from("profiles")
    .update({ credit_balance: newBalance })
    .eq("id", user.id);

  if (updateErr) return { success: false, message: "Failed to add credits." };

  // Insert transaction
  await admin.from("transactions").insert({
    user_id: user.id,
    type: "credit_purchase",
    amount: pkg.amount,
    balance_after: newBalance,
    description: `Purchased ${pkg.amount} credits for ${pkg.price}`,
  });

  return {
    success: true,
    message: `Purchased ${pkg.amount} credits!`,
    newBalance,
  };
}

export async function sendTip(
  creatorId: string,
  amount: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  if (amount <= 0) return { success: false, message: "Amount must be positive." };
  if (user.id === creatorId) return { success: false, message: "Cannot tip yourself." };

  const transfer = await transferCredits({
    fromUserId: user.id,
    toUserId: creatorId,
    amount,
    fromType: "tip_sent",
    toType: "tip_received",
    description: `Tip of ${amount} credits`,
  });

  if (!transfer.success) {
    return { success: false, message: transfer.error ?? "Tip failed." };
  }

  // Create notification
  const admin = createAdminClient();
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  await admin.from("notifications").insert({
    user_id: creatorId,
    type: "tip_received",
    title: "Tip received!",
    body: `${senderProfile?.display_name ?? "Someone"} sent you a ${amount} credit tip.`,
    related_id: user.id,
  });

  return { success: true, message: `Tip of ${amount} credits sent!` };
}

export async function purchasePPV(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  // Get post info
  const { data: post } = await supabase
    .from("posts")
    .select("creator_id, ppv_price, visibility")
    .eq("id", postId)
    .single();

  if (!post) return { success: false, message: "Post not found." };
  if (post.visibility !== "ppv" || !post.ppv_price) {
    return { success: false, message: "This post is not pay-per-view." };
  }

  // Check if already purchased
  const { data: existing } = await supabase
    .from("ppv_purchases")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("post_id", postId)
    .single();

  if (existing) return { success: false, message: "Already purchased." };

  // Transfer credits
  const transfer = await transferCredits({
    fromUserId: user.id,
    toUserId: post.creator_id,
    amount: post.ppv_price,
    fromType: "ppv_payment",
    toType: "ppv_earning",
    description: "PPV content unlock",
    relatedId: postId,
  });

  if (!transfer.success) {
    return { success: false, message: transfer.error ?? "Payment failed." };
  }

  // Record purchase
  const admin = createAdminClient();
  await admin.from("ppv_purchases").insert({
    buyer_id: user.id,
    post_id: postId,
    price_paid: post.ppv_price,
  });

  // Notification
  const { data: buyerProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  await admin.from("notifications").insert({
    user_id: post.creator_id,
    type: "ppv_purchase",
    title: "PPV content purchased!",
    body: `${buyerProfile?.display_name ?? "Someone"} unlocked your PPV content.`,
    related_id: postId,
  });

  return { success: true, message: "Content unlocked!" };
}
