"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getMyPageData, updateProfile } from "@/lib/actions/profile";
import type { PostWithMedia } from "@/types/database";
import s from "../dashboard.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MyPagePage() {
  const { profile, user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [subCount, setSubCount] = useState(0);

  // Subscription price
  const [subPrice, setSubPrice] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { posts: fetchedPosts, postCount: fetchedPostCount, subCount: fetchedSubCount } = await getMyPageData();

    setPosts(fetchedPosts);
    setPostCount(fetchedPostCount);
    setSubCount(fetchedSubCount);
    setSubPrice(profile?.subscription_price?.toString() ?? "");
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSavePrice = async () => {
    setSavingPrice(true);
    const price = parseInt(subPrice) || 0;
    const result = await updateProfile({
      subscription_price: price > 0 ? price : null,
    });
    if (result.success) {
      showToast("Subscription price updated!", "success");
    } else {
      showToast(result.message, "error");
    }
    setSavingPrice(false);
  };

  const copyProfileLink = () => {
    const link = `vaulty.com/@${profile?.username ?? ""}`;
    navigator.clipboard
      .writeText(`https://${link}`)
      .then(() => showToast("Profile link copied to clipboard", "success"))
      .catch(() => showToast(`Profile link: https://${link}`, "info"));
  };

  const getThumbUrl = (post: PostWithMedia) => {
    const img = post.media?.find((m) => m.media_type === "image");
    if (!img) return null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return `${supabaseUrl}/storage/v1/object/public/post-media/${img.storage_path}`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const visibilityColor = (v: string) => {
    if (v === "free") return "var(--success)";
    if (v === "premium") return "var(--purple)";
    if (v === "ppv") return "var(--warning)";
    return "var(--dim)";
  };

  const displayName = profile?.display_name ?? "User";
  const username = profile?.username ?? "";
  const bio = profile?.bio ?? "";
  const initials = getInitials(displayName);

  return (
    <div>
      <div className={s.viewHeader}>
        <h1>My Page</h1>
        <p>Preview and customize how subscribers see your profile.</p>
      </div>

      <div className={s.pagePreviewCard}>
        <div className={s.pageBanner}>
          {profile?.banner_url && (
            <img
              src={profile.banner_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
        <div className={s.pageProfileSection}>
          <div className={s.pageAvatar}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              initials
            )}
          </div>
          <div className={s.pageDisplayName}>{displayName}</div>
          <div className={s.pageUsername}>@{username}</div>
          {bio && <div className={s.pageBio}>{bio}</div>}
          <div className={s.pageMeta}>
            <div className={s.pageMetaItem}>
              {subCount.toLocaleString()} <span>subscribers</span>
            </div>
            <div className={s.pageMetaItem}>
              {postCount.toLocaleString()} <span>posts</span>
            </div>
          </div>
        </div>
      </div>

      <div className={s.sectionTitle}>Subscription Price</div>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ fontSize: "0.85rem", color: "var(--dim)", marginBottom: "0.75rem" }}>
          Set the monthly price for subscribers to access your premium content. Leave empty to disable subscriptions.
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            type="number"
            className={s.formInput}
            placeholder="e.g. 150"
            value={subPrice}
            onChange={(e) => setSubPrice(e.target.value)}
            min="1"
            style={{ flex: 1, margin: 0 }}
          />
          <span style={{ fontSize: "0.85rem", color: "var(--dim)", fontWeight: 600, whiteSpace: "nowrap" }}>
            credits/mo
          </span>
          <button
            className={s.btnSave}
            onClick={handleSavePrice}
            disabled={savingPrice}
            style={{ opacity: savingPrice ? 0.5 : 1, whiteSpace: "nowrap" }}
          >
            {savingPrice ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className={s.sectionTitle}>Posts</div>
      {loading ? (
        <div className={s.contentGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={s.contentPost}>
              <div className={s.contentThumb} />
              <div className={s.contentBody}>
                <div style={{ height: 16, width: "70%", background: "var(--input-bg)", borderRadius: 8, marginBottom: "0.5rem" }} />
                <div style={{ height: 12, width: "40%", background: "var(--input-bg)", borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--dim)", fontSize: "0.9rem" }}>
          No posts yet. Create your first post in the Content tab.
        </div>
      ) : (
        <div className={s.contentGrid}>
          {posts.map((post) => {
            const thumbUrl = getThumbUrl(post);
            return (
              <div key={post.id} className={s.contentPost}>
                <div className={s.contentThumb}>
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      padding: "0.2rem 0.55rem",
                      borderRadius: 6,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      background: `${visibilityColor(post.visibility)}20`,
                      color: visibilityColor(post.visibility),
                      textTransform: "uppercase",
                    }}
                  >
                    {post.visibility === "ppv" ? "PPV" : capitalize(post.visibility)}
                  </span>
                </div>
                <div className={s.contentBody}>
                  <div className={s.contentTitle}>{post.title}</div>
                  <div className={s.contentDate}>{formatDate(post.created_at)}</div>
                  <div className={s.contentStats}>
                    <span className={s.contentStat}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                      {post.like_count.toLocaleString()}
                    </span>
                    <span className={s.contentStat}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      {post.view_count.toLocaleString()}
                    </span>
                    {post.visibility === "ppv" && post.ppv_price && (
                      <span className={s.contentStat} style={{ color: "var(--warning)" }}>
                        {post.ppv_price} credits
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={s.sectionTitle}>Profile Link</div>
      <div className={s.profileLinkCard}>
        <input
          type="text"
          className={s.profileLinkUrl}
          value={`vaulty.com/@${username}`}
          readOnly
        />
        <button className={s.copyBtn} onClick={copyProfileLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
          Copy
        </button>
      </div>
    </div>
  );
}
