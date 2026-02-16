import { createClient } from "@/lib/supabase/server";
import type { PostWithMedia, PostWithAccess } from "@/types/database";

export async function getCreatorPosts(
  creatorId: string,
  page = 1,
  limit = 20
): Promise<{ posts: PostWithMedia[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * limit;

  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId);

  const { data } = await supabase
    .from("posts")
    .select("*, media:post_media(*)")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  return { posts: (data as PostWithMedia[]) ?? [], total: count ?? 0 };
}

export async function getPostById(postId: string): Promise<PostWithMedia | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*, media:post_media(*)")
    .eq("id", postId)
    .single();
  return data as PostWithMedia | null;
}

export async function getCreatorPostsForViewer(
  creatorId: string,
  viewerId: string | null
): Promise<PostWithAccess[]> {
  const supabase = await createClient();

  // Fetch all published posts with media
  const { data: posts } = await supabase
    .from("posts")
    .select("*, media:post_media(*)")
    .eq("creator_id", creatorId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (!posts) return [];

  // If viewer is the creator, full access to everything
  if (viewerId === creatorId) {
    return posts.map((p) => ({ ...p, access_level: "full" as const }));
  }

  // Check if viewer has an active subscription
  let hasSubscription = false;
  let purchasedPostIds = new Set<string>();

  if (viewerId) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("subscriber_id", viewerId)
      .eq("creator_id", creatorId)
      .eq("status", "active")
      .gte("current_period_end", new Date().toISOString())
      .limit(1)
      .single();

    hasSubscription = !!sub;

    // Check PPV purchases
    const { data: purchases } = await supabase
      .from("ppv_purchases")
      .select("post_id")
      .eq("buyer_id", viewerId);

    if (purchases) {
      purchasedPostIds = new Set(purchases.map((p) => p.post_id));
    }
  }

  return posts.map((post) => {
    let access_level: "full" | "blur" = "blur";

    if (post.visibility === "free") {
      access_level = "full";
    } else if (post.visibility === "premium" && hasSubscription) {
      access_level = "full";
    } else if (post.visibility === "ppv" && purchasedPostIds.has(post.id)) {
      access_level = "full";
    }

    return { ...post, access_level };
  });
}
