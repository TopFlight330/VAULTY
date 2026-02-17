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
      description: "Verified creator",
    },
    {
      id: "active",
      name: "Active",
      icon: "flash",
      earned: isActive,
      description: "Posted this week",
    },
    {
      id: "top500",
      name: "Top 500",
      icon: "trophy",
      earned: stats.subscribers >= 500,
      description: "500+ subscribers",
    },
    {
      id: "top100",
      name: "Top 100",
      icon: "star",
      earned: stats.subscribers >= 1000,
      description: "1000+ subscribers",
    },
    {
      id: "prolific",
      name: "Prolific",
      icon: "documents",
      earned: stats.posts >= 50,
      description: "50+ posts",
    },
    {
      id: "popular",
      name: "Popular",
      icon: "heart",
      earned: stats.totalLikes >= 500,
      description: "500+ likes",
    },
  ];
}
