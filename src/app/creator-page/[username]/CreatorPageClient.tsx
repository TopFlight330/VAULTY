"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { subscribe } from "@/lib/actions/subscriptions";
import { sendTip, purchasePPV } from "@/lib/actions/credits";
import { getPublicUrl } from "@/lib/helpers/storage";
import type { Profile, PostWithAccess, Tier } from "@/types/database";
import s from "./creator-page.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface Props {
  creator: Profile;
  posts: PostWithAccess[];
  tiers: Tier[];
  subCount: number;
  postCount: number;
  hasSubscription: boolean;
  viewerId: string | null;
}

export function CreatorPageClient({
  creator,
  posts,
  tiers,
  subCount,
  postCount,
  hasSubscription,
  viewerId,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [tipping, setTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const initials = getInitials(creator.display_name);
  const isOwner = viewerId === creator.id;

  const handleSubscribe = async (tierId: string) => {
    if (!viewerId) {
      showToast("Please log in to subscribe.", "error");
      router.push("/login");
      return;
    }
    setSubscribing(tierId);
    const result = await subscribe(creator.id, tierId);
    if (result.success) {
      showToast(result.message, "success");
      router.refresh();
    } else {
      showToast(result.message, "error");
    }
    setSubscribing(null);
  };

  const handleTip = async () => {
    if (!viewerId) {
      showToast("Please log in to send a tip.", "error");
      router.push("/login");
      return;
    }
    const amount = parseInt(tipAmount);
    if (!amount || amount <= 0) {
      showToast("Enter a valid amount.", "error");
      return;
    }
    setTipping(true);
    const result = await sendTip(creator.id, amount);
    if (result.success) {
      showToast(result.message, "success");
      setTipAmount("");
    } else {
      showToast(result.message, "error");
    }
    setTipping(false);
  };

  const handleUnlockPPV = async (postId: string) => {
    if (!viewerId) {
      showToast("Please log in to unlock content.", "error");
      router.push("/login");
      return;
    }
    setUnlocking(postId);
    const result = await purchasePPV(postId);
    if (result.success) {
      showToast(result.message, "success");
      router.refresh();
    } else {
      showToast(result.message, "error");
    }
    setUnlocking(null);
  };

  return (
    <div className={s.page}>
      {/* Banner */}
      <div className={s.banner}>
        {creator.banner_url && (
          <img src={creator.banner_url} alt="" />
        )}
      </div>

      {/* Profile Header */}
      <div className={s.profileHeader}>
        <div className={s.avatar}>
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt="" />
          ) : (
            initials
          )}
        </div>
        <div className={s.displayName}>{creator.display_name}</div>
        <div className={s.username}>@{creator.username}</div>
        {creator.bio && <div className={s.bio}>{creator.bio}</div>}
        <div className={s.meta}>
          <div className={s.metaItem}>
            {subCount.toLocaleString()} <span>subscribers</span>
          </div>
          <div className={s.metaItem}>
            {postCount.toLocaleString()} <span>posts</span>
          </div>
        </div>
      </div>

      {/* Layout: Posts + Sidebar */}
      <div className={s.layout}>
        {/* Posts Feed */}
        <div className={s.postsFeed}>
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--dim)", fontSize: "0.9rem" }}>
              No posts yet.
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                creator={creator}
                isOwner={isOwner}
                hasSubscription={hasSubscription}
                onUnlock={handleUnlockPPV}
                unlocking={unlocking}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className={s.sidebar}>
          {/* Tiers */}
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={tier.is_featured ? s.tierCardFeatured : s.tierCard}
            >
              {tier.is_featured && (
                <div className={s.tierFeaturedBadge}>Most Popular</div>
              )}
              <div className={s.tierName}>{tier.name}</div>
              <div className={s.tierPrice}>{tier.price}</div>
              <div className={s.tierPriceUnit}>credits/month</div>
              {tier.description && (
                <div className={s.tierDesc}>{tier.description}</div>
              )}
              {isOwner ? (
                <button className={s.tierBtnDisabled} disabled>
                  Your Tier
                </button>
              ) : hasSubscription ? (
                <button className={s.tierBtnDisabled} disabled>
                  Subscribed
                </button>
              ) : (
                <button
                  className={s.tierBtn}
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={subscribing === tier.id}
                >
                  {subscribing === tier.id ? "Subscribing..." : "Subscribe"}
                </button>
              )}
            </div>
          ))}

          {/* Tip */}
          {!isOwner && (
            <div className={s.sidebarSection}>
              <div className={s.sidebarTitle}>Send a Tip</div>
              <div className={s.tipInput}>
                <input
                  type="number"
                  placeholder="Amount"
                  min="1"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                />
                <button
                  className={s.tipBtn}
                  onClick={handleTip}
                  disabled={tipping}
                >
                  {tipping ? "Sending..." : "Tip"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Post Card ── */

function PostCard({
  post,
  creator,
  isOwner,
  hasSubscription,
  onUnlock,
  unlocking,
}: {
  post: PostWithAccess;
  creator: Profile;
  isOwner: boolean;
  hasSubscription: boolean;
  onUnlock: (postId: string) => void;
  unlocking: string | null;
}) {
  const initials = getInitials(creator.display_name);
  const isBlurred = post.access_level === "blur";
  const hasMedia = post.media.length > 0;

  const visibilityBadge = () => {
    if (post.visibility === "free") return <span className={`${s.postVisibilityBadge} ${s.badgeFree}`}>Free</span>;
    if (post.visibility === "premium") return <span className={`${s.postVisibilityBadge} ${s.badgePremium}`}>Premium</span>;
    if (post.visibility === "ppv") return <span className={`${s.postVisibilityBadge} ${s.badgePpv}`}>PPV</span>;
    return null;
  };

  return (
    <div className={s.postCard}>
      {/* Post Header */}
      <div className={s.postHeader}>
        <div className={s.postHeaderAvatar}>
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt="" />
          ) : (
            initials
          )}
        </div>
        <div>
          <div className={s.postHeaderName}>{creator.display_name}</div>
          <div className={s.postHeaderTime}>{timeAgo(post.created_at)}</div>
        </div>
      </div>

      {/* Title */}
      {post.title && <div className={s.postTitle}>{post.title}</div>}

      {/* Body */}
      {post.body && (
        <div className={s.postBody}>
          {isBlurred && post.body.length > 80
            ? post.body.slice(0, 80) + "..."
            : post.body}
        </div>
      )}

      {/* Media */}
      {hasMedia && (
        <div className={s.postMedia}>
          {isBlurred ? (
            <div className={s.blurWrap}>
              <div className={s.blurContent}>
                <img
                  src={getPublicUrl("post-media", post.media[0].storage_path)}
                  alt=""
                  className={s.postMediaImage}
                />
              </div>
              <div className={s.blurOverlay}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <div className={s.blurText}>
                  {post.visibility === "ppv"
                    ? `Unlock for ${post.ppv_price} credits`
                    : "Subscribe to unlock"}
                </div>
                {post.visibility === "ppv" ? (
                  <button
                    className={s.blurBtn}
                    onClick={() => onUnlock(post.id)}
                    disabled={unlocking === post.id}
                  >
                    {unlocking === post.id ? "Unlocking..." : "Unlock Now"}
                  </button>
                ) : (
                  <button
                    className={s.blurBtn}
                    onClick={() => {
                      const tierSection = document.querySelector(`.${s.sidebar}`);
                      tierSection?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    View Plans
                  </button>
                )}
              </div>
            </div>
          ) : (
            post.media.map((m) => (
              <img
                key={m.id}
                src={getPublicUrl("post-media", m.storage_path)}
                alt=""
                className={s.postMediaImage}
              />
            ))
          )}
        </div>
      )}

      {/* Stats */}
      <div className={s.postStats}>
        <div className={s.postStat}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          {post.like_count}
        </div>
        <div className={s.postStat}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {post.view_count}
        </div>
        {visibilityBadge()}
      </div>
    </div>
  );
}
