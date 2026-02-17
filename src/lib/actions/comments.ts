"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, CommentWithProfile } from "@/types/database";

export async function addComment(
  postId: string,
  body: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const trimmed = body.trim();
  if (!trimmed) return { success: false, message: "Comment cannot be empty." };
  if (trimmed.length > 500)
    return { success: false, message: "Comment too long (max 500 chars)." };

  const admin = createAdminClient();

  const { error } = await admin.from("comments").insert({
    user_id: user.id,
    post_id: postId,
    body: trimmed,
  });

  if (error) return { success: false, message: error.message };

  // Increment comment_count
  const { data: post } = await admin
    .from("posts")
    .select("comment_count")
    .eq("id", postId)
    .single();

  if (post) {
    await admin
      .from("posts")
      .update({ comment_count: (post.comment_count ?? 0) + 1 })
      .eq("id", postId);
  }

  return { success: true, message: "Comment added!" };
}

export async function deleteComment(
  commentId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();

  const { data: comment } = await admin
    .from("comments")
    .select("user_id, post_id")
    .eq("id", commentId)
    .single();

  if (!comment) return { success: false, message: "Comment not found." };
  if (comment.user_id !== user.id)
    return { success: false, message: "Not authorized." };

  const { error } = await admin.from("comments").delete().eq("id", commentId);
  if (error) return { success: false, message: error.message };

  // Decrement comment_count
  const { data: post } = await admin
    .from("posts")
    .select("comment_count")
    .eq("id", comment.post_id)
    .single();

  if (post && (post.comment_count ?? 0) > 0) {
    await admin
      .from("posts")
      .update({ comment_count: post.comment_count - 1 })
      .eq("id", comment.post_id);
  }

  return { success: true, message: "Comment deleted." };
}

export async function getPostComments(
  postId: string,
  limit = 20
): Promise<CommentWithProfile[]> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("comments")
    .select("*, profile:profiles(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as CommentWithProfile[]) ?? [];
}
