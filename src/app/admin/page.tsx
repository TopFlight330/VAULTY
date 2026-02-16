"use client";

import { useState, useEffect } from "react";
import { fetchAdminStats } from "@/lib/actions/admin";
import type { AdminStats } from "@/types/database";
import s from "./admin.module.css";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className={s.viewHeader}>
        <h1>Overview</h1>
        <p>Platform statistics at a glance.</p>
      </div>

      <div className={s.statsGrid}>
        {loading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={s.statCard}>
                <div className={s.skeleton} style={{ height: 12, width: "50%", marginBottom: 12 }} />
                <div className={s.skeleton} style={{ height: 28, width: "40%" }} />
              </div>
            ))}
          </>
        ) : stats ? (
          <>
            <div className={s.statCard}>
              <div className={s.statLabel}>Total Users</div>
              <div className={s.statValue}>{stats.total_users.toLocaleString()}</div>
              <div className={s.statSub}>all registered accounts</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statLabel}>Creators</div>
              <div className={s.statValue}>{stats.total_creators.toLocaleString()}</div>
              <div className={s.statSub}>active creator accounts</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statLabel}>Members</div>
              <div className={s.statValue}>{stats.total_subscribers.toLocaleString()}</div>
              <div className={s.statSub}>subscriber accounts</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statLabel}>Credits in Circulation</div>
              <div className={s.statValue} style={{ color: "var(--gold)" }}>
                {stats.total_credits_in_circulation.toLocaleString()}
              </div>
              <div className={s.statSub}>total balance across all users</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statLabel}>Signups This Week</div>
              <div className={s.statValue} style={{ color: "var(--success)" }}>
                {stats.signups_this_week.toLocaleString()}
              </div>
              <div className={s.statSub}>new accounts (7 days)</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statLabel}>Signups This Month</div>
              <div className={s.statValue} style={{ color: "var(--purple)" }}>
                {stats.signups_this_month.toLocaleString()}
              </div>
              <div className={s.statSub}>new accounts (30 days)</div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
