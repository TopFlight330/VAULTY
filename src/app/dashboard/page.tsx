"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { CreatorStats, Notification } from "@/types/database";
import s from "./dashboard.module.css";

export default function CreatorDashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();

    async function fetchData() {
      const userId = profile!.id;

      // Fetch stats in parallel
      const [subsResult, postResult, txResult, weekSubsResult, notifsResult] =
        await Promise.all([
          supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", userId)
            .eq("status", "active"),
          supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", userId),
          supabase
            .from("transactions")
            .select("amount, type, created_at")
            .eq("user_id", userId)
            .in("type", [
              "subscription_earning",
              "tip_received",
              "ppv_earning",
            ]),
          supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", userId)
            .gte(
              "created_at",
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            ),
          supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      const allEarnings = txResult.data ?? [];
      const totalEarnings = allEarnings.reduce(
        (sum, tx) => sum + tx.amount,
        0
      );
      const tipTotal = allEarnings
        .filter((tx) => tx.type === "tip_received")
        .reduce((sum, tx) => sum + tx.amount, 0);
      const monthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();
      const earningsThisMonth = allEarnings
        .filter((tx) => tx.created_at >= monthStart)
        .reduce((sum, tx) => sum + tx.amount, 0);

      setStats({
        total_earnings: totalEarnings,
        active_subscribers: subsResult.count ?? 0,
        post_count: postResult.count ?? 0,
        tip_total: tipTotal,
        earnings_this_month: earningsThisMonth,
        subscribers_this_week: weekSubsResult.count ?? 0,
      });

      setNotifications(notifsResult.data ?? []);
      setLoading(false);
    }

    fetchData();
  }, [profile]);

  const displayName = profile?.display_name ?? "User";

  if (loading) {
    return (
      <div>
        <div className={s.viewHeader}>
          <h1 className={s.welcomeMsg}>
            Welcome back, <span className={s.gradText}>{displayName.split(" ")[0]}</span>
          </h1>
          <p className={s.welcomeSub}>Loading your dashboard...</p>
        </div>
        <div className={s.statCards}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={s.statCard} style={{ minHeight: 140 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "var(--input-bg)",
                  marginBottom: "1rem",
                }}
              />
              <div
                style={{
                  height: 14,
                  width: "50%",
                  background: "var(--input-bg)",
                  borderRadius: 8,
                  marginBottom: "0.5rem",
                }}
              />
              <div
                style={{
                  height: 28,
                  width: "70%",
                  background: "var(--input-bg)",
                  borderRadius: 8,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activityDotClass = (type: string) => {
    if (type === "new_subscriber") return s.activityDotSubscriber;
    if (type === "tip_received") return s.activityDotTip;
    if (type === "new_like") return s.activityDotLike;
    if (type === "ppv_purchase") return s.activityDotPpv;
    return s.activityDotSubscriber;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div>
      <div className={s.viewHeader}>
        <h1 className={s.welcomeMsg}>
          Welcome back,{" "}
          <span className={s.gradText}>{displayName.split(" ")[0]}</span>
        </h1>
        <p className={s.welcomeSub}>
          Here&apos;s what&apos;s happening with your page today.
        </p>
      </div>

      <div className={s.statCards}>
        <div className={s.statCard}>
          <div className={`${s.statCardIcon} ${s.statCardIconPink}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
          </div>
          <div className={s.statCardLabel}>Total Earnings</div>
          <div className={s.statCardValue}>
            {stats!.total_earnings.toLocaleString()} <span style={{ fontSize: "0.7em", fontWeight: 600, color: "var(--dim)" }}>credits</span>
          </div>
          {stats!.earnings_this_month > 0 && (
            <div className={`${s.statCardChange} ${s.statCardChangeUp}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>
              +{stats!.earnings_this_month.toLocaleString()} this month
            </div>
          )}
        </div>

        <div className={s.statCard}>
          <div className={`${s.statCardIcon} ${s.statCardIconPurple}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
          </div>
          <div className={s.statCardLabel}>Active Subscribers</div>
          <div className={s.statCardValue}>
            {stats!.active_subscribers.toLocaleString()}
          </div>
          {stats!.subscribers_this_week > 0 && (
            <div className={`${s.statCardChange} ${s.statCardChangeUp}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>
              +{stats!.subscribers_this_week} this week
            </div>
          )}
        </div>

        <div className={s.statCard}>
          <div className={`${s.statCardIcon} ${s.statCardIconGreen}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          </div>
          <div className={s.statCardLabel}>Content Posts</div>
          <div className={s.statCardValue}>
            {stats!.post_count.toLocaleString()}
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.statCardIcon} ${s.statCardIconBlue}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
          </div>
          <div className={s.statCardLabel}>Tips Received</div>
          <div className={s.statCardValue}>
            {stats!.tip_total.toLocaleString()} <span style={{ fontSize: "0.7em", fontWeight: 600, color: "var(--dim)" }}>credits</span>
          </div>
        </div>
      </div>

      <div className={s.dashboardGrid}>
        <div className={s.activityCard}>
          <div className={s.cardTitle}>Recent Activity</div>
          {notifications.length === 0 ? (
            <div style={{ padding: "2rem 0", textAlign: "center", color: "var(--dim)", fontSize: "0.88rem" }}>
              No recent activity yet.
            </div>
          ) : (
            <ul className={s.activityList}>
              {notifications.map((notif, i) => (
                <li
                  key={notif.id}
                  className={`${s.activityItem} ${i < notifications.length - 1 ? s.activityItemBorder : ""}`}
                >
                  <span className={`${s.activityDot} ${activityDotClass(notif.type)}`} />
                  <span className={s.activityText}>{notif.body || notif.title}</span>
                  <span className={s.activityTime}>{timeAgo(notif.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={s.actionsCard}>
          <div className={s.cardTitle}>Quick Actions</div>
          <div className={s.quickActions}>
            <Link href="/dashboard/content" className={`${s.actionBtn} ${s.actionBtnPrimary}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              New Post
              <span className={s.actionBtnArrow}>&rarr;</span>
            </Link>
            <Link href="/dashboard/my-page" className={s.actionBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              View Page
              <span className={s.actionBtnArrow}>&rarr;</span>
            </Link>
            <Link href="/dashboard/earnings" className={s.actionBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              Earnings
              <span className={s.actionBtnArrow}>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
