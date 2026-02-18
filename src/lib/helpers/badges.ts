import type { AchievementBadge, Profile } from "@/types/database";

export function getCreatorBadges(
  profile: Profile,
  stats: { subscribers: number; posts: number; totalLikes: number },
  lastPostAt: string | null
): AchievementBadge[] {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const isActive = lastPostAt
    ? new Date(lastPostAt).getTime() > sevenDaysAgo
    : false;

  return [
    {
      id: "verified",
      name: "Verified",
      icon: "checkmark",
      earned: profile.is_verified,
      description: "This creator responds to 90% of private messages within 2 hours.",
    },
    {
      id: "active",
      name: "Active",
      icon: "flash",
      earned: isActive,
      description: "This creator logs in at least once every day.",
    },
    {
      id: "top500",
      name: "Top 500",
      icon: "trophy",
      earned: stats.subscribers >= 1,
      description: "This creator ranks among the top 500 creators on the platform.",
    },
    {
      id: "top100",
      name: "Top 100",
      icon: "star",
      earned: stats.subscribers >= 2,
      description: "This creator ranks among the top 100 creators on the platform. Exceptional!",
    },
    {
      id: "action",
      name: "Action",
      icon: "documents",
      earned: stats.posts >= 50,
      description: "This creator posts at least 3 times per week.",
    },
    {
      id: "popular",
      name: "Popular",
      icon: "heart",
      earned: stats.totalLikes >= 500,
      description: "This creator is receiving a lot of visits right now.",
    },
  ];
}
