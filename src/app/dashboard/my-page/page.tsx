"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getMyPageData, updateProfile, updateBanner, uploadAndSetAvatar, uploadAndSetBanner } from "@/lib/actions/profile";
import { deletePost } from "@/lib/actions/posts";
import { AvatarCropModal } from "@/components/dashboard/shared/AvatarCropModal";
import { BannerCropModal } from "@/components/dashboard/shared/BannerCropModal";
import type { PostWithMedia } from "@/types/database";
import s from "../dashboard.module.css";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

export default function MyPagePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<PostWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [subCount, setSubCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  // Tabs
  const [activeTab, setActiveTab] = useState<"posts" | "media">("posts");

  // Subscription price inline edit
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);

  // Status dropdown
  const [showStatusDD, setShowStatusDD] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Three-dot menu
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // View Page As modal
  const [showViewAs, setShowViewAs] = useState(false);
  const [viewAsRole, setViewAsRole] = useState<"free" | "subscriber">("free");

  // File inputs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Crop modals
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropBannerFile, setCropBannerFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const data = await getMyPageData();
    setPosts(data.posts);
    setPostCount(data.postCount);
    setSubCount(data.subCount);
    setTotalLikes(data.totalLikes);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusDD(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Upload helpers ── */
  const handleCroppedBanner = async (blob: Blob) => {
    if (!user) return;
    const formData = new FormData();
    formData.append("file", new File([blob], "banner.jpg", { type: "image/jpeg" }));

    const result = await uploadAndSetBanner(formData);
    if (result.success) {
      showToast("Banner updated!", "success");
      await refreshProfile();
      setCropBannerFile(null);
    } else {
      showToast(result.message, "error");
    }
  };

  const handleCroppedAvatar = async (blob: Blob) => {
    if (!user) return;
    const formData = new FormData();
    formData.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));

    const result = await uploadAndSetAvatar(formData);
    if (result.success) {
      showToast("Avatar updated!", "success");
      await refreshProfile();
      setCropFile(null);
    } else {
      showToast(result.message, "error");
    }
  };

  const handleRemoveBanner = async () => {
    const result = await updateBanner("");
    if (result.success) {
      showToast("Banner removed", "success");
      refreshProfile();
    }
  };

  /* ── Status ── */
  const handleStatusChange = async (status: "available" | "invisible") => {
    setShowStatusDD(false);
    const result = await updateProfile({ online_status: status });
    if (result.success) refreshProfile();
    else showToast(result.message, "error");
  };

  /* ── Sub price ── */
  const handleSavePrice = async () => {
    setSavingPrice(true);
    const price = parseInt(priceInput) || 0;
    const result = await updateProfile({ subscription_price: price > 0 ? price : null });
    if (result.success) {
      showToast("Price updated!", "success");
      refreshProfile();
      setEditingPrice(false);
    } else {
      showToast(result.message, "error");
    }
    setSavingPrice(false);
  };

  /* ── Delete post ── */
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const result = await deletePost(postId);
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setPostCount((c) => c - 1);
      showToast("Post deleted", "success");
    } else {
      showToast(result.message, "error");
    }
  };

  /* ── Copy link ── */
  const copyProfileLink = () => {
    const link = `vaulty.com/@${profile?.username ?? ""}`;
    navigator.clipboard
      .writeText(`https://${link}`)
      .then(() => showToast("Link copied!", "success"))
      .catch(() => showToast(`https://${link}`, "info"));
  };

  /* ── Derived values ── */
  const displayName = profile?.display_name ?? "User";
  const username = profile?.username ?? "";
  const bio = profile?.bio ?? "";
  const initials = getInitials(displayName);
  const onlineStatus = profile?.online_status ?? "available";
  const subPrice = profile?.subscription_price;

  const getMediaUrl = (storagePath: string) =>
    `${R2_PUBLIC_URL}/${storagePath}`;

  const visibilityStyle = (v: string) => {
    if (v === "free") return { background: "var(--success-dim)", color: "var(--success)" };
    if (v === "premium") return { background: "var(--pink-dim)", color: "var(--pink)" };
    if (v === "ppv") return { background: "var(--warning-dim)", color: "var(--warning)" };
    return {};
  };

  // All media items across posts
  const allMedia = posts.flatMap((p) =>
    (p.media ?? []).map((m) => ({ ...m, postVisibility: p.visibility }))
  );

  return (
    <div className={s.mpPageWrap}>
      {/* Hidden file inputs */}
      <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropBannerFile(f); e.target.value = ""; }} />
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ""; }} />

      {/* ═══ Profile Card ═══ */}
      <div className={s.mpCard}>
        {/* Banner */}
        <div className={s.mpBanner} onClick={() => bannerInputRef.current?.click()}>
          {profile?.banner_url && <img src={profile.banner_url} alt="" />}
          <div className={s.mpBannerOverlay}>
            <button className={s.mpBannerBtn} onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            {profile?.banner_url && (
              <button className={s.mpBannerBtn} onClick={(e) => { e.stopPropagation(); handleRemoveBanner(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Profile Section */}
        <div className={s.mpProfileSection}>
          <div className={s.mpProfileRow}>
            {/* Avatar */}
            <div className={s.mpAvatarWrap} onClick={() => avatarInputRef.current?.click()}>
              <div className={s.mpAvatar}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initials}
              </div>
              <div className={s.mpAvatarCam}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <div className={`${s.mpOnlineDot} ${onlineStatus === "available" ? s.mpOnlineDotAvailable : s.mpOnlineDotInvisible}`} />
            </div>

            {/* Action buttons */}
            <div className={s.mpActions}>
              <a href="/dashboard/settings" className={s.mpEditBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </a>
              <div className={s.mpMoreWrap} ref={moreMenuRef}>
                <button className={s.mpMoreBtn} onClick={() => setShowMoreMenu(!showMoreMenu)}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                </button>
                {showMoreMenu && (
                  <div className={s.mpMoreDropdown}>
                    <button className={s.mpMoreOption} onClick={() => { copyProfileLink(); setShowMoreMenu(false); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                      Copy Profile Link
                    </button>
                    <button className={s.mpMoreOption} onClick={() => { setShowViewAs(true); setShowMoreMenu(false); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View Page As
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name + username */}
          <div className={s.mpName}>{displayName}</div>
          <div className={s.mpUsernameRow}>
            <span className={s.mpUsername}>@{username}</span>
            {/* Status dropdown */}
            <div className={s.mpStatusWrap} ref={statusRef}>
              <button
                className={`${s.mpStatusBtn} ${onlineStatus === "available" ? s.mpStatusBtnAvailable : s.mpStatusBtnInvisible}`}
                onClick={() => setShowStatusDD(!showStatusDD)}
              >
                <span className={s.mpStatusDot} style={{ background: onlineStatus === "available" ? "var(--success)" : "var(--muted)" }} />
                {onlineStatus === "available" ? "Available" : "Invisible"}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showStatusDD && (
                <div className={s.mpStatusDropdown}>
                  <button className={s.mpStatusOption} onClick={() => handleStatusChange("available")}>
                    <span className={s.mpStatusDot} style={{ background: "var(--success)" }} />
                    Available
                  </button>
                  <button className={s.mpStatusOption} onClick={() => handleStatusChange("invisible")}>
                    <span className={s.mpStatusDot} style={{ background: "var(--muted)" }} />
                    Invisible
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className={s.mpUrl}>vaulty.com/@{username}</div>

          {/* Bio */}
          {bio && <div className={s.mpBio}>{bio}</div>}

          {/* Stats */}
          <div className={s.mpStats}>
            <div className={s.mpStatItem}>{subCount.toLocaleString()} <span>subscribers</span></div>
            <div className={s.mpStatItem}>{postCount.toLocaleString()} <span>posts</span></div>
            <div className={s.mpStatItem}>{totalLikes.toLocaleString()} <span>likes</span></div>
          </div>

          {/* Subscription price card */}
          <div className={s.mpSubCard}>
            <div>
              <div className={s.mpSubLabel}>Subscription Price</div>
              {!editingPrice ? (
                <div className={s.mpSubPrice}>
                  {subPrice ? `${subPrice} credits/mo` : "Not set"}
                </div>
              ) : (
                <div className={s.mpSubEditRow}>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    min="1"
                    autoFocus
                  />
                  <span style={{ fontSize: "0.82rem", color: "var(--dim)" }}>credits/mo</span>
                </div>
              )}
            </div>
            {!editingPrice ? (
              <button
                className={s.mpEditBtn}
                onClick={() => { setPriceInput(subPrice?.toString() ?? ""); setEditingPrice(true); }}
                style={{ marginTop: 0 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <button className={s.btnSave} onClick={handleSavePrice} disabled={savingPrice} style={{ padding: "0.4rem 1rem", fontSize: "0.78rem" }}>
                  {savingPrice ? "..." : "Save"}
                </button>
                <button className={s.btnSecondary} onClick={() => setEditingPrice(false)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <div className={s.mpCard}>
        <div className={s.mpTabs}>
          <button className={`${s.mpTab} ${activeTab === "posts" ? s.mpTabActive : ""}`} onClick={() => setActiveTab("posts")}>
            Posts
          </button>
          <button className={`${s.mpTab} ${activeTab === "media" ? s.mpTabActive : ""}`} onClick={() => setActiveTab("media")}>
            Media
          </button>
        </div>

        <div style={{ padding: "0 1.25rem 1.25rem" }}>
          {/* ── Posts Feed ── */}
          {activeTab === "posts" && (
            loading ? (
              <div className={s.mpFeed}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={s.mpPost} style={{ padding: "1.25rem" }}>
                    <div style={{ height: 14, width: "50%", background: "var(--input-bg)", borderRadius: 8, marginBottom: 12 }} />
                    <div style={{ height: 12, width: "80%", background: "var(--input-bg)", borderRadius: 8, marginBottom: 8 }} />
                    <div style={{ height: 12, width: "30%", background: "var(--input-bg)", borderRadius: 8 }} />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className={s.mpEmpty}>
                <div className={s.mpEmptyIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div className={s.mpEmptyTitle}>No posts yet</div>
                <div className={s.mpEmptyDesc}>Create your first post in the Content tab to start building your feed.</div>
              </div>
            ) : (
              <div className={s.mpFeed}>
                {posts.map((post) => {
                  const firstImg = post.media?.find((m) => m.media_type === "image");
                  const firstVid = post.media?.find((m) => m.media_type === "video");
                  const mediaItem = firstImg || firstVid;

                  return (
                    <div key={post.id} className={s.mpPost}>
                      {/* Post header */}
                      <div className={s.mpPostHeader}>
                        <div className={s.mpPostAvatar}>
                          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initials}
                        </div>
                        <div className={s.mpPostHeaderInfo}>
                          <div className={s.mpPostHeaderTop}>
                            <span className={s.mpPostHeaderName}>{displayName}</span>
                            <span className={s.mpPostHeaderUsername}>@{username}</span>
                          </div>
                        </div>
                        <span className={s.mpPostHeaderTime}>{timeAgo(post.created_at)}</span>
                      </div>

                      {/* Title */}
                      {post.title && <div className={s.mpPostTitle}>{post.title}</div>}

                      {/* Body */}
                      {post.body && <div className={s.mpPostBody}>{post.body}</div>}

                      {/* Media */}
                      {mediaItem && (
                        <div className={s.mpPostMedia}>
                          {mediaItem.media_type === "image" ? (
                            <img src={getMediaUrl(mediaItem.storage_path)} alt="" />
                          ) : (
                            <video src={getMediaUrl(mediaItem.storage_path)} controls style={{ width: "100%", maxHeight: 480 }} />
                          )}
                          <span className={s.mpPostVisibility} style={visibilityStyle(post.visibility)}>
                            {post.visibility === "ppv" ? `PPV · ${post.ppv_price} cr` : post.visibility}
                          </span>
                        </div>
                      )}

                      {/* Stats + Actions */}
                      <div className={s.mpPostStats}>
                        <span className={s.mpPostStat}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                          {post.like_count}
                        </span>
                        <span className={s.mpPostStat}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          {post.view_count}
                        </span>
                        <span className={s.mpPostStat}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                          {post.comment_count}
                        </span>

                        <div className={s.mpPostActions}>
                          <button className={s.mpPostActionBtn} onClick={() => showToast("Edit post in Content tab", "info")}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                          </button>
                          <button className={`${s.mpPostActionBtn} ${s.mpPostActionBtnDel}`} onClick={() => handleDeletePost(post.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── Media Grid ── */}
          {activeTab === "media" && (
            allMedia.length === 0 ? (
              <div className={s.mpEmpty}>
                <div className={s.mpEmptyIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div className={s.mpEmptyTitle}>No media yet</div>
                <div className={s.mpEmptyDesc}>Upload images or videos when creating posts.</div>
              </div>
            ) : (
              <div className={s.mpMediaGrid}>
                {allMedia.map((m) => (
                  <div key={m.id} className={s.mpMediaThumb}>
                    {m.media_type === "image" ? (
                      <img src={getMediaUrl(m.storage_path)} alt="" />
                    ) : (
                      <>
                        <video src={getMediaUrl(m.storage_path)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div className={s.mpMediaThumbVideo}>
                          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      </>
                    )}
                    <span className={s.mpMediaThumbBadge} style={visibilityStyle(m.postVisibility)}>
                      {m.postVisibility}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ═══ Profile Link ═══ */}
      <div className={s.profileLinkCard}>
        <input type="text" className={s.profileLinkUrl} value={`vaulty.com/@${username}`} readOnly />
        <button className={s.copyBtn} onClick={copyProfileLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          Copy
        </button>
      </div>

      {/* ═══ Avatar Crop Modal ═══ */}
      {cropFile && (
        <AvatarCropModal
          imageFile={cropFile}
          onCropComplete={handleCroppedAvatar}
          onClose={() => setCropFile(null)}
        />
      )}

      {/* ═══ Banner Crop Modal ═══ */}
      {cropBannerFile && (
        <BannerCropModal
          imageFile={cropBannerFile}
          onCropComplete={handleCroppedBanner}
          onClose={() => setCropBannerFile(null)}
        />
      )}

      {/* ═══ View Page As Modal ═══ */}
      {showViewAs && (
        <div className={s.modalOverlay} onClick={() => setShowViewAs(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 className={s.modalTitle} style={{ marginBottom: 0 }}>View Page As</h3>
              <button onClick={() => setShowViewAs(false)} style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", padding: 4 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className={s.modalDesc}>
              Preview your page as different user types to verify your content permissions are set as expected.
            </p>

            <div className={s.modalReasons}>
              <label className={`${s.modalReasonOption} ${viewAsRole === "free" ? s.modalReasonOptionActive : ""}`}>
                <input type="radio" name="viewAs" value="free" checked={viewAsRole === "free"} onChange={() => setViewAsRole("free")} />
                <span className={s.modalRadio} />
                Free User
              </label>
              <label className={`${s.modalReasonOption} ${viewAsRole === "subscriber" ? s.modalReasonOptionActive : ""}`}>
                <input type="radio" name="viewAs" value="subscriber" checked={viewAsRole === "subscriber"} onChange={() => setViewAsRole("subscriber")} />
                <span className={s.modalRadio} />
                Subscriber
              </label>
            </div>

            <div className={s.modalActions}>
              <button
                className={s.btnSave}
                onClick={() => {
                  window.open(`/creator-page/${username}?view_as=${viewAsRole}`, "_blank");
                  setShowViewAs(false);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
