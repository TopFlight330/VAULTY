"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getMyPageData } from "@/lib/actions/profile";
import { createTier, updateTier, deleteTier } from "@/lib/actions/tiers";
import type { Tier, PostWithMedia } from "@/types/database";
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
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [posts, setPosts] = useState<PostWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [subCount, setSubCount] = useState(0);

  // Tier editor
  const [showTierEditor, setShowTierEditor] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [tierName, setTierName] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [tierDesc, setTierDesc] = useState("");
  const [tierFeatured, setTierFeatured] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { tiers: fetchedTiers, posts: fetchedPosts, postCount: fetchedPostCount, subCount: fetchedSubCount } = await getMyPageData();

    setTiers(fetchedTiers);
    setPosts(fetchedPosts);
    setPostCount(fetchedPostCount);
    setSubCount(fetchedSubCount);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openTierEditor = (tier?: Tier) => {
    if (tier) {
      setEditingTier(tier);
      setTierName(tier.name);
      setTierPrice(tier.price.toString());
      setTierDesc(tier.description);
      setTierFeatured(tier.is_featured);
    } else {
      setEditingTier(null);
      setTierName("");
      setTierPrice("");
      setTierDesc("");
      setTierFeatured(false);
    }
    setShowTierEditor(true);
  };

  const handleSaveTier = async () => {
    setSaving(true);
    const price = parseInt(tierPrice) || 0;

    if (editingTier) {
      const result = await updateTier(editingTier.id, {
        name: tierName,
        price,
        description: tierDesc,
        is_featured: tierFeatured,
      });
      if (result.success) {
        showToast("Tier updated!", "success");
      } else {
        showToast(result.message, "error");
      }
    } else {
      const result = await createTier({
        name: tierName,
        price,
        description: tierDesc,
        is_featured: tierFeatured,
      });
      if (result.success) {
        showToast("Tier created!", "success");
      } else {
        showToast(result.message, "error");
      }
    }

    setSaving(false);
    setShowTierEditor(false);
    fetchData();
  };

  const handleDeleteTier = async (tierId: string) => {
    const result = await deleteTier(tierId);
    if (result.success) {
      showToast("Tier deleted", "success");
      fetchData();
    } else {
      showToast(result.message, "error");
    }
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

      <div className={s.sectionTitle}>Subscription Tiers</div>
      {loading ? (
        <div className={s.tiersGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={s.tierCard} style={{ minHeight: 200 }}>
              <div style={{ height: 16, width: "50%", background: "var(--input-bg)", borderRadius: 8, marginBottom: "0.5rem" }} />
              <div style={{ height: 28, width: "40%", background: "var(--input-bg)", borderRadius: 8, marginBottom: "0.5rem" }} />
              <div style={{ height: 12, width: "60%", background: "var(--input-bg)", borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className={s.tiersGrid}>
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`${s.tierCard} ${tier.is_featured ? s.tierCardFeatured : ""}`}
            >
              {tier.is_featured && (
                <div className={s.tierFeaturedBadge}>Most Popular</div>
              )}
              <div className={s.tierName}>{tier.name}</div>
              <div className={s.tierPrice}>{tier.price}</div>
              <div className={s.tierPriceUnit}>credits/mo</div>
              <div className={s.tierDesc}>{tier.description}</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className={s.tierEditBtn}
                  onClick={() => openTierEditor(tier)}
                  style={{ flex: 1 }}
                >
                  Edit
                </button>
                <button
                  className={s.tierEditBtn}
                  onClick={() => handleDeleteTier(tier.id)}
                  style={{
                    flex: 0,
                    padding: "0.55rem 0.85rem",
                    color: "var(--danger)",
                    borderColor: "rgba(239,68,68,0.2)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                </button>
              </div>
            </div>
          ))}
          <div className={s.tierAddCard} onClick={() => openTierEditor()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span>Add New Tier</span>
          </div>
        </div>
      )}

      {/* Tier Editor Modal */}
      {showTierEditor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTierEditor(false);
          }}
        >
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "2rem",
              width: "100%",
              maxWidth: 480,
            }}
          >
            <h2 style={{ fontFamily: "var(--font-sora)", fontWeight: 800, marginBottom: "1.5rem" }}>
              {editingTier ? "Edit Tier" : "Create New Tier"}
            </h2>

            <div className={s.formGroup}>
              <label>Tier Name</label>
              <input
                type="text"
                className={s.formInput}
                placeholder="e.g. Premium"
                value={tierName}
                onChange={(e) => setTierName(e.target.value)}
              />
            </div>

            <div className={s.formGroup}>
              <label>Price (credits/month)</label>
              <input
                type="number"
                className={s.formInput}
                placeholder="e.g. 150"
                value={tierPrice}
                onChange={(e) => setTierPrice(e.target.value)}
                min="1"
              />
            </div>

            <div className={s.formGroup}>
              <label>Description</label>
              <textarea
                className={`${s.formInput} ${s.formInputTextarea}`}
                rows={3}
                placeholder="What subscribers get with this tier..."
                value={tierDesc}
                onChange={(e) => setTierDesc(e.target.value)}
              />
            </div>

            <div
              className={s.toggleRow}
              style={{ marginBottom: "1.5rem", padding: 0 }}
            >
              <div>
                <div className={s.toggleLabel}>Featured tier</div>
                <div className={s.toggleDesc}>
                  Highlighted as &quot;Most Popular&quot; on your page.
                </div>
              </div>
              <label
                className={`${s.toggleSwitch} ${tierFeatured ? s.toggleSwitchChecked : ""}`}
              >
                <input
                  type="checkbox"
                  checked={tierFeatured}
                  onChange={() => setTierFeatured((c) => !c)}
                />
                <span className={s.toggleSlider} />
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className={s.btnSecondary}
                onClick={() => setShowTierEditor(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className={s.btnSave}
                onClick={handleSaveTier}
                disabled={saving || !tierName.trim() || !tierPrice}
                style={{
                  flex: 1,
                  opacity: saving || !tierName.trim() || !tierPrice ? 0.5 : 1,
                }}
              >
                {saving
                  ? "Saving..."
                  : editingTier
                    ? "Update Tier"
                    : "Create Tier"}
              </button>
            </div>
          </div>
        </div>
      )}

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
