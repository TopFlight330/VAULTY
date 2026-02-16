import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCreatorPostsForViewer } from "@/lib/queries/posts";
import { getCreatorTiers } from "@/lib/queries/tiers";
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

  // Fetch posts with access level + tiers + stats in parallel
  const [posts, tiers, subsCountResult, postCountResult] = await Promise.all([
    getCreatorPostsForViewer(creator.id, viewerId),
    getCreatorTiers(creator.id),
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
  ]);

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

  return (
    <CreatorPageClient
      creator={creator}
      posts={posts}
      tiers={tiers}
      subCount={subsCountResult.count ?? 0}
      postCount={postCountResult.count ?? 0}
      hasSubscription={hasSubscription}
      viewerId={viewerId}
    />
  );
}
