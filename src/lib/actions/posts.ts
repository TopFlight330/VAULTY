"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, Visibility, PostWithMedia } from "@/types/database";

export async function createPost(data: {
  title?: string;
  body?: string;
  visibility: Visibility;
  ppv_price?: number;
}): Promise<{ success: boolean; message: string; postId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  if (!data.body?.trim() && !data.title?.trim()) {
    return { success: false, message: "Content is required." };
  }

  if (data.visibility === "ppv" && (!data.ppv_price || data.ppv_price <= 0)) {
    return { success: false, message: "PPV price is required." };
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      creator_id: user.id,
      title: data.title?.trim() ?? "",
      body: data.body?.trim() ?? "",
      visibility: data.visibility,
      ppv_price: data.visibility === "ppv" ? data.ppv_price : null,
    })
    .select("id")
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Post created.", postId: post.id };
}

export async function updatePost(
  postId: string,
  data: {
    title?: string;
    body?: string;
    visibility?: Visibility;
    ppv_price?: number;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.body !== undefined) updates.body = data.body.trim();
  if (data.visibility !== undefined) {
    updates.visibility = data.visibility;
    if (data.visibility === "ppv") {
      updates.ppv_price = data.ppv_price ?? null;
    } else {
      updates.ppv_price = null;
    }
  }

  const { error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .eq("creator_id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Post updated." };
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();

  // Verify ownership before deleting
  const { data: post } = await admin
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("creator_id", user.id)
    .single();

  if (!post) return { success: false, message: "Post not found." };

  // Delete associated media records first
  await admin.from("post_media").delete().eq("post_id", postId);

  const { error } = await admin
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Post deleted." };
}

export async function addPostMedia(data: {
  postId: string;
  storagePath: string;
  mediaType: "image" | "video";
  sortOrder?: number;
}): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("post_media").insert({
    post_id: data.postId,
    storage_path: data.storagePath,
    media_type: data.mediaType,
    sort_order: data.sortOrder ?? 0,
  });

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Media added." };
}

export async function removePostMedia(mediaId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("post_media")
    .delete()
    .eq("id", mediaId);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Media removed." };
}

export async function toggleLike(
  postId: string
): Promise<{ success: boolean; liked: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, liked: false };

  // Check if already liked
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .single();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    // Decrement like_count via direct update
    const { data: post } = await supabase
      .from("posts")
      .select("like_count")
      .eq("id", postId)
      .single();
    if (post && post.like_count > 0) {
      await supabase
        .from("posts")
        .update({ like_count: post.like_count - 1 })
        .eq("id", postId);
    }
    return { success: true, liked: false };
  } else {
    await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
    // Increment like_count
    const { data: postData } = await supabase
      .from("posts")
      .select("like_count")
      .eq("id", postId)
      .single();
    if (postData) {
      await supabase
        .from("posts")
        .update({ like_count: postData.like_count + 1 })
        .eq("id", postId);
    }
    return { success: true, liked: true };
  }
}

export async function togglePinPost(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();

  // Fetch current state
  const { data: post } = await admin
    .from("posts")
    .select("id, is_pinned")
    .eq("id", postId)
    .eq("creator_id", user.id)
    .single();

  if (!post) return { success: false, message: "Post not found." };

  const newPinned = !post.is_pinned;

  const { error } = await admin
    .from("posts")
    .update({ is_pinned: newPinned })
    .eq("id", postId);

  if (error) return { success: false, message: error.message };
  return { success: true, message: newPinned ? "Post pinned." : "Post unpinned." };
}

export async function getMyPosts(): Promise<PostWithMedia[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("*, media:post_media(*)")
    .eq("creator_id", user.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMyPosts error:", error.message);
    return [];
  }

  return (data as PostWithMedia[]) ?? [];
}
