import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCreatorPostsWithInteractions } from "@/lib/queries/posts";
import { getCreatorBadges } from "@/lib/helpers/badges";
import { CreatorPageClient } from "./CreatorPageClient";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function CreatorPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch creator profile
  const { data: creator } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("role", "creator")
    .eq("is_banned", false)
    .single();

  if (!creator) notFound();

  // Get current viewer
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  // Fetch posts + stats in parallel
  const [posts, subsCountResult, postCountResult, likesResult, lastPostResult] =
    await Promise.all([
      getCreatorPostsWithInteractions(creator.id, viewerId),
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

  // Check if viewer has active subscription
  let hasSubscription = false;
  if (viewerId && viewerId !== creator.id) {
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
      viewerId={viewerId}
    />
  );
}
