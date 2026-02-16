"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionWithProfile } from "@/types/database";
import s from "../dashboard.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SubscribersPage() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<SubscriptionWithProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSubscribers = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    const { data, count } = await supabase
      .from("subscriptions")
      .select(
        "*, subscriber:profiles!subscriptions_subscriber_id_fkey(*), tier:tiers(*)",
        { count: "exact" }
      )
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    setSubscribers((data as SubscriptionWithProfile[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const filtered = search.trim()
    ? subscribers.filter(
        (sub) =>
          sub.subscriber.display_name
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          sub.subscriber.username
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          sub.tier?.name.toLowerCase().includes(search.toLowerCase())
      )
    : subscribers;

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div>
      <div className={s.viewHeader}>
        <h1>Subscribers</h1>
        <p>View and manage your subscriber base.</p>
      </div>

      <div className={s.subsHeader}>
        <div className={s.subsCount}>
          Total: <span className={s.gradText}>{total.toLocaleString()}</span>{" "}
          subscribers
        </div>
        <div className={s.subsSearch}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search subscribers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
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
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--input-bg)" }} />
                      <div>
                        <div style={{ height: 14, width: 100, background: "var(--input-bg)", borderRadius: 6, marginBottom: 4 }} />
                        <div style={{ height: 10, width: 60, background: "var(--input-bg)", borderRadius: 6 }} />
                      </div>
                    </div>
                  </td>
                  <td><div style={{ height: 14, width: 60, background: "var(--input-bg)", borderRadius: 6 }} /></td>
                  <td><div style={{ height: 14, width: 80, background: "var(--input-bg)", borderRadius: 6 }} /></td>
                  <td><div style={{ height: 14, width: 50, background: "var(--input-bg)", borderRadius: 6 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28, color: "var(--muted)" }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
          </div>
          <div style={{ fontFamily: "var(--font-sora)", fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.4rem" }}>
            {search.trim() ? "No subscribers found" : "No subscribers yet"}
          </div>
          <div style={{ fontSize: "0.88rem", color: "var(--dim)", maxWidth: 320 }}>
            {search.trim()
              ? "Try a different search term."
              : "Share your page to start getting subscribers."}
          </div>
        </div>
      ) : (
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
              {filtered.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div className={s.subUser}>
                      <div className={s.subAvatarSm}>
                        {sub.subscriber.avatar_url ? (
                          <img
                            src={sub.subscriber.avatar_url}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          getInitials(sub.subscriber.display_name)
                        )}
                      </div>
                      <div>
                        <div className={s.subUserName}>
                          {sub.subscriber.display_name}
                        </div>
                        <div className={s.subUserHandle}>
                          @{sub.subscriber.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${s.tierBadge} ${s.tierBadgePremium}`}>
                      {sub.tier?.name ?? "Unknown"}
                    </span>
                  </td>
                  <td style={{ color: "var(--dim)" }}>
                    {formatDate(sub.started_at)}
                  </td>
                  <td>
                    <span
                      className={`${s.statusBadge} ${
                        sub.status === "active"
                          ? s.statusBadgeActive
                          : s.statusBadgeExpired
                      }`}
                    >
                      {capitalize(sub.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
