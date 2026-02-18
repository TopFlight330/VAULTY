"use client";

import { useState } from "react";
import type { Profile, AchievementBadge } from "@/types/database";
import s from "./profile-card.module.css";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function accountAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Joined today";
  if (days < 30) return `Joined ${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Joined ${months}mo ago`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `Joined ${years}y ${rem}mo ago` : `Joined ${years}y ago`;
}

/* ── Badge Icons ── */
function BadgeIcon({ icon }: { icon: string }) {
  const p = { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "checkmark": return <svg {...p}><path d="M20 6L9 17l-5-5" /></svg>;
    case "flash": return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case "trophy": return <svg {...p}><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0012 0V2z" /></svg>;
    case "star": return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    case "documents": return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case "heart": return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>;
    default: return null;
  }
}

interface ProfileCardProps {
  creator: Profile;
  badges: AchievementBadge[];
  totalLikes: number;
  photoCount: number;
  videoCount: number;
  isOwner: boolean;
  /** Render action buttons (tip, message, favorites, share) for non-owners */
  actionButtons?: React.ReactNode;
}

export function ProfileCard({
  creator,
  badges,
  totalLikes,
  photoCount,
  videoCount,
  isOwner,
  actionButtons,
}: ProfileCardProps) {
  const [activeBadge, setActiveBadge] = useState<AchievementBadge | null>(null);
  const initials = getInitials(creator.display_name);

  // Sort badges: verified always first when earned, then other earned, then unearned
  const sortedBadges = [...badges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    if (a.earned && b.earned && a.id === "verified") return -1;
    if (a.earned && b.earned && b.id === "verified") return 1;
    return 0;
  });

  return (
    <div className={s.cardBox}>
      {/* Banner */}
      <div className={s.banner}>
        {creator.banner_url && <img src={creator.banner_url} alt="" />}
      </div>

      {/* Profile Section */}
      <div className={s.profileSection}>
        <div className={s.profileRow}>
          {/* Avatar with online dot */}
          <div className={s.avatarWrap}>
            <div className={s.avatar}>
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt="" />
              ) : (
                initials
              )}
            </div>
            {creator.online_status === "available" && (
              <div className={s.onlineDot} />
            )}
          </div>

          {/* Action buttons (only for non-owners) */}
          {!isOwner && actionButtons && (
            <div className={s.profileActions}>
              {actionButtons}
            </div>
          )}
        </div>

        <div className={s.nameRow}>
          <div className={s.displayName}>{creator.display_name}</div>
          {creator.is_verified && (
            <svg className={s.verifiedBadge} viewBox="0 0 24 24">
              <defs>
                <linearGradient id="vgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f8e" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="url(#vgrad)" stroke="none" />
              <path d="M9 12l2 2 4-4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <div className={s.usernameRow}>
          <span className={s.username}>
            @{creator.username}{creator.online_status === "available" && " - Online"}
          </span>
          <span className={s.joinedAge}>{accountAge(creator.created_at)}</span>
        </div>

        <div className={s.divider} />

        {/* Achievement Badges */}
        {sortedBadges.length > 0 && (
          <div className={s.badgesRow}>
            {sortedBadges.map((badge) => {
              const isVerified = badge.id === "verified";
              const displayName = isVerified ? "Reactive" : badge.name;
              const displayIcon = isVerified ? "flash" : badge.icon;
              return (
                <div
                  key={badge.id}
                  className={`${s.badge} ${badge.earned ? s.badgeEarned : s.badgeGray}`}
                  onClick={() => setActiveBadge(badge)}
                >
                  <BadgeIcon icon={displayIcon} />
                  <span className={s.badgeName}>{displayName}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Badge Info Popup */}
        {activeBadge && (
          <div className={s.badgePopupOverlay} onClick={() => setActiveBadge(null)}>
            <div className={s.badgePopup} onClick={(e) => e.stopPropagation()}>
              <button className={s.badgePopupClose} onClick={() => setActiveBadge(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div className={`${s.badgePopupIcon} ${activeBadge.earned ? s.badgePopupIconEarned : s.badgePopupIconGray}`}>
                <BadgeIcon icon={activeBadge.id === "verified" ? "flash" : activeBadge.icon} />
              </div>
              <div className={s.badgePopupName}>
                {activeBadge.id === "verified" ? "Reactive" : activeBadge.name}
              </div>
              <div className={s.badgePopupDesc}>{activeBadge.description}</div>
              <div className={`${s.badgePopupStatus} ${activeBadge.earned ? s.badgePopupStatusEarned : s.badgePopupStatusLocked}`}>
                {activeBadge.earned ? "Earned" : "Not yet earned"}
              </div>
            </div>
          </div>
        )}

        {creator.bio && <div className={s.bio}>{creator.bio}</div>}

        <div className={s.divider} />

        <div className={s.statsRow}>
          <div className={s.statItem}>
            {totalLikes.toLocaleString()}
            <span className={s.statLabel}>Likes</span>
            <svg className={s.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </div>
          <div className={s.statItem}>
            {photoCount.toLocaleString()}
            <span className={s.statLabel}>Photos</span>
            <svg className={s.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div className={s.statItem}>
            {videoCount.toLocaleString()}
            <span className={s.statLabel}>Videos</span>
            <svg className={s.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </div>
          {creator.category === "18+" && (
            <span className={s.nsfwTag}>18+</span>
          )}
        </div>
      </div>
    </div>
  );
}
