"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { cancelSubscription } from "@/lib/actions/subscriptions";
import type { SubscriptionWithCreator } from "@/types/database";
import cs from "../client-dashboard.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCreator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("subscriptions")
      .select(
        "*, creator:profiles!subscriptions_creator_id_fkey(*), tier:tiers(*)"
      )
      .eq("subscriber_id", user.id)
      .order("created_at", { ascending: false });

    setSubscriptions((data as SubscriptionWithCreator[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async (subId: string) => {
    const result = await cancelSubscription(subId);
    if (result.success) {
      showToast("Subscription cancelled", "success");
      fetchData();
    } else {
      showToast(result.message, "error");
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-sora)", fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.3rem" }}>
          My Subscriptions
        </h1>
        <p style={{ color: "var(--dim)", fontSize: "0.9rem" }}>
          Manage your active subscriptions.
        </p>
      </div>

      {loading ? (
        <div className={cs.subsGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={cs.subCard} style={{ minHeight: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--input-bg)" }} />
                <div>
                  <div style={{ height: 14, width: 100, background: "var(--input-bg)", borderRadius: 6, marginBottom: 4 }} />
                  <div style={{ height: 10, width: 60, background: "var(--input-bg)", borderRadius: 6 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className={cs.subsEmpty}>
          <div className={cs.subsEmptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
          </div>
          <div className={cs.subsEmptyTitle}>No subscriptions yet</div>
          <div className={cs.subsEmptyDesc}>
            Discover and subscribe to your favorite creators.
          </div>
          <Link href="/dashboard/client" className={cs.subsEmptyBtn}>
            Discover Creators
          </Link>
        </div>
      ) : (
        <div className={cs.subsGrid}>
          {subscriptions.map((sub) => (
            <div key={sub.id} className={cs.subCard}>
              <div className={cs.subCardTop}>
                <div className={cs.subAvatar}>
                  {sub.creator?.avatar_url ? (
                    <img
                      src={sub.creator.avatar_url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                    />
                  ) : (
                    getInitials(sub.creator?.display_name ?? "?")
                  )}
                </div>
                <div>
                  <div className={cs.subName}>
                    {sub.creator?.display_name ?? "Unknown"}
                  </div>
                  <div className={cs.subHandle}>
                    @{sub.creator?.username ?? ""}
                  </div>
                </div>
              </div>
              <div className={cs.subCardDetails}>
                <span className={cs.subTierPremium}>
                  {sub.tier?.name ?? "Unknown"}
                </span>
                <div className={cs.subRenewal}>
                  {sub.status === "active" ? (
                    <>
                      Renews{" "}
                      <span className={cs.subRenewalDate}>
                        {formatDate(sub.current_period_end)}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "var(--danger)" }}>
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <Link
                  href={`/@${sub.creator?.username}`}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "0.5rem",
                    background: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--text)",
                    fontFamily: "inherit",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                >
                  View Page
                </Link>
                {sub.status === "active" && (
                  <button
                    onClick={() => handleCancel(sub.id)}
                    style={{
                      padding: "0.5rem 0.85rem",
                      background: "var(--danger-dim)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 10,
                      color: "var(--danger)",
                      fontFamily: "inherit",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
