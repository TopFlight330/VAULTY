"use client";

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getMyPageData, updateProfile, uploadAndSetAvatar, uploadAndSetBanner } from "@/lib/actions/profile";
import { deletePost } from "@/lib/actions/posts";
import { getCreatorBadges } from "@/lib/helpers/badges";
import { AvatarCropModal } from "@/components/dashboard/shared/AvatarCropModal";
import { BannerCropModal } from "@/components/dashboard/shared/BannerCropModal";
import { ProfileCard } from "@/components/shared/ProfileCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { PostWithMedia, Profile } from "@/types/database";
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
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export default function MyPagePage() {
  return (
    <Suspense fallback={null}>
      <MyPageContent />
    </Suspense>
  );
}

function MyPageContent() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [posts, setPosts] = useState<PostWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [subCount, setSubCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  // Tabs
  const [activeTab, setActiveTab] = useState<"posts" | "media">("posts");

  // View Page As modal
  const [showViewAs, setShowViewAs] = useState(false);
  const [viewAsRole, setViewAsRole] = useState<"free" | "subscriber">("free");

  // Sidebar-triggered modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subModalInput, setSubModalInput] = useState("");
  const [subModalSaving, setSubModalSaving] = useState(false);

  // File inputs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Crop modals
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropBannerFile, setCropBannerFile] = useState<File | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<PostWithMedia | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // Handle sidebar submenu modal triggers
  useEffect(() => {
    const modal = searchParams.get("modal");
    if (!modal) return;
    // Clear the param immediately
    router.replace("/dashboard/my-page", { scroll: false });

    switch (modal) {
      case "status":
        setShowStatusModal(true);
        break;
      case "edit-profile":
        router.push("/dashboard/settings");
        break;
      case "options":
        setShowOptionsModal(true);
        break;
      case "subscription":
        setSubModalInput(profile?.subscription_price?.toString() ?? "");
        setShowSubModal(true);
        break;
      case "avatar":
        avatarInputRef.current?.click();
        break;
      case "banner":
        bannerInputRef.current?.click();
        break;
    }
  }, [searchParams, router, profile?.subscription_price]);

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

  /* ── Status ── */
  const handleStatusChange = async (status: "available" | "invisible") => {
    const result = await updateProfile({ online_status: status });
    if (result.success) refreshProfile();
    else showToast(result.message, "error");
  };

  /* ── Sub price modal ── */
  const handleSaveSubModal = async () => {
    setSubModalSaving(true);
    const price = parseInt(subModalInput) || 0;
    const result = await updateProfile({ subscription_price: price > 0 ? price : null });
    if (result.success) {
      showToast("Price updated!", "success");
      refreshProfile();
      setShowSubModal(false);
    } else {
      showToast(result.message, "error");
    }
    setSubModalSaving(false);
  };

  /* ── Delete post ── */
  const handleDeletePost = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deletePost(deleteTarget.id);
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setPostCount((c) => c - 1);
      showToast("Post deleted", "success");
    } else {
      showToast(result.message, "error");
    }
    setDeleteTarget(null);
    setDeleting(false);
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
  const initials = getInitials(displayName);
  const onlineStatus = profile?.online_status ?? "available";

  const getMediaUrl = (storagePath: string) => {
    if (storagePath.startsWith("r2:")) {
      return `${R2_PUBLIC_URL}/${storagePath.slice(3)}`;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/post-media/${storagePath}`;
  };

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

  // Compute badges & media counts for ProfileCard
  const photoCount = posts.reduce((sum, p) => sum + (p.media ?? []).filter((m) => m.media_type === "image").length, 0);
  const videoCount = posts.reduce((sum, p) => sum + (p.media ?? []).filter((m) => m.media_type === "video").length, 0);
  const lastPostAt = posts.length > 0 ? posts[0].created_at : null;
  const badges = useMemo(() => {
    if (!profile) return [];
    return getCreatorBadges(
      profile as Profile,
      { subscribers: subCount, posts: postCount, totalLikes },
      lastPostAt
    );
  }, [profile, subCount, postCount, totalLikes, lastPostAt]);

  return (
    <div className={s.mpPageWrap}>
      {/* Hidden file inputs */}
      <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropBannerFile(f); e.target.value = ""; }} />
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ""; }} />

      {/* ═══ Profile Card (shared with creator page) ═══ */}
      {profile && (
        <ProfileCard
          creator={profile as Profile}
          badges={badges}
          totalLikes={totalLikes}
          photoCount={photoCount}
          videoCount={videoCount}
          isOwner={true}
        />
      )}

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

                      {/* Body */}
                      {(post.body || post.title) && <div className={s.mpPostBody}>{post.body || post.title}</div>}

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
                          <button className={`${s.mpPostActionBtn} ${s.mpPostActionBtnDel}`} onClick={() => setDeleteTarget(post)}>
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

      {/* ═══ Delete Confirmation ═══ */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Post"
        message={`Delete "${deleteTarget?.title ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleting}
      />

      {/* ═══ Status Modal ═══ */}
      {showStatusModal && (
        <div className={s.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 className={s.modalTitle} style={{ marginBottom: 0 }}>Online Status</h3>
              <button onClick={() => setShowStatusModal(false)} style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", padding: 4 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className={s.modalDesc}>Choose your online visibility status.</p>
            <div className={s.modalReasons}>
              <label
                className={`${s.modalReasonOption} ${onlineStatus === "available" ? s.modalReasonOptionActive : ""}`}
                onClick={async () => { await handleStatusChange("available"); setShowStatusModal(false); }}
              >
                <span className={s.mpStatusDot} style={{ background: "var(--success)", width: 10, height: 10, borderRadius: "50%", flexShrink: 0 }} />
                Available
              </label>
              <label
                className={`${s.modalReasonOption} ${onlineStatus === "invisible" ? s.modalReasonOptionActive : ""}`}
                onClick={async () => { await handleStatusChange("invisible"); setShowStatusModal(false); }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--muted)", flexShrink: 0 }} />
                Invisible
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Options Modal ═══ */}
      {showOptionsModal && (
        <div className={s.modalOverlay} onClick={() => setShowOptionsModal(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 className={s.modalTitle} style={{ marginBottom: 0 }}>Options</h3>
              <button onClick={() => setShowOptionsModal(false)} style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", padding: 4 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={s.modalReasons}>
              <div
                className={s.modalReasonOption}
                onClick={() => { copyProfileLink(); setShowOptionsModal(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Copy Profile Link
              </div>
              <div
                className={s.modalReasonOption}
                onClick={() => { setShowOptionsModal(false); setShowViewAs(true); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View Page As
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Subscription Modal ═══ */}
      {showSubModal && (
        <div className={s.modalOverlay} onClick={() => setShowSubModal(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 className={s.modalTitle} style={{ marginBottom: 0 }}>Subscription Price</h3>
              <button onClick={() => setShowSubModal(false)} style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", padding: 4 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className={s.modalDesc}>Set the monthly subscription price for your page. Leave empty to remove the price.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
              <input
                type="number"
                className={s.formInput}
                placeholder="e.g. 150"
                value={subModalInput}
                onChange={(e) => setSubModalInput(e.target.value)}
                min="1"
                autoFocus
              />
              <span style={{ fontSize: "0.85rem", color: "var(--dim)", whiteSpace: "nowrap" }}>credits/mo</span>
            </div>
            <div className={s.modalActions}>
              <button className={s.btnSecondary} onClick={() => setShowSubModal(false)}>Cancel</button>
              <button className={s.btnSave} onClick={handleSaveSubModal} disabled={subModalSaving}>
                {subModalSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
