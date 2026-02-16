"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/database";

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Notification read." };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "All notifications marked as read." };
}
