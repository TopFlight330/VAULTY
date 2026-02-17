"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function toggleBookmark(
  postId: string
): Promise<{ success: boolean; bookmarked: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, bookmarked: false };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .single();

  if (existing) {
    await admin.from("bookmarks").delete().eq("id", existing.id);
    return { success: true, bookmarked: false };
  } else {
    const { error } = await admin
      .from("bookmarks")
      .insert({ user_id: user.id, post_id: postId });

    if (error) return { success: false, bookmarked: false };
    return { success: true, bookmarked: true };
  }
}
