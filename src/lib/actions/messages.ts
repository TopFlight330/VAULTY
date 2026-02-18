"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transferCredits } from "@/lib/helpers/credits";
import type {
  ActionResult,
  ConversationWithProfile,
  Message,
  Profile,
} from "@/types/database";

/* ═══════════════════════════════════════════════
   CONVERSATIONS
   ═══════════════════════════════════════════════ */

export async function getConversations(): Promise<ConversationWithProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();

  // Get all conversations where user is a participant
  const { data: convs } = await admin
    .from("conversations")
    .select("*")
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (!convs || convs.length === 0) return [];

  // Collect other user IDs
  const otherIds = convs.map((c) =>
    c.participant_1 === user.id ? c.participant_2 : c.participant_1
  );

  // Fetch profiles
  const { data: profiles } = await admin
    .from("profiles")
    .select("*")
    .in("id", otherIds);

  const profileMap = new Map<string, Profile>();
  (profiles ?? []).forEach((p) => profileMap.set(p.id, p));

  // Count unread messages per conversation
  const results: ConversationWithProfile[] = [];
  for (const conv of convs) {
    const otherId =
      conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

    const { count } = await admin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conv.id)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    results.push({
      ...conv,
      other_user: profileMap.get(otherId) as Profile,
      unread_count: count ?? 0,
    });
  }

  // Sort: pinned first, then by last_message_at
  results.sort((a, b) => {
    const aPinned =
      a.participant_1 === user.id ? a.is_pinned_by_1 : a.is_pinned_by_2;
    const bPinned =
      b.participant_1 === user.id ? b.is_pinned_by_1 : b.is_pinned_by_2;
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return (
      new Date(b.last_message_at).getTime() -
      new Date(a.last_message_at).getTime()
    );
  });

  return results;
}

export async function getOrCreateConversation(
  otherUserId: string
): Promise<{ conversationId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.id === otherUserId) return null;

  const admin = createAdminClient();

  // Check existing conversation (either direction)
  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .or(
      `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
    )
    .limit(1)
    .single();

  if (existing) return { conversationId: existing.id };

  // Create new conversation
  const { data: newConv, error } = await admin
    .from("conversations")
    .insert({
      participant_1: user.id,
      participant_2: otherUserId,
    })
    .select("id")
    .single();

  if (error || !newConv) return null;
  return { conversationId: newConv.id };
}

export async function pinConversation(
  conversationId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();
  const { data: conv } = await admin
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!conv) return { success: false, message: "Conversation not found." };

  const isP1 = conv.participant_1 === user.id;
  const isP2 = conv.participant_2 === user.id;
  if (!isP1 && !isP2)
    return { success: false, message: "Not a participant." };

  const field = isP1 ? "is_pinned_by_1" : "is_pinned_by_2";
  const currentVal = isP1 ? conv.is_pinned_by_1 : conv.is_pinned_by_2;

  const { error } = await admin
    .from("conversations")
    .update({ [field]: !currentVal })
    .eq("id", conversationId);

  if (error) return { success: false, message: error.message };
  return {
    success: true,
    message: currentVal ? "Conversation unpinned." : "Conversation pinned.",
  };
}

/* ═══════════════════════════════════════════════
   MESSAGES
   ═══════════════════════════════════════════════ */

export async function getMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: Message[]; total: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { messages: [], total: 0 };

  const admin = createAdminClient();

  // Verify user is participant
  const { data: conv } = await admin
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", conversationId)
    .single();

  if (
    !conv ||
    (conv.participant_1 !== user.id && conv.participant_2 !== user.id)
  ) {
    return { messages: [], total: 0 };
  }

  const offset = (page - 1) * limit;

  const { data: messages, count } = await admin
    .from("messages")
    .select("*", { count: "exact" })
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    messages: (messages ?? []).reverse(),
    total: count ?? 0,
  };
}

export async function sendMessage(
  conversationId: string,
  body: string,
  mediaUrl?: string | null,
  mediaType?: string | null,
  isPpv?: boolean,
  ppvPrice?: number | null
): Promise<ActionResult & { sentMessage?: Message }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();

  // Verify user is participant
  const { data: conv } = await admin
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", conversationId)
    .single();

  if (
    !conv ||
    (conv.participant_1 !== user.id && conv.participant_2 !== user.id)
  ) {
    return { success: false, message: "Not a participant." };
  }

  // Get sender profile to check role
  const { data: senderProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isCreator = senderProfile?.role === "creator";

  // Enforce permissions:
  // - Only creators can send videos
  // - Only creators can send PPV content
  if (mediaType === "video" && !isCreator) {
    return { success: false, message: "Only creators can send videos." };
  }
  if (isPpv && !isCreator) {
    return { success: false, message: "Only creators can send PPV content." };
  }

  const trimmedBody = (body ?? "").trim();
  if (!trimmedBody && !mediaUrl) {
    return { success: false, message: "Message cannot be empty." };
  }

  // Insert message
  const { data: msg, error } = await admin
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: trimmedBody,
      media_url: mediaUrl ?? null,
      media_type: mediaType ?? null,
      is_ppv: isPpv ?? false,
      ppv_price: isPpv && ppvPrice ? ppvPrice : null,
    })
    .select("*")
    .single();

  if (error || !msg) {
    return { success: false, message: error?.message ?? "Failed to send." };
  }

  // Update conversation last message
  const preview = trimmedBody
    ? trimmedBody.slice(0, 100)
    : mediaType === "video"
      ? "Sent a video"
      : "Sent an image";

  await admin
    .from("conversations")
    .update({
      last_message_at: msg.created_at,
      last_message_preview: isPpv ? "PPV content" : preview,
    })
    .eq("id", conversationId);

  // Send notification to the other user
  const otherId =
    conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

  const { data: senderFull } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  await admin.from("notifications").insert({
    user_id: otherId,
    type: "new_message",
    title: "New message",
    body: `${senderFull?.display_name ?? "Someone"}: ${preview.slice(0, 60)}`,
    related_id: conversationId,
  });

  return { success: true, message: "Message sent.", sentMessage: msg };
}

export async function markMessagesRead(
  conversationId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();

  // Mark all unread messages from the other person as read
  await admin
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .eq("is_read", false)
    .neq("sender_id", user.id);

  return { success: true, message: "Messages marked as read." };
}

export async function pinMessage(
  messageId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();

  // Get message and conversation
  const { data: msg } = await admin
    .from("messages")
    .select("*, conversations!inner(participant_1, participant_2)")
    .eq("id", messageId)
    .single();

  if (!msg) return { success: false, message: "Message not found." };

  // Only creators (participants who are creators) can pin
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "creator") {
    return { success: false, message: "Only creators can pin messages." };
  }

  // Unpin other messages in this conversation first
  if (!msg.is_pinned) {
    await admin
      .from("messages")
      .update({ is_pinned: false })
      .eq("conversation_id", msg.conversation_id)
      .eq("is_pinned", true);
  }

  // Toggle pin
  const { error } = await admin
    .from("messages")
    .update({ is_pinned: !msg.is_pinned })
    .eq("id", messageId);

  if (error) return { success: false, message: error.message };
  return {
    success: true,
    message: msg.is_pinned ? "Message unpinned." : "Message pinned.",
  };
}

export async function deleteMessage(
  messageId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();

  const { error } = await admin
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Message deleted." };
}

/* ═══════════════════════════════════════════════
   TIPS IN CHAT
   ═══════════════════════════════════════════════ */

export async function sendTipInChat(
  conversationId: string,
  amount: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  if (amount <= 0) return { success: false, message: "Amount must be positive." };

  const admin = createAdminClient();

  // Verify conversation and get other user
  const { data: conv } = await admin
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", conversationId)
    .single();

  if (
    !conv ||
    (conv.participant_1 !== user.id && conv.participant_2 !== user.id)
  ) {
    return { success: false, message: "Not a participant." };
  }

  const otherId =
    conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

  // Transfer credits
  const transfer = await transferCredits({
    fromUserId: user.id,
    toUserId: otherId,
    amount,
    fromType: "chat_tip_sent",
    toType: "chat_tip_received",
    description: `Chat tip of ${amount} credits`,
    relatedId: conversationId,
  });

  if (!transfer.success) {
    return { success: false, message: transfer.error ?? "Tip failed." };
  }

  // Insert tip message
  const { data: senderProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  await admin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: "",
    is_tip: true,
    tip_amount: amount,
  });

  // Update conversation
  await admin
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: `Sent a ${amount} credit tip`,
    })
    .eq("id", conversationId);

  // Notification
  await admin.from("notifications").insert({
    user_id: otherId,
    type: "message_tip",
    title: "Tip received in chat!",
    body: `${senderProfile?.display_name ?? "Someone"} sent you a ${amount} credit tip.`,
    related_id: conversationId,
  });

  return { success: true, message: `Tip of ${amount} credits sent!` };
}

/* ═══════════════════════════════════════════════
   PPV MESSAGE UNLOCK
   ═══════════════════════════════════════════════ */

export async function unlockPPVMessage(
  messageId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();

  // Get message
  const { data: msg } = await admin
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (!msg) return { success: false, message: "Message not found." };
  if (!msg.is_ppv || !msg.ppv_price) {
    return { success: false, message: "This message is not PPV." };
  }

  // Check if already purchased
  const { data: existing } = await admin
    .from("message_ppv_purchases")
    .select("id")
    .eq("message_id", messageId)
    .eq("buyer_id", user.id)
    .single();

  if (existing) return { success: false, message: "Already unlocked." };

  // Transfer credits
  const transfer = await transferCredits({
    fromUserId: user.id,
    toUserId: msg.sender_id,
    amount: msg.ppv_price,
    fromType: "message_ppv_payment",
    toType: "message_ppv_earning",
    description: `PPV message unlock (${msg.ppv_price} credits)`,
    relatedId: messageId,
  });

  if (!transfer.success) {
    return { success: false, message: transfer.error ?? "Payment failed." };
  }

  // Record purchase
  await admin.from("message_ppv_purchases").insert({
    message_id: messageId,
    buyer_id: user.id,
    price_paid: msg.ppv_price,
  });

  // Mark message as unlocked
  await admin
    .from("messages")
    .update({ is_ppv_unlocked: true })
    .eq("id", messageId);

  // Notification to sender
  const { data: buyerProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  await admin.from("notifications").insert({
    user_id: msg.sender_id,
    type: "message_ppv_purchase",
    title: "PPV content purchased!",
    body: `${buyerProfile?.display_name ?? "Someone"} unlocked your PPV message.`,
    related_id: messageId,
  });

  return { success: true, message: "Content unlocked!" };
}

/* ═══════════════════════════════════════════════
   UNREAD COUNT
   ═══════════════════════════════════════════════ */

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const admin = createAdminClient();

  // Get all conversation IDs
  const { data: convs } = await admin
    .from("conversations")
    .select("id")
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

  if (!convs || convs.length === 0) return 0;

  const convIds = convs.map((c) => c.id);

  const { count } = await admin
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("conversation_id", convIds)
    .eq("is_read", false)
    .neq("sender_id", user.id);

  return count ?? 0;
}
