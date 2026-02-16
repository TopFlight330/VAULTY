"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transferCredits } from "@/lib/helpers/credits";
import type { ActionResult } from "@/types/database";

export async function subscribe(
  creatorId: string,
  tierId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  if (user.id === creatorId) {
    return { success: false, message: "You cannot subscribe to yourself." };
  }

  // Check if already subscribed
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("subscriber_id", user.id)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .limit(1)
    .single();

  if (existing) {
    return { success: false, message: "You are already subscribed." };
  }

  // Get tier info
  const { data: tier } = await supabase
    .from("tiers")
    .select("*")
    .eq("id", tierId)
    .single();

  if (!tier) return { success: false, message: "Tier not found." };

  // Transfer credits
  const transfer = await transferCredits({
    fromUserId: user.id,
    toUserId: creatorId,
    amount: tier.price,
    fromType: "subscription_payment",
    toType: "subscription_earning",
    description: `Subscription to ${tier.name}`,
    relatedId: tierId,
  });

  if (!transfer.success) {
    return { success: false, message: transfer.error ?? "Payment failed." };
  }

  // Create subscription
  const admin = createAdminClient();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { error } = await admin.from("subscriptions").insert({
    subscriber_id: user.id,
    creator_id: creatorId,
    tier_id: tierId,
    status: "active",
    current_period_end: periodEnd.toISOString(),
  });

  if (error) return { success: false, message: error.message };

  // Create notification for creator
  const { data: subscriberProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  await admin.from("notifications").insert({
    user_id: creatorId,
    type: "new_subscriber",
    title: "New subscriber!",
    body: `${subscriberProfile?.display_name ?? "Someone"} subscribed to your ${tier.name} tier.`,
    related_id: user.id,
  });

  return { success: true, message: "Subscribed successfully!" };
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscriptionId)
    .eq("subscriber_id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Subscription cancelled." };
}
