"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { subscribe } from "@/lib/actions/subscriptions";
import { toggleLike } from "@/lib/actions/posts";
import { toggleBookmark } from "@/lib/actions/bookmarks";
import { addComment, getPostComments } from "@/lib/actions/comments";
import { sendTip, purchasePPV } from "@/lib/actions/credits";
import type {
  Profile,
  PostWithInteractions,
  AchievementBadge,
  CommentWithProfile,
} from "@/types/database";
import s from "./creator-page.module.css";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
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

function getMediaUrl(storagePath: string): string {
  if (storagePath.startsWith("r2:")) {
    return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${storagePath.slice(3)}`;
  }
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-media/${storagePath}`;
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

function visibilityStyle(v: string) {
  if (v === "free") return { background: "var(--success-dim)", color: "var(--success)" };
  if (v === "premium") return { background: "var(--pink-dim)", color: "var(--pink)" };
  if (v === "ppv") return { background: "var(--warning-dim)", color: "var(--warning)" };
  return {};
}

/* ── Main Component ── */

interface Props {
  creator: Profile;
  posts: PostWithInteractions[];
  badges: AchievementBadge[];
  subCount: number;
  postCount: number;
  totalLikes: number;
  hasSubscription: boolean;
  viewerId: string | null;
  viewMode?: "free" | "subscriber" | null;
}

export function CreatorPageClient({
  creator,
  posts: initialPosts,
  badges,
  subCount,
  postCount,
  totalLikes,
  hasSubscription,
  viewerId,
  viewMode,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [posts, setPosts] = useState(initialPosts);
  const [subscribing, setSubscribing] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  // Per-post states
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, CommentWithProfile[]>>({});
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [sendingComment, setSendingComment] = useState<Set<string>>(new Set());
  const [tipOpenFor, setTipOpenFor] = useState<string | null>(null);
  const [tipAmounts, setTipAmounts] = useState<Record<string, string>>({});
  const [sendingTip, setSendingTip] = useState(false);

  const [activeTab, setActiveTab] = useState<"posts" | "media">("posts");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initials = getInitials(creator.display_name);
  const isOwner = viewerId === creator.id;

  // Sort badges: verified always first when earned, then other earned, then unearned
  const sortedBadges = [...badges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    if (a.earned && b.earned && a.id === "verified") return -1;
    if (a.earned && b.earned && b.id === "verified") return 1;
    return 0;
  });

  // Star field animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w: number, h: number;
    let stars: { x: number; y: number; r: number; color: string; pulse: number; speed: number; vx: number; vy: number }[] = [];
    let animId: number;

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }

    function init() {
      stars = [];
      const count = Math.floor((w * h) / 10000);
      for (let i = 0; i < count; i++) {
        const isPink = Math.random() > 0.8;
        const isPurple = !isPink && Math.random() > 0.75;
        let color: string;
        if (isPink) color = `rgba(244,63,142,${0.3 + Math.random() * 0.5})`;
        else if (isPurple) color = `rgba(139,92,246,${0.2 + Math.random() * 0.5})`;
        else color = `rgba(255,255,255,${0.15 + Math.random() * 0.35})`;
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.8 + Math.random() * 2.2, color,
          pulse: Math.random() * Math.PI * 2,
          speed: 0.003 + Math.random() * 0.008,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const st of stars) {
        st.pulse += st.speed;
        st.x += st.vx; st.y += st.vy;
        if (st.x < -10) st.x = w + 10;
        if (st.x > w + 10) st.x = -10;
        if (st.y < -10) st.y = h + 10;
        if (st.y > h + 10) st.y = -10;
        ctx!.globalAlpha = 0.5 + Math.sin(st.pulse) * 0.35;
        ctx!.beginPath();
        ctx!.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx!.fillStyle = st.color;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    resize(); init(); draw();
    const onResize = () => { resize(); init(); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(animId); };
  }, []);

  const requireAuth = () => {
    if (!viewerId) {
      showToast("Please log in first.", "error");
      router.push("/login");
      return true;
    }
    return false;
  };

  /* ── Subscribe ── */
  const handleSubscribe = async () => {
    if (requireAuth()) return;
    setSubscribing(true);
    const result = await subscribe(creator.id);
    if (result.success) {
      showToast(result.message, "success");
      router.refresh();
    } else {
      showToast(result.message, "error");
    }
    setSubscribing(false);
  };

  /* ── Like ── */
  const handleLike = async (postId: string) => {
    if (requireAuth()) return;
    // Optimistic
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked: !p.is_liked,
              like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1,
            }
          : p
      )
    );
    const result = await toggleLike(postId);
    if (!result.success) {
      // Revert
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked: !p.is_liked,
                like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1,
              }
            : p
        )
      );
    }
  };

  /* ── Bookmark ── */
  const handleBookmark = async (postId: string) => {
    if (requireAuth()) return;
    // Optimistic
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, is_bookmarked: !p.is_bookmarked } : p
      )
    );
    const result = await toggleBookmark(postId);
    if (!result.success) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_bookmarked: !p.is_bookmarked } : p
        )
      );
    }
  };

  /* ── Comments ── */
  const toggleComments = async (postId: string) => {
    const next = new Set(expandedComments);
    if (next.has(postId)) {
      next.delete(postId);
    } else {
      next.add(postId);
      // Load comments if not loaded
      if (!postComments[postId]) {
        setLoadingComments((prev) => new Set(prev).add(postId));
        const comments = await getPostComments(postId);
        setPostComments((prev) => ({ ...prev, [postId]: comments }));
        setLoadingComments((prev) => {
          const n = new Set(prev);
          n.delete(postId);
          return n;
        });
      }
    }
    setExpandedComments(next);
  };

  const handleAddComment = async (postId: string) => {
    if (requireAuth()) return;
    const body = (commentTexts[postId] ?? "").trim();
    if (!body) return;
    setSendingComment((prev) => new Set(prev).add(postId));
    const result = await addComment(postId, body);
    if (result.success) {
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      // Refresh comments
      const comments = await getPostComments(postId);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
      // Increment count
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
        )
      );
    } else {
      showToast(result.message, "error");
    }
    setSendingComment((prev) => {
      const n = new Set(prev);
      n.delete(postId);
      return n;
    });
  };

  /* ── Tip ── */
  const handleTip = async (postId: string) => {
    if (requireAuth()) return;
    const amount = parseInt(tipAmounts[postId] ?? "");
    if (!amount || amount <= 0) {
      showToast("Enter a valid amount.", "error");
      return;
    }
    setSendingTip(true);
    const result = await sendTip(creator.id, amount);
    if (result.success) {
      showToast(result.message, "success");
      setTipAmounts((prev) => ({ ...prev, [postId]: "" }));
      setTipOpenFor(null);
    } else {
      showToast(result.message, "error");
    }
    setSendingTip(false);
  };

  /* ── Unlock PPV ── */
  const handleUnlockPPV = async (postId: string) => {
    if (requireAuth()) return;
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

  // All media items across posts (for Media tab)
  const allMedia = posts
    .filter((p) => p.access_level === "full")
    .flatMap((p) =>
      (p.media ?? []).map((m) => ({ ...m, postVisibility: p.visibility }))
    );

  return (
    <div className={s.page}>
      {/* Star Field */}
      <div className={s.starField}><canvas ref={canvasRef} /></div>

      {/* Top Nav */}
      <nav className={s.topNav}>
        <Link href="/" className={s.topNavLogo}>
          <div className={s.topNavLogoIcon}>
            <div className={s.topNavLogoVault}>
              <div className={s.sp} style={{ transform: "rotate(0deg)" }} />
              <div className={s.sp} style={{ transform: "rotate(90deg)" }} />
              <div className={s.sp} style={{ transform: "rotate(45deg)" }} />
              <div className={s.sp} style={{ transform: "rotate(135deg)" }} />
            </div>
          </div>
          <span className={s.topNavLogoText}>Vaulty</span>
        </Link>
        <div className={s.topNavEnd}>
          <button className={s.topNavLang}>FR</button>
          <Link href={viewerId ? "/dashboard" : "/login"} className={s.topNavUserBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* View Mode Banner */}
      {viewMode && (
        <div className={s.viewModeBanner}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, flexShrink: 0 }}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          Viewing as {viewMode === "free" ? "Free User" : "Subscriber"}
          <button onClick={() => window.close()} className={s.viewModeBannerClose}>Exit Preview</button>
        </div>
      )}

      {/* ═══ Content Container - 1050px max (inline style to guarantee) ═══ */}
      <div style={{ maxWidth: 1050, margin: "0 auto", padding: "1.5rem 1rem 0", boxSizing: "border-box" as const }}>

        {/* ═══ Profile Card Box ═══ */}
        <div className={s.cardBox}>
          {/* Banner (inside card) */}
          <div className={s.banner}>
            {creator.banner_url && <img src={creator.banner_url} alt="" />}
            {creator.category === "18+" && (
              <span className={s.nsfwBadge}>18+</span>
            )}
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

              {/* Action Icons (visible to non-owners) */}
              {!isOwner && (
                <div className={s.profileActions}>
                  <button
                    className={s.profileActionBtn}
                    title="Send Tip"
                    onClick={() => {
                      if (requireAuth()) return;
                      if (posts.length > 0) {
                        setTipOpenFor(posts[0].id);
                        document.querySelector(`.${s.feed}`)?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                  </button>
                  <button
                    className={s.profileActionBtn}
                    title="Send Message"
                    onClick={() => showToast("Messaging coming soon", "info")}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </button>
                  <button
                    className={s.profileActionBtn}
                    title="Add to Favorites"
                    onClick={() => showToast("Favorites coming soon", "info")}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                  <button
                    className={s.profileActionBtn}
                    title="Share Profile"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/@${creator.username}`);
                      showToast("Profile link copied!", "success");
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className={s.nameRow}>
              <div className={s.displayName}>{creator.display_name}</div>
              {creator.is_verified && (
                <svg className={s.verifiedBadge} viewBox="0 0 24 24" fill="var(--purple)" stroke="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path d="M9 12l2 2 4-4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            <div className={s.username}>@{creator.username}</div>
            <div className={s.profileUrl}>vaulty.com/@{creator.username}</div>

            {/* Achievement Badges */}
            {sortedBadges.length > 0 && (
              <div className={s.badgesRow}>
                {sortedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`${s.badge} ${badge.earned ? (badge.id === "verified" ? s.badgeVerified : s.badgeEarned) : s.badgeGray}`}
                    title={badge.description}
                  >
                    <BadgeIcon icon={badge.icon} />
                    {badge.name}
                  </div>
                ))}
              </div>
            )}

            {creator.bio && <div className={s.bio}>{creator.bio}</div>}

            <div className={s.statsRow}>
              <div className={s.statItem}>
                {subCount.toLocaleString()} <span>subscribers</span>
              </div>
              <div className={s.statItem}>
                {postCount.toLocaleString()} <span>posts</span>
              </div>
              <div className={s.statItem}>
                {totalLikes.toLocaleString()} <span>likes</span>
              </div>
            </div>

            {/* Subscribe Card */}
            {!isOwner && creator.subscription_price && (
              <div className={s.subscribeCard}>
                <div>
                  <div className={s.subscribePrice}>
                    {creator.subscription_price} credits/mo
                  </div>
                  <div className={s.subscribeInfo}>
                    Unlock all premium content
                  </div>
                </div>
                {hasSubscription ? (
                  <div className={s.subscribedLabel}>Subscribed</div>
                ) : (
                  <button
                    className={s.subscribeBtn}
                    onClick={handleSubscribe}
                    disabled={subscribing}
                  >
                    {subscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Feed Card Box ═══ */}
        <div className={s.cardBox}>
          {/* Tabs */}
          <div className={s.tabs}>
            <button
              className={`${s.tab} ${activeTab === "posts" ? s.tabActive : ""}`}
              onClick={() => setActiveTab("posts")}
            >
              Posts
            </button>
            <button
              className={`${s.tab} ${activeTab === "media" ? s.tabActive : ""}`}
              onClick={() => setActiveTab("media")}
            >
              Media
            </button>
          </div>

          <div className={s.feedInner}>
            {/* Posts Feed */}
            {activeTab === "posts" && (
              posts.length === 0 ? (
                <div className={s.emptyFeed}>
                  <div className={s.emptyIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <div className={s.emptyTitle}>No posts yet</div>
                  <div className={s.emptyDesc}>This creator hasn&apos;t published any posts yet.</div>
                </div>
              ) : (
                <div className={s.feed}>
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      creator={creator}
                      isOwner={isOwner}
                      hasSubscription={hasSubscription}
                      onLike={handleLike}
                      onBookmark={handleBookmark}
                      onToggleComments={toggleComments}
                      onAddComment={handleAddComment}
                      onTip={handleTip}
                      onUnlock={handleUnlockPPV}
                      unlocking={unlocking}
                      expandedComments={expandedComments}
                      commentTexts={commentTexts}
                      setCommentTexts={setCommentTexts}
                      postComments={postComments}
                      loadingComments={loadingComments}
                      sendingComment={sendingComment}
                      tipOpenFor={tipOpenFor}
                      setTipOpenFor={setTipOpenFor}
                      tipAmounts={tipAmounts}
                      setTipAmounts={setTipAmounts}
                      sendingTip={sendingTip}
                    />
                  ))}
                </div>
              )
            )}

            {/* Media Grid */}
            {activeTab === "media" && (
              allMedia.length === 0 ? (
                <div className={s.emptyFeed}>
                  <div className={s.emptyIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <div className={s.emptyTitle}>No media yet</div>
                  <div className={s.emptyDesc}>No viewable media content available.</div>
                </div>
              ) : (
                <div className={s.mediaGrid}>
                  {allMedia.map((m) => (
                    <div key={m.id} className={s.mediaThumb}>
                      {m.media_type === "image" ? (
                        <img src={getMediaUrl(m.storage_path)} alt="" />
                      ) : (
                        <>
                          <video src={getMediaUrl(m.storage_path)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div className={s.mediaThumbVideo}>
                            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          </div>
                        </>
                      )}
                      <span className={s.mediaThumbBadge} style={visibilityStyle(m.postVisibility)}>
                        {m.postVisibility}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

      </div>{/* end 1050px container */}
    </div>
  );
}

/* ══════ Video Player Component ══════ */

function VideoPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (playing) {
    return (
      <video
        ref={videoRef}
        src={src}
        controls
        autoPlay
        className={s.postMediaImage}
        style={{ maxHeight: 560 }}
      />
    );
  }

  return (
    <div className={s.videoPreview} onClick={() => setPlaying(true)}>
      <video
        src={src}
        preload="metadata"
        muted
        className={s.postMediaImage}
        style={{ maxHeight: 560 }}
      />
      <div className={s.videoPlayOverlay}>
        <div className={s.videoPlayBtn}>
          <svg viewBox="0 0 24 24" fill="#fff" stroke="none">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ══════ Post Card Component ══════ */

function PostCard({
  post,
  creator,
  isOwner,
  onLike,
  onBookmark,
  onToggleComments,
  onAddComment,
  onTip,
  onUnlock,
  unlocking,
  expandedComments,
  commentTexts,
  setCommentTexts,
  postComments,
  loadingComments,
  sendingComment,
  tipOpenFor,
  setTipOpenFor,
  tipAmounts,
  setTipAmounts,
  sendingTip,
}: {
  post: PostWithInteractions;
  creator: Profile;
  isOwner: boolean;
  hasSubscription: boolean;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onToggleComments: (id: string) => void;
  onAddComment: (id: string) => void;
  onTip: (id: string) => void;
  onUnlock: (id: string) => void;
  unlocking: string | null;
  expandedComments: Set<string>;
  commentTexts: Record<string, string>;
  setCommentTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  postComments: Record<string, CommentWithProfile[]>;
  loadingComments: Set<string>;
  sendingComment: Set<string>;
  tipOpenFor: string | null;
  setTipOpenFor: React.Dispatch<React.SetStateAction<string | null>>;
  tipAmounts: Record<string, string>;
  setTipAmounts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendingTip: boolean;
}) {
  const initials = getInitials(creator.display_name);
  const isBlurred = post.access_level === "blur";
  const hasMedia = post.media.length > 0;
  const isExpanded = expandedComments.has(post.id);
  const comments = postComments[post.id] ?? [];
  const isLoadingComments = loadingComments.has(post.id);
  const isSendingComment = sendingComment.has(post.id);
  const [showMenu, setShowMenu] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  return (
    <div className={s.postCard}>
      {/* Lightbox */}
      {lightboxSrc && (
        <div className={s.lightboxOverlay} onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="" className={s.lightboxImage} onClick={(e) => e.stopPropagation()} />
          <button className={s.lightboxClose} onClick={() => setLightboxSrc(null)}>&times;</button>
        </div>
      )}

      {/* Header */}
      <div className={s.postHeader}>
        <div className={s.postAvatar}>
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt="" />
          ) : (
            initials
          )}
        </div>
        <div className={s.postHeaderInfo}>
          <div className={s.postHeaderName}>{creator.display_name}</div>
          <div className={s.postHeaderUsername}>@{creator.username}</div>
        </div>
        <div className={s.postHeaderRight}>
          {post.is_pinned && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: "0.68rem", fontWeight: 700, color: "var(--pink)",
              textTransform: "uppercase", letterSpacing: "0.03em",
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 10, height: 10 }}>
                <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" />
              </svg>
              Pinned
            </span>
          )}
          <span className={s.postHeaderTime}>{timeAgo(post.created_at)}</span>
          <div className={s.postMenuWrap} ref={menuRef}>
            <button className={s.postMenuBtn} onClick={() => setShowMenu(!showMenu)}>
              &middot;&middot;&middot;
            </button>
            {showMenu && (
              <div className={s.postMenuDropdown}>
                <button className={s.postMenuItem} onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/@${creator.username}`);
                  setShowMenu(false);
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  Copy link to post
                </button>
                <button className={s.postMenuItem} onClick={() => setShowMenu(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                  Add to bookmarks
                </button>
                <button className={s.postMenuItem} onClick={() => setShowMenu(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  I don&apos;t like this post
                </button>
                <button className={s.postMenuItemDanger} onClick={() => setShowMenu(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      {post.title && <div className={s.postTitle}>{post.title}</div>}

      {/* Body */}
      {post.body && (
        <div className={s.postBody}>
          {isBlurred && post.body.length > 100
            ? post.body.slice(0, 100) + "..."
            : post.body}
        </div>
      )}

      {/* PPV Badge */}
      {post.visibility === "ppv" && post.ppv_price && isBlurred && (
        <div className={s.ppvBadge}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Pay-Per-View &middot; {post.ppv_price} credits
        </div>
      )}

      {/* Media */}
      {hasMedia && (
        <div className={s.postMedia}>
          {isBlurred ? (
            <div className={s.blurWrap}>
              <div className={s.blurContent}>
                <img
                  src={getMediaUrl(post.media[0].storage_path)}
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
                      const el = document.querySelector(`.${s.subscribeCard}`);
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    View Plans
                  </button>
                )}
              </div>
            </div>
          ) : (
            post.media.map((m) => {
              const url = getMediaUrl(m.storage_path);
              return m.media_type === "video" ? (
                <div key={m.id} className={s.mediaWrap}>
                  <VideoPlayer src={url} />
                  <span className={s.postVisibilityBadge} style={visibilityStyle(post.visibility)}>
                    {post.visibility === "ppv" ? `PPV · ${post.ppv_price} cr` : post.visibility}
                  </span>
                </div>
              ) : (
                <div key={m.id} className={s.mediaWrap}>
                  <img
                    src={url}
                    alt=""
                    className={s.postMediaImageClickable}
                    onClick={() => setLightboxSrc(url)}
                  />
                  <span className={s.postVisibilityBadge} style={visibilityStyle(post.visibility)}>
                    {post.visibility === "ppv" ? `PPV · ${post.ppv_price} cr` : post.visibility}
                  </span>
                  <div className={s.watermark}>Vaulty.com/{creator.username}</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className={s.actionBar}>
        {/* Like */}
        <button
          className={post.is_liked ? s.actionBtnActive : s.actionBtn}
          onClick={() => onLike(post.id)}
        >
          <svg viewBox="0 0 24 24" fill={post.is_liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          {post.like_count > 0 && post.like_count}
        </button>

        {/* Comment */}
        <button
          className={isExpanded ? s.actionBtnActive : s.actionBtn}
          onClick={() => onToggleComments(post.id)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          {post.comment_count > 0 && post.comment_count}
        </button>

        {/* Tip */}
        {!isOwner && (
          <button
            className={tipOpenFor === post.id ? s.actionBtnActive : s.actionBtn}
            onClick={() =>
              setTipOpenFor(tipOpenFor === post.id ? null : post.id)
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            Tip
          </button>
        )}

        {/* Bookmark */}
        <button
          className={
            post.is_bookmarked ? s.actionBtnBookmarkActive : s.actionBtnBookmark
          }
          onClick={() => onBookmark(post.id)}
        >
          <svg viewBox="0 0 24 24" fill={post.is_bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </button>
      </div>

      {/* Tip Inline */}
      {tipOpenFor === post.id && (
        <div style={{ padding: "0 1.25rem 0.75rem" }}>
          <div className={s.tipInline}>
            <input
              type="number"
              className={s.tipInlineInput}
              placeholder="Amount"
              min="1"
              value={tipAmounts[post.id] ?? ""}
              onChange={(e) =>
                setTipAmounts((prev) => ({ ...prev, [post.id]: e.target.value }))
              }
            />
            <button
              className={s.tipInlineSend}
              onClick={() => onTip(post.id)}
              disabled={sendingTip}
            >
              {sendingTip ? "..." : "Send Tip"}
            </button>
          </div>
        </div>
      )}

      {/* Comment Section */}
      {isExpanded && (
        <div className={s.commentSection}>
          {isLoadingComments ? (
            <div style={{ fontSize: "0.82rem", color: "var(--muted)", padding: "0.5rem 0" }}>
              Loading comments...
            </div>
          ) : (
            <>
              {comments.length > 0 && (
                <div className={s.commentList}>
                  {comments.map((c) => (
                    <div key={c.id} className={s.commentItem}>
                      <div className={s.commentAvatar}>
                        {c.profile?.avatar_url ? (
                          <img src={c.profile.avatar_url} alt="" />
                        ) : (
                          getInitials(c.profile?.display_name ?? "?")
                        )}
                      </div>
                      <div className={s.commentContent}>
                        <div className={s.commentName}>
                          {c.profile?.display_name ?? "User"}
                          <span>{timeAgo(c.created_at)}</span>
                        </div>
                        <div className={s.commentBody}>{c.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className={s.commentInputRow}>
                <input
                  className={s.commentInput}
                  placeholder="Add a comment..."
                  value={commentTexts[post.id] ?? ""}
                  onChange={(e) =>
                    setCommentTexts((prev) => ({
                      ...prev,
                      [post.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onAddComment(post.id);
                    }
                  }}
                />
                <button
                  className={s.commentSendBtn}
                  onClick={() => onAddComment(post.id)}
                  disabled={
                    isSendingComment || !(commentTexts[post.id] ?? "").trim()
                  }
                >
                  {isSendingComment ? "..." : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
