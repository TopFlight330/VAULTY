"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, PostWithMedia, Profile } from "@/types/database";

export async function updateProfile(data: {
  display_name?: string;
  username?: string;
  bio?: string;
  category?: string;
  subscription_price?: number | null;
  online_status?: "available" | "invisible";
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const updates: Record<string, unknown> = {};
  if (data.display_name !== undefined) updates.display_name = data.display_name;
  if (data.bio !== undefined) updates.bio = data.bio;
  if (data.category !== undefined) updates.category = data.category;
  if (data.subscription_price !== undefined) updates.subscription_price = data.subscription_price;
  if (data.online_status !== undefined) updates.online_status = data.online_status;

  // Username with uniqueness check
  if (data.username !== undefined) {
    const trimmed = data.username.trim().toLowerCase();
    if (trimmed.length < 3) {
      return { success: false, message: "Username must be at least 3 characters." };
    }
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      return { success: false, message: "Username can only contain letters, numbers, and underscores." };
    }

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("username", trimmed)
      .neq("id", user.id)
      .limit(1)
      .single();

    if (existing) {
      return { success: false, message: "This username is already taken." };
    }

    updates.username = trimmed;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, message: "Nothing to update." };
  }

  // Use admin client to bypass RLS (user already verified above)
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Profile updated." };
}

export async function updateSetting(
  key: string,
  value: boolean
): Promise<ActionResult> {
  const allowedKeys = [
    "setting_watermark",
    "setting_2fa",
    "setting_notif_subs",
    "setting_notif_tips",
    "setting_notif_payouts",
    "setting_marketing",
  ];

  if (!allowedKeys.includes(key)) {
    return { success: false, message: "Invalid setting." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ [key]: value })
    .eq("id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Setting updated." };
}

export async function updateAvatar(url: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Avatar updated." };
}

export async function updateBanner(url: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ banner_url: url })
    .eq("id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Banner updated." };
}

export async function uploadAndSetBanner(formData: FormData): Promise<ActionResult & { url?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, message: "No file provided." };

  const admin = createAdminClient();
  const path = `${user.id}/banner.jpg`;

  await admin.storage.createBucket("banners", {
    public: true,
    fileSizeLimit: 10485760, // 10MB
  }).catch(() => {});

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await admin.storage
    .from("banners")
    .upload(path, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    console.error("Banner upload error:", uploadError.message);
    return { success: false, message: "Upload failed: " + uploadError.message };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/banners/${path}?t=${Date.now()}`;

  const { error: updateError } = await admin
    .from("profiles")
    .update({ banner_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  return { success: true, message: "Banner updated.", url: publicUrl };
}

export async function deactivatePage(reason: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      is_deactivated: true,
      deactivation_reason: reason || null,
    })
    .eq("id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Page deactivated." };
}

export async function deleteAccount(password: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  // Verify password by attempting sign-in
  const admin = createAdminClient();
  const { data: userData } = await admin.auth.admin.getUserById(user.id);
  if (!userData?.user?.email) {
    return { success: false, message: "Could not verify account." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password,
  });

  if (signInError) {
    return { success: false, message: "Incorrect password." };
  }

  // Delete user via admin (cascades to profiles due to FK)
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return { success: false, message: deleteError.message };
  }

  // Sign out the current session
  await supabase.auth.signOut();

  return { success: true, message: "Account deleted." };
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

export async function uploadAndSetAvatar(formData: FormData): Promise<ActionResult & { url?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, message: "No file provided." };

  const admin = createAdminClient();
  const path = `${user.id}/avatar.jpg`;

  // Ensure bucket exists
  await admin.storage.createBucket("avatars", {
    public: true,
    fileSizeLimit: 5242880, // 5MB
  }).catch(() => {}); // Ignore if already exists

  // Convert File to ArrayBuffer for server upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload via admin client (bypasses all storage policies)
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    console.error("Avatar upload error:", uploadError.message);
    return { success: false, message: "Upload failed: " + uploadError.message };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${path}?t=${Date.now()}`;

  // Update profile
  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  return { success: true, message: "Avatar updated.", url: publicUrl };
}

export async function getMyPageData(): Promise<{
  posts: PostWithMedia[];
  postCount: number;
  subCount: number;
  totalLikes: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { posts: [], postCount: 0, subCount: 0, totalLikes: 0 };

  const [postsResult, subsResult] = await Promise.all([
    supabase
      .from("posts")
      .select("*, media:post_media(*)")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .eq("status", "active"),
  ]);

  const posts = (postsResult.data ?? []) as PostWithMedia[];
  const totalLikes = posts.reduce((sum, p) => sum + (p.like_count ?? 0), 0);

  return {
    posts,
    postCount: posts.length,
    subCount: subsResult.count ?? 0,
    totalLikes,
  };
}
