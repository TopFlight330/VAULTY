import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCreatorPostsWithInteractions } from "@/lib/queries/posts";
import { getCreatorBadges } from "@/lib/helpers/badges";
import { CreatorPageClient } from "./CreatorPageClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ view_as?: string }>;
}

export default async function CreatorPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { view_as } = await searchParams;
  const supabase = await createClient();

  // Fetch creator profile (admin client to bypass RLS and ensure all fields like online_status)
  const admin = createAdminClient();
  const { data: creator } = await admin
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("role", "creator")
    .eq("is_banned", false)
    .single();

  if (!creator) notFound();

  // Default online_status (column may be null for older profiles)
  if (!creator.online_status) creator.online_status = "available";

  // Get current viewer
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  // "View Page As" mode - only for the page owner
  const isOwner = viewerId === creator.id;
  let viewMode: "free" | "subscriber" | null = null;
  if (isOwner && (view_as === "free" || view_as === "subscriber")) {
    viewMode = view_as;
  }

  // When in view mode, fetch posts as if viewer is NOT the owner
  // Pass null so the owner-bypass in getCreatorPostsWithInteractions is skipped
  const postsViewerId = viewMode ? null : viewerId;

  // Fetch posts + stats in parallel
  const [posts, subsCountResult, postCountResult, likesResult, lastPostResult] =
    await Promise.all([
      getCreatorPostsWithInteractions(creator.id, postsViewerId),
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creator.id)
        .eq("status", "active"),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creator.id)
        .eq("is_published", true),
      supabase
        .from("posts")
        .select("like_count")
        .eq("creator_id", creator.id)
        .eq("is_published", true),
      supabase
        .from("posts")
        .select("created_at")
        .eq("creator_id", creator.id)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

  const subCount = subsCountResult.count ?? 0;
  const postCount = postCountResult.count ?? 0;
  const totalLikes = (likesResult.data ?? []).reduce(
    (sum, p) => sum + (p.like_count ?? 0),
    0
  );
  const lastPostAt = lastPostResult.data?.created_at ?? null;

  // Determine subscription status
  let hasSubscription = false;
  if (viewMode === "subscriber") {
    // Simulate subscriber view: unlock premium posts
    hasSubscription = true;
    // Override post access levels for premium content
    posts.forEach((p) => {
      if (p.visibility === "premium") {
        (p as { access_level: string }).access_level = "full";
      }
    });
  } else if (!viewMode && viewerId && viewerId !== creator.id) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("subscriber_id", viewerId)
      .eq("creator_id", creator.id)
      .eq("status", "active")
      .gte("current_period_end", new Date().toISOString())
      .limit(1)
      .single();
    hasSubscription = !!sub;
  }

  const badges = getCreatorBadges(
    creator,
    { subscribers: subCount, posts: postCount, totalLikes },
    lastPostAt
  );

  return (
    <CreatorPageClient
      creator={creator}
      posts={posts}
      badges={badges}
      subCount={subCount}
      postCount={postCount}
      totalLikes={totalLikes}
      hasSubscription={hasSubscription}
      viewerId={viewMode ? null : viewerId}
      viewMode={viewMode}
    />
  );
}
