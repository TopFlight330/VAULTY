"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LogoutButton } from "@/components/auth/LogoutButton";
import s from "./dashboard.module.css";

/* ══════ TYPES ══════ */
type ViewName =
  | "dashboard"
  | "content"
  | "subscribers"
  | "earnings"
  | "mypage"
  | "settings";

type Period = "month" | "last" | "all";

interface Post {
  id: number;
  title: string;
  date: string;
  visibility: "premium" | "free" | "ppv";
  likes: number;
  views: number;
}

interface Subscriber {
  name: string;
  handle: string;
  initials: string;
  tier: "premium" | "vip" | "basic";
  since: string;
  status: "active" | "expired";
}

interface EarningsEntry {
  subs: number;
  tips: number;
  ppv: number;
  total: number;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface Payout {
  date: string;
  amount: string;
  method: string;
  status: "completed" | "pending" | "processing";
}

interface Tier {
  name: string;
  price: number;
  unit: string;
  desc: string;
  featured: boolean;
}

/* ══════ MOCK DATA ══════ */
const initialPosts: Post[] = [
  { id: 1, title: "Behind the Scenes - Studio Session", date: "Feb 12, 2026", visibility: "premium", likes: 342, views: 1820 },
  { id: 2, title: "New Art Print Collection Reveal", date: "Feb 10, 2026", visibility: "free", likes: 891, views: 4230 },
  { id: 3, title: "Exclusive Tutorial: Light & Shadow", date: "Feb 8, 2026", visibility: "ppv", likes: 156, views: 620 },
  { id: 4, title: "Q&A Answers - January Edition", date: "Feb 5, 2026", visibility: "premium", likes: 274, views: 1340 },
  { id: 5, title: "My Creative Process Explained", date: "Feb 1, 2026", visibility: "free", likes: 1203, views: 6100 },
  { id: 6, title: "Premium Wallpaper Pack #12", date: "Jan 28, 2026", visibility: "ppv", likes: 89, views: 410 },
  { id: 7, title: "Day in My Life - Artist Edition", date: "Jan 24, 2026", visibility: "premium", likes: 467, views: 2100 },
  { id: 8, title: "Fan Art Showcase & Reactions", date: "Jan 20, 2026", visibility: "free", likes: 738, views: 3500 },
];

const mockSubscribers: Subscriber[] = [
  { name: "Alex Knight", handle: "@darknight99", initials: "AK", tier: "premium", since: "Feb 12, 2026", status: "active" },
  { name: "Luna Rivers", handle: "@luna_fan", initials: "LR", tier: "vip", since: "Jan 30, 2026", status: "active" },
  { name: "Maxwell Chen", handle: "@maxwellart", initials: "MC", tier: "basic", since: "Jan 25, 2026", status: "active" },
  { name: "Jessica Moore", handle: "@jess_xo", initials: "JM", tier: "premium", since: "Jan 18, 2026", status: "active" },
  { name: "Tyler Brooks", handle: "@cozygamer", initials: "TB", tier: "basic", since: "Jan 10, 2026", status: "active" },
  { name: "Mia Zhang", handle: "@miaz_design", initials: "MZ", tier: "vip", since: "Dec 28, 2025", status: "active" },
  { name: "Ryan Foster", handle: "@rfoster", initials: "RF", tier: "premium", since: "Dec 15, 2025", status: "active" },
  { name: "Natalie Dunn", handle: "@nat_dunn", initials: "ND", tier: "basic", since: "Dec 2, 2025", status: "expired" },
  { name: "Jake Williams", handle: "@jakew", initials: "JW", tier: "premium", since: "Nov 20, 2025", status: "expired" },
  { name: "Olivia Hart", handle: "@olivia_h", initials: "OH", tier: "basic", since: "Nov 5, 2025", status: "active" },
];

const earningsData: Record<Period, EarningsEntry> = {
  month: { subs: 2180, tips: 620, ppv: 440, total: 3240 },
  last: { subs: 1950, tips: 380, ppv: 310, total: 2640 },
  all: { subs: 8420, tips: 2140, ppv: 2280, total: 12840 },
};

const chartData: ChartPoint[] = [
  { label: "Sep", value: 1420 },
  { label: "Oct", value: 1780 },
  { label: "Nov", value: 2100 },
  { label: "Dec", value: 2340 },
  { label: "Jan", value: 2640 },
  { label: "Feb", value: 3240 },
];

const mockPayouts: Payout[] = [
  { date: "Feb 1, 2026", amount: "$2,640.00", method: "Bank (Chase **** 4829)", status: "completed" },
  { date: "Jan 1, 2026", amount: "$2,100.00", method: "Bank (Chase **** 4829)", status: "completed" },
  { date: "Dec 1, 2025", amount: "$1,780.00", method: "USDC Wallet", status: "completed" },
  { date: "Nov 1, 2025", amount: "$1,420.00", method: "Bank (Chase **** 4829)", status: "completed" },
  { date: "Oct 1, 2025", amount: "$1,050.00", method: "Bank (Chase **** 4829)", status: "completed" },
];

const mockTiers: Tier[] = [
  { name: "Basic", price: 50, unit: "credits/mo", desc: "Access to all free posts, community chat, and monthly Q&A sessions.", featured: false },
  { name: "Premium", price: 150, unit: "credits/mo", desc: "Everything in Basic plus exclusive behind-the-scenes content, tutorials, and early access to new releases.", featured: true },
  { name: "VIP", price: 350, unit: "credits/mo", desc: "Everything in Premium plus 1-on-1 messaging, custom art requests, and exclusive VIP-only drops.", featured: false },
];

/* ══════ COMPONENT ══════ */
export default function CreatorDashboardPage() {
  const { showToast } = useToast();

  /* ── State ── */
  const [activeView, setActiveView] = useState<ViewName>("dashboard");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState<Period>("month");
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  /* ── View switching ── */
  const switchView = useCallback((view: ViewName) => {
    setActiveView(view);
    setUserDropdownOpen(false);
  }, []);

  /* ── Post deletion ── */
  const handleDeletePost = useCallback(() => {
    if (!deleteTarget) return;
    setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    showToast("Post deleted", "success");
    setDeleteTarget(null);
  }, [deleteTarget, showToast]);

  /* ── Subscriber filter ── */
  const filteredSubscribers = subscriberSearch.trim()
    ? mockSubscribers.filter(
        (sub) =>
          sub.name.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
          sub.handle.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
          sub.tier.toLowerCase().includes(subscriberSearch.toLowerCase())
      )
    : mockSubscribers;

  /* ── Earnings helpers ── */
  const earningsForPeriod = earningsData[currentPeriod];
  const periodLabel =
    currentPeriod === "month"
      ? "This Month"
      : currentPeriod === "last"
        ? "Last Month"
        : "All Time";

  const maxChartValue = Math.max(...chartData.map((d) => d.value));

  /* ── Copy profile link ── */
  const copyProfileLink = useCallback(() => {
    navigator.clipboard
      .writeText("https://vaulty.com/@sophievalentine")
      .then(() => showToast("Profile link copied to clipboard", "success"))
      .catch(() => showToast("Profile link: https://vaulty.com/@sophievalentine", "info"));
  }, [showToast]);

  /* ── Visibility class helper ── */
  const visibilityClass = (v: string) => {
    if (v === "free") return s.contentVisibilityFree;
    if (v === "premium") return s.contentVisibilityPremium;
    if (v === "ppv") return s.contentVisibilityPpv;
    return "";
  };

  const tierBadgeClass = (tier: string) => {
    if (tier === "basic") return s.tierBadgeBasic;
    if (tier === "premium") return s.tierBadgePremium;
    if (tier === "vip") return s.tierBadgeVip;
    return "";
  };

  const statusBadgeClass = (status: string) => {
    if (status === "active") return s.statusBadgeActive;
    if (status === "expired") return s.statusBadgeExpired;
    return "";
  };

  const payoutStatusClass = (status: string) => {
    if (status === "completed") return s.payoutStatusCompleted;
    if (status === "pending") return s.payoutStatusPending;
    if (status === "processing") return s.payoutStatusProcessing;
    return "";
  };

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  /* ══════ RENDER ══════ */
  return (
    <>
      {/* ══════ TOPBAR ══════ */}
      <div className={s.topbar}>
        <Link href="/" className={s.topbarLogo}>
          <div className={s.topbarLogoIcon}>
            <div className={s.topbarLogoVault}>
              <div className={s.sp} />
              <div className={s.sp} />
              <div className={s.sp} />
              <div className={s.sp} />
            </div>
          </div>
          <span className={s.topbarLogoText}>Vaulty</span>
        </Link>

        <div className={s.topbarRight}>
          <button
            className={s.balancePill}
            onClick={() => switchView("earnings")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" /><path d="M12 6v2m0 8v2" /></svg>
            <span>$4,280.50</span>
          </button>

          <button
            className={s.notifBtn}
            onClick={() => showToast("Notifications coming soon", "info")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
            <span className={s.notifBadge}>5</span>
          </button>

          <div className={s.userMenu} ref={userMenuRef}>
            <button
              className={s.userMenuBtn}
              onClick={() => setUserDropdownOpen((o) => !o)}
            >
              <div className={s.userAvatarBtn}>SV</div>
              <span className={s.userNameTopbar}>Sophie</span>
            </button>
            <div
              className={`${s.userDropdown} ${userDropdownOpen ? s.userDropdownOpen : ""}`}
            >
              <div className={s.userDropdownHeader}>
                <div className={s.name}>Sophie Valentine</div>
                <div className={s.handle}>@sophievalentine</div>
              </div>
              <button
                className={s.userDropdownItem}
                onClick={() => { switchView("mypage"); setUserDropdownOpen(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                My Page
              </button>
              <button
                className={s.userDropdownItem}
                onClick={() => { switchView("settings"); setUserDropdownOpen(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                Settings
              </button>
              <div className={s.userDropdownSep} />
              <LogoutButton className={`${s.userDropdownItem} ${s.userDropdownItemDanger}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Log out
              </LogoutButton>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ SIDEBAR ══════ */}
      <div className={s.sidebar}>
        <div className={s.sidebarNav}>
          <div className={s.sidebarSectionLabel}>Creator</div>

          <button
            className={`${s.sidebarItem} ${activeView === "dashboard" ? s.sidebarItemActive : ""}`}
            onClick={() => switchView("dashboard")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            Dashboard
          </button>

          <button
            className={`${s.sidebarItem} ${activeView === "content" ? s.sidebarItemActive : ""}`}
            onClick={() => switchView("content")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            My Content
            <span className={s.sidebarBadge}>{posts.length}</span>
          </button>

          <button
            className={`${s.sidebarItem} ${activeView === "subscribers" ? s.sidebarItemActive : ""}`}
            onClick={() => switchView("subscribers")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
            Subscribers
          </button>

          <button
            className={`${s.sidebarItem} ${activeView === "earnings" ? s.sidebarItemActive : ""}`}
            onClick={() => switchView("earnings")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
            Earnings
          </button>

          <div className={s.sidebarSectionLabel}>Account</div>

          <button
            className={`${s.sidebarItem} ${activeView === "mypage" ? s.sidebarItemActive : ""}`}
            onClick={() => switchView("mypage")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            My Page
          </button>

          <button
            className={`${s.sidebarItem} ${activeView === "settings" ? s.sidebarItemActive : ""}`}
            onClick={() => switchView("settings")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
            Settings
          </button>
        </div>

        <div className={s.sidebarFooter}>
          <LogoutButton className={s.sidebarItem} >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--danger)" }}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            <span style={{ color: "var(--danger)" }}>Log out</span>
          </LogoutButton>
        </div>
      </div>

      {/* ══════ MAIN CONTENT ══════ */}
      <div className={s.main}>

        {/* ═══ DASHBOARD VIEW ═══ */}
        <div className={`${s.view} ${activeView === "dashboard" ? s.viewActive : ""}`}>
          <div className={s.viewHeader}>
            <h1 className={s.welcomeMsg}>Welcome back, <span className={s.gradText}>Sophie</span></h1>
            <p className={s.welcomeSub}>Here&apos;s what&apos;s happening with your page today.</p>
          </div>

          <div className={s.statCards}>
            <div className={s.statCard}>
              <div className={`${s.statCardIcon} ${s.statCardIconPink}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
              </div>
              <div className={s.statCardLabel}>Total Earnings</div>
              <div className={s.statCardValue}>$12,840</div>
              <div className={`${s.statCardChange} ${s.statCardChangeUp}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>
                +18.2% this month
              </div>
            </div>
            <div className={s.statCard}>
              <div className={`${s.statCardIcon} ${s.statCardIconPurple}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
              </div>
              <div className={s.statCardLabel}>Active Subscribers</div>
              <div className={s.statCardValue}>1,247</div>
              <div className={`${s.statCardChange} ${s.statCardChangeUp}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>
                +42 this week
              </div>
            </div>
            <div className={s.statCard}>
              <div className={`${s.statCardIcon} ${s.statCardIconGreen}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              </div>
              <div className={s.statCardLabel}>Content Posts</div>
              <div className={s.statCardValue}>186</div>
              <div className={`${s.statCardChange} ${s.statCardChangeUp}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>
                +3 this week
              </div>
            </div>
            <div className={s.statCard}>
              <div className={`${s.statCardIcon} ${s.statCardIconBlue}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
              </div>
              <div className={s.statCardLabel}>Tips Received</div>
              <div className={s.statCardValue}>$2,140</div>
              <div className={`${s.statCardChange} ${s.statCardChangeUp}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>
                +$320 this month
              </div>
            </div>
          </div>

          <div className={s.dashboardGrid}>
            <div className={s.activityCard}>
              <div className={s.cardTitle}>Recent Activity</div>
              <ul className={s.activityList}>
                <li className={`${s.activityItem} ${s.activityItemBorder}`}>
                  <span className={`${s.activityDot} ${s.activityDotSubscriber}`} />
                  <span className={s.activityText}><strong>@darknight99</strong> subscribed to your Premium tier</span>
                  <span className={s.activityTime}>2m ago</span>
                </li>
                <li className={`${s.activityItem} ${s.activityItemBorder}`}>
                  <span className={`${s.activityDot} ${s.activityDotTip}`} />
                  <span className={s.activityText}><strong>@luna_fan</strong> sent you a $25 tip</span>
                  <span className={s.activityTime}>18m ago</span>
                </li>
                <li className={`${s.activityItem} ${s.activityItemBorder}`}>
                  <span className={`${s.activityDot} ${s.activityDotMessage}`} />
                  <span className={s.activityText}><strong>@maxwellart</strong> sent you a message</span>
                  <span className={s.activityTime}>1h ago</span>
                </li>
                <li className={`${s.activityItem} ${s.activityItemBorder}`}>
                  <span className={`${s.activityDot} ${s.activityDotLike}`} />
                  <span className={s.activityText}><strong>@cozygamer</strong> liked your post &quot;BTS Shoot&quot;</span>
                  <span className={s.activityTime}>3h ago</span>
                </li>
                <li className={s.activityItem}>
                  <span className={`${s.activityDot} ${s.activityDotPpv}`} />
                  <span className={s.activityText}><strong>@jess_xo</strong> purchased your PPV content</span>
                  <span className={s.activityTime}>5h ago</span>
                </li>
              </ul>
            </div>

            <div className={s.actionsCard}>
              <div className={s.cardTitle}>Quick Actions</div>
              <div className={s.quickActions}>
                <button
                  className={`${s.actionBtn} ${s.actionBtnPrimary}`}
                  onClick={() => { switchView("content"); showToast("Create your new post", "info"); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  New Post
                  <span className={s.actionBtnArrow}>&rarr;</span>
                </button>
                <button
                  className={s.actionBtn}
                  onClick={() => switchView("mypage")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  View Page
                  <span className={s.actionBtnArrow}>&rarr;</span>
                </button>
                <button
                  className={s.actionBtn}
                  onClick={() => { switchView("earnings"); showToast("Withdraw available balance", "info"); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                  Withdraw
                  <span className={s.actionBtnArrow}>&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ CONTENT VIEW ═══ */}
        <div className={`${s.view} ${activeView === "content" ? s.viewActive : ""}`}>
          <div className={s.contentHeader}>
            <div className={s.viewHeader} style={{ marginBottom: 0 }}>
              <h1>My Content</h1>
              <p>Manage your posts, photos, and videos.</p>
            </div>
            <button
              className={s.btnGrad}
              onClick={() => showToast("Post editor coming soon", "info")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              New Post
            </button>
          </div>

          <div className={s.contentGrid}>
            {posts.map((post) => (
              <div key={post.id} className={s.contentPost}>
                <div className={s.contentThumb}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  <span className={`${s.contentVisibility} ${visibilityClass(post.visibility)}`}>
                    {post.visibility === "ppv" ? "PPV" : capitalize(post.visibility)}
                  </span>
                </div>
                <div className={s.contentBody}>
                  <div className={s.contentTitle}>{post.title}</div>
                  <div className={s.contentDate}>{post.date}</div>
                  <div className={s.contentStats}>
                    <span className={s.contentStat}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                      {post.likes.toLocaleString()}
                    </span>
                    <span className={s.contentStat}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      {post.views.toLocaleString()}
                    </span>
                  </div>
                  <div className={s.contentActions}>
                    <button
                      className={s.contentActionBtn}
                      onClick={() => showToast(`Editing: ${post.title}`, "info")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      Edit
                    </button>
                    <button
                      className={`${s.contentActionBtn} ${s.contentActionBtnDelete}`}
                      onClick={() => setDeleteTarget(post)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SUBSCRIBERS VIEW ═══ */}
        <div className={`${s.view} ${activeView === "subscribers" ? s.viewActive : ""}`}>
          <div className={s.viewHeader}>
            <h1>Subscribers</h1>
            <p>View and manage your subscriber base.</p>
          </div>

          <div className={s.subsHeader}>
            <div className={s.subsCount}>Total: <span className={s.gradText}>1,247</span> subscribers</div>
            <div className={s.subsSearch}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search subscribers..."
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={s.subsTableWrap}>
            <table className={s.subsTable}>
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Tier</th>
                  <th>Subscribed Since</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.handle}>
                    <td>
                      <div className={s.subUser}>
                        <div className={s.subAvatarSm}>{sub.initials}</div>
                        <div>
                          <div className={s.subUserName}>{sub.name}</div>
                          <div className={s.subUserHandle}>{sub.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${s.tierBadge} ${tierBadgeClass(sub.tier)}`}>
                        {capitalize(sub.tier)}
                      </span>
                    </td>
                    <td style={{ color: "var(--dim)" }}>{sub.since}</td>
                    <td>
                      <span className={`${s.statusBadge} ${statusBadgeClass(sub.status)}`}>
                        {capitalize(sub.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ EARNINGS VIEW ═══ */}
        <div className={`${s.view} ${activeView === "earnings" ? s.viewActive : ""}`}>
          <div className={s.viewHeader}>
            <h1>Earnings</h1>
            <p>Track your revenue and manage payouts.</p>
          </div>

          <div className={s.earningsBigCard}>
            <div className={s.earningsBigLabel}>Total Earnings (All Time)</div>
            <div className={s.earningsBigValue}>$12,840</div>
            <div className={s.earningsBigSub}>You keep <span>99%</span> of every dollar earned</div>
          </div>

          <div className={s.periodTabs}>
            {(["month", "last", "all"] as Period[]).map((period) => (
              <button
                key={period}
                className={`${s.periodTab} ${currentPeriod === period ? s.periodTabActive : ""}`}
                onClick={() => setCurrentPeriod(period)}
              >
                {period === "month" ? "This Month" : period === "last" ? "Last Month" : "All Time"}
              </button>
            ))}
          </div>

          <div className={s.earningsBreakdown}>
            <div className={s.breakdownCard}>
              <div className={s.breakdownLabel}>Subscriptions</div>
              <div className={s.breakdownValue}>${earningsForPeriod.subs.toLocaleString()}</div>
              <div className={s.breakdownPct}>{Math.round((earningsForPeriod.subs / earningsForPeriod.total) * 100)}% of {periodLabel.toLowerCase()} revenue</div>
            </div>
            <div className={s.breakdownCard}>
              <div className={s.breakdownLabel}>Tips</div>
              <div className={s.breakdownValue}>${earningsForPeriod.tips.toLocaleString()}</div>
              <div className={s.breakdownPct}>{Math.round((earningsForPeriod.tips / earningsForPeriod.total) * 100)}% of {periodLabel.toLowerCase()} revenue</div>
            </div>
            <div className={s.breakdownCard}>
              <div className={s.breakdownLabel}>PPV Content</div>
              <div className={s.breakdownValue}>${earningsForPeriod.ppv.toLocaleString()}</div>
              <div className={s.breakdownPct}>{Math.round((earningsForPeriod.ppv / earningsForPeriod.total) * 100)}% of {periodLabel.toLowerCase()} revenue</div>
            </div>
          </div>

          <div className={s.chartSection}>
            <div className={s.chartTitle}>Earnings - Last 6 Months</div>
            <div className={s.chartCard}>
              <div className={s.barChart}>
                {chartData.map((d) => {
                  const pct = Math.round((d.value / maxChartValue) * 100);
                  return (
                    <div key={d.label} className={s.barCol}>
                      <div className={s.barValue}>${d.value.toLocaleString()}</div>
                      <div
                        className={s.bar}
                        style={{ height: `${pct}%` }}
                        title={`$${d.value.toLocaleString()}`}
                      />
                      <div className={s.barLabel}>{d.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={s.withdrawCard}>
            <div className={s.withdrawInfo}>
              <div className={s.withdrawLabel}>Available Balance</div>
              <div className={`${s.withdrawAmount} ${s.gradText}`}>$4,280.50</div>
            </div>
            <button
              className={s.btnGrad}
              onClick={() => showToast("Withdrawal of $4,280.50 initiated", "success")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              Withdraw
            </button>
          </div>

          <div className={s.sectionTitle}>Payout History</div>
          <div className={s.payoutTableWrap}>
            <table className={s.payoutTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockPayouts.map((p) => (
                  <tr key={p.date}>
                    <td style={{ color: "var(--dim)" }}>{p.date}</td>
                    <td style={{ fontWeight: 800 }}>{p.amount}</td>
                    <td>{p.method}</td>
                    <td>
                      <span className={`${s.payoutStatus} ${payoutStatusClass(p.status)}`}>
                        {capitalize(p.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ MY PAGE VIEW ═══ */}
        <div className={`${s.view} ${activeView === "mypage" ? s.viewActive : ""}`}>
          <div className={s.viewHeader}>
            <h1>My Page</h1>
            <p>Preview and customize how subscribers see your profile.</p>
          </div>

          <div className={s.pagePreviewCard}>
            <div className={s.pageBanner}>
              <span className={s.pageBannerLabel}>Click to change banner</span>
            </div>
            <div className={s.pageProfileSection}>
              <div className={s.pageAvatar}>SV</div>
              <div className={s.pageDisplayName}>Sophie Valentine</div>
              <div className={s.pageUsername}>@sophievalentine</div>
              <div className={s.pageBio}>
                Digital artist &amp; photographer sharing exclusive behind-the-scenes content, tutorials, and premium art collections. Join my creative journey.
              </div>
              <div className={s.pageMeta}>
                <div className={s.pageMetaItem}>1,247 <span>subscribers</span></div>
                <div className={s.pageMetaItem}>186 <span>posts</span></div>
                <div className={s.pageMetaItem}>4.9 <span>rating</span></div>
              </div>
            </div>
          </div>

          <div className={s.sectionTitle}>Subscription Tiers</div>
          <div className={s.tiersGrid}>
            {mockTiers.map((tier) => (
              <div
                key={tier.name}
                className={`${s.tierCard} ${tier.featured ? s.tierCardFeatured : ""}`}
              >
                {tier.featured && <div className={s.tierFeaturedBadge}>Most Popular</div>}
                <div className={s.tierName}>{tier.name}</div>
                <div className={s.tierPrice}>{tier.price}</div>
                <div className={s.tierPriceUnit}>{tier.unit}</div>
                <div className={s.tierDesc}>{tier.desc}</div>
                <button
                  className={s.tierEditBtn}
                  onClick={() => showToast(`Editing ${tier.name} tier`, "info")}
                >
                  Edit Tier
                </button>
              </div>
            ))}
            <div
              className={s.tierAddCard}
              onClick={() => showToast("Tier creation coming soon", "info")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              <span>Add New Tier</span>
            </div>
          </div>

          <div className={s.sectionTitle}>Profile Link</div>
          <div className={s.profileLinkCard}>
            <input
              type="text"
              className={s.profileLinkUrl}
              value="vaulty.com/@sophievalentine"
              readOnly
            />
            <button className={s.copyBtn} onClick={copyProfileLink}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
              Copy
            </button>
          </div>
        </div>

        {/* ═══ SETTINGS VIEW ═══ */}
        <div className={`${s.view} ${activeView === "settings" ? s.viewActive : ""}`}>
          <div className={s.viewHeader}>
            <h1>Settings</h1>
            <p>Manage your account, payouts, and preferences.</p>
          </div>

          <div className={s.settingsSections}>
            {/* Profile Info */}
            <div className={s.settingsSection}>
              <h3 className={s.settingsSectionTitle}>Profile Information</h3>
              <p className={s.settingsSectionDesc}>Update your creator profile details.</p>

              <div className={s.settingsAvatarRow}>
                <div className={s.settingsAvatar}>SV</div>
                <div className={s.settingsAvatarActions}>
                  <button
                    className={s.settingsAvatarUpload}
                    onClick={() => showToast("Avatar upload coming soon", "info")}
                  >
                    Upload Photo
                  </button>
                  <span className={s.settingsAvatarHint}>JPG, PNG or GIF. Max 5MB.</span>
                </div>
              </div>

              <div className={s.formRow}>
                <div className={s.formGroup} style={{ marginBottom: 0 }}>
                  <label>Display Name</label>
                  <input type="text" className={s.formInput} defaultValue="Sophie Valentine" />
                </div>
                <div className={s.formGroup} style={{ marginBottom: 0 }}>
                  <label>Username</label>
                  <input type="text" className={s.formInput} defaultValue="sophievalentine" disabled />
                </div>
              </div>
              <div className={s.formGroup}>
                <label>Bio</label>
                <textarea
                  className={`${s.formInput} ${s.formInputTextarea}`}
                  rows={3}
                  defaultValue="Digital artist & photographer sharing exclusive behind-the-scenes content, tutorials, and premium art collections. Join my creative journey."
                />
              </div>
              <div className={s.formGroup} style={{ marginBottom: "1.5rem" }}>
                <label>Category</label>
                <select className={`${s.formInput} ${s.formInputSelect}`} defaultValue="art">
                  <option value="art">Art &amp; Photography</option>
                  <option value="music">Music</option>
                  <option value="fitness">Fitness &amp; Wellness</option>
                  <option value="cooking">Cooking &amp; Recipes</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="gaming">Gaming</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                className={s.btnSave}
                onClick={() => showToast("Profile saved successfully", "success")}
              >
                Save Changes
              </button>
            </div>

            {/* Payout Settings */}
            <div className={s.settingsSection}>
              <h3 className={s.settingsSectionTitle}>Payout Settings</h3>
              <p className={s.settingsSectionDesc}>Manage where your earnings are sent.</p>

              <div className={`${s.payoutInfoRow} ${s.payoutInfoRowBorder}`}>
                <div className={`${s.payoutInfoIcon} ${s.payoutInfoIconBank}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                </div>
                <div className={s.payoutInfoDetails}>
                  <div className={s.payoutInfoLabel}>Bank Account</div>
                  <div className={s.payoutInfoValue}>Chase **** 4829</div>
                </div>
                <button
                  className={s.payoutInfoEdit}
                  onClick={() => showToast("Bank edit coming soon", "info")}
                >
                  Edit
                </button>
              </div>
              <div className={s.payoutInfoRow}>
                <div className={`${s.payoutInfoIcon} ${s.payoutInfoIconCrypto}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <div className={s.payoutInfoDetails}>
                  <div className={s.payoutInfoLabel}>Crypto Wallet</div>
                  <div className={s.payoutInfoValue}>0x7a3b...f29d (USDC)</div>
                </div>
                <button
                  className={s.payoutInfoEdit}
                  onClick={() => showToast("Wallet edit coming soon", "info")}
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Privacy */}
            <div className={s.settingsSection}>
              <h3 className={s.settingsSectionTitle}>Privacy &amp; Security</h3>
              <p className={s.settingsSectionDesc}>Control who can see your content and how it&apos;s protected.</p>

              <ToggleRow label="Geo-blocking" desc="Block specific countries from accessing your page." defaultChecked={false} />
              <ToggleRow label="Watermark content" desc="Automatically add watermark to photos and videos." defaultChecked />
              <ToggleRow label="Two-factor authentication" desc="Add an extra layer of security to your account." defaultChecked isLast />
            </div>

            {/* Notifications */}
            <div className={s.settingsSection}>
              <h3 className={s.settingsSectionTitle}>Notification Preferences</h3>
              <p className={s.settingsSectionDesc}>Choose which notifications you receive.</p>

              <ToggleRow label="New subscriber alerts" desc="Get notified when someone subscribes to your page." defaultChecked />
              <ToggleRow label="Tip notifications" desc="Get notified when you receive a tip." defaultChecked />
              <ToggleRow label="Message alerts" desc="Get notified when subscribers send you a message." defaultChecked />
              <ToggleRow label="Payout notifications" desc="Get notified when a payout is processed." defaultChecked />
              <ToggleRow label="Marketing emails" desc="Receive promotional content and feature announcements." defaultChecked={false} isLast />
            </div>

            {/* Danger Zone */}
            <div className={`${s.settingsSection} ${s.dangerZone}`}>
              <h3 className={s.settingsSectionTitle}>Danger Zone</h3>
              <p className={s.settingsSectionDesc}>Irreversible account actions. Proceed with extreme caution.</p>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  className={s.btnDanger}
                  onClick={() => showToast("Deactivation request submitted", "info")}
                >
                  Deactivate Page
                </button>
                <button
                  className={s.btnDanger}
                  onClick={() => setDeleteTarget({ id: -1, title: "__account__", date: "", visibility: "free", likes: 0, views: 0 })}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ CONFIRM DIALOGS ══════ */}
      <ConfirmDialog
        isOpen={deleteTarget !== null && deleteTarget.title !== "__account__"}
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Post"
        message={`Delete "${deleteTarget?.title ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
      <ConfirmDialog
        isOpen={deleteTarget !== null && deleteTarget.title === "__account__"}
        onConfirm={() => {
          showToast("Account deletion request submitted", "info");
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone. All your content, subscribers, and earnings data will be permanently removed."
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        variant="danger"
      />
    </>
  );
}

/* ══════ TOGGLE ROW SUB-COMPONENT ══════ */
function ToggleRow({
  label,
  desc,
  defaultChecked = false,
  isLast = false,
}: {
  label: string;
  desc: string;
  defaultChecked?: boolean;
  isLast?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className={`${s.toggleRow} ${!isLast ? s.toggleRowBorder : ""}`}>
      <div>
        <div className={s.toggleLabel}>{label}</div>
        <div className={s.toggleDesc}>{desc}</div>
      </div>
      <label className={`${s.toggleSwitch} ${checked ? s.toggleSwitchChecked : ""}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => setChecked((c) => !c)}
        />
        <span className={s.toggleSlider} />
      </label>
    </div>
  );
}
