"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { banUser, unbanUser } from "@/lib/actions/admin";
import type { Profile } from "@/types/database";
import s from "../../admin.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [banReason, setBanReason] = useState("");
  const [acting, setActing] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [subCount, setSubCount] = useState(0);

  const fetchUser = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setUser(data);

      // Fetch related counts
      const [posts, subs] = await Promise.all([
        supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", id),
        supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .or(`subscriber_id.eq.${id},creator_id.eq.${id}`)
          .eq("status", "active"),
      ]);

      setPostCount(posts.count ?? 0);
      setSubCount(subs.count ?? 0);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleBan = async () => {
    if (!banReason.trim()) {
      showToast("Please provide a reason for banning.", "error");
      return;
    }
    setActing(true);
    const result = await banUser(id, banReason.trim());
    if (result.success) {
      showToast("User banned.", "success");
      setBanReason("");
      fetchUser();
    } else {
      showToast(result.message, "error");
    }
    setActing(false);
  };

  const handleUnban = async () => {
    setActing(true);
    const result = await unbanUser(id);
    if (result.success) {
      showToast("User unbanned.", "success");
      fetchUser();
    } else {
      showToast(result.message, "error");
    }
    setActing(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  if (loading) {
    return (
      <div>
        <div className={s.viewHeader}>
          <div className={s.skeleton} style={{ height: 24, width: 200, marginBottom: 8 }} />
          <div className={s.skeleton} style={{ height: 14, width: 300 }} />
        </div>
        <div className={s.detailCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
            <div className={s.skeleton} style={{ width: 72, height: 72, borderRadius: "50%" }} />
            <div>
              <div className={s.skeleton} style={{ height: 20, width: 160, marginBottom: 6 }} />
              <div className={s.skeleton} style={{ height: 14, width: 100 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className={s.skeleton} style={{ height: 10, width: 60, marginBottom: 6 }} />
                <div className={s.skeleton} style={{ height: 16, width: 80 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <div className={s.viewHeader}>
          <h1>User Not Found</h1>
          <p>This user does not exist or has been deleted.</p>
        </div>
        <Link href="/admin/users" className={s.actionBtn}>
          Back to Users
        </Link>
      </div>
    );
  }

  const roleBadgeClass =
    user.role === "creator"
      ? s.roleCreator
      : user.role === "admin"
        ? s.roleAdmin
        : s.roleUser;

  return (
    <div>
      <div className={s.viewHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <Link
            href="/admin/users"
            style={{ color: "var(--dim)", display: "flex", alignItems: "center" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1>User Detail</h1>
        </div>
        <p>Manage user account and permissions.</p>
      </div>

      <div className={s.detailCard}>
        <div className={s.detailHeader}>
          <div className={s.detailAvatar}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" />
            ) : (
              getInitials(user.display_name)
            )}
          </div>
          <div>
            <div className={s.detailName}>{user.display_name}</div>
            <div className={s.detailHandle}>@{user.username}</div>
          </div>
          <span className={roleBadgeClass} style={{ marginLeft: "auto" }}>
            {user.role}
          </span>
        </div>

        {user.bio && (
          <p style={{ color: "var(--dim)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            {user.bio}
          </p>
        )}

        <div className={s.detailMeta}>
          <div className={s.detailMetaItem}>
            <span className={s.detailMetaLabel}>Credit Balance</span>
            <span className={s.detailMetaValue}>
              {user.credit_balance.toLocaleString()} credits
            </span>
          </div>
          <div className={s.detailMetaItem}>
            <span className={s.detailMetaLabel}>Category</span>
            <span className={s.detailMetaValue}>{user.category}</span>
          </div>
          <div className={s.detailMetaItem}>
            <span className={s.detailMetaLabel}>Posts</span>
            <span className={s.detailMetaValue}>{postCount}</span>
          </div>
          <div className={s.detailMetaItem}>
            <span className={s.detailMetaLabel}>Subscriptions</span>
            <span className={s.detailMetaValue}>{subCount}</span>
          </div>
          <div className={s.detailMetaItem}>
            <span className={s.detailMetaLabel}>Joined</span>
            <span className={s.detailMetaValue}>{formatDate(user.created_at)}</span>
          </div>
          <div className={s.detailMetaItem}>
            <span className={s.detailMetaLabel}>Status</span>
            <span className={s.detailMetaValue}>
              {user.is_banned ? (
                <span className={s.statusBanned}>Banned</span>
              ) : (
                <span className={s.statusActive}>Active</span>
              )}
            </span>
          </div>
        </div>

        {user.is_banned && user.ban_reason && (
          <div
            style={{
              background: "var(--danger-dim)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10,
              padding: "0.85rem 1rem",
              marginBottom: "1.5rem",
              fontSize: "0.85rem",
            }}
          >
            <strong style={{ color: "var(--danger)" }}>Ban reason:</strong>{" "}
            {user.ban_reason}
          </div>
        )}

        {user.role === "creator" && (
          <div style={{ marginBottom: "1.5rem" }}>
            <Link
              href={`/@${user.username}`}
              className={s.actionBtn}
              style={{ textDecoration: "none" }}
              target="_blank"
            >
              View Public Page
            </Link>
          </div>
        )}
      </div>

      {/* Ban / Unban Actions */}
      {user.role !== "admin" && (
        <div className={s.detailCard}>
          <div className={s.sectionTitle}>Account Actions</div>
          {user.is_banned ? (
            <div className={s.detailActions}>
              <button
                className={s.actionBtnSuccess}
                onClick={handleUnban}
                disabled={acting}
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
              >
                {acting ? "Processing..." : "Unban User"}
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                className={s.banReasonInput}
                placeholder="Reason for ban (required)..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
              <div className={s.detailActions}>
                <button
                  className={s.actionBtnDanger}
                  onClick={handleBan}
                  disabled={acting || !banReason.trim()}
                  style={{
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.85rem",
                    opacity: acting || !banReason.trim() ? 0.5 : 1,
                  }}
                >
                  {acting ? "Processing..." : "Ban User"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
