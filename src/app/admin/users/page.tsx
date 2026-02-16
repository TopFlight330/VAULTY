"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAllUsers } from "@/lib/actions/admin";
import type { Profile } from "@/types/database";
import s from "../admin.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const LIMIT = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const result = await getAllUsers(
      page,
      LIMIT,
      search || undefined,
      roleFilter
    );
    setUsers(result.users);
    setTotal(result.total);
    setLoading(false);
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const totalPages = Math.ceil(total / LIMIT);

  const roleBadgeClass = (role: string) => {
    if (role === "creator") return s.roleCreator;
    if (role === "admin") return s.roleAdmin;
    return s.roleUser;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div>
      <div className={s.viewHeader}>
        <h1>Users</h1>
        <p>Manage all registered users on the platform.</p>
      </div>

      <div className={s.toolbar}>
        <input
          type="text"
          className={s.searchInput}
          placeholder="Search by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={s.filterSelect}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="creator">Creators</option>
          <option value="user">Members</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className={s.skeleton} style={{ width: 34, height: 34, borderRadius: "50%" }} />
                        <div>
                          <div className={s.skeleton} style={{ height: 12, width: 100, marginBottom: 4 }} />
                          <div className={s.skeleton} style={{ height: 10, width: 70 }} />
                        </div>
                      </div>
                    </td>
                    <td><div className={s.skeleton} style={{ height: 20, width: 60, borderRadius: 8 }} /></td>
                    <td><div className={s.skeleton} style={{ height: 12, width: 50 }} /></td>
                    <td><div className={s.skeleton} style={{ height: 12, width: 50 }} /></td>
                    <td><div className={s.skeleton} style={{ height: 12, width: 80 }} /></td>
                    <td><div className={s.skeleton} style={{ height: 24, width: 50, borderRadius: 8 }} /></td>
                  </tr>
                ))}
              </>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--dim)" }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={s.userCell}>
                      <div className={s.userAvatar}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" />
                        ) : (
                          getInitials(user.display_name)
                        )}
                      </div>
                      <div>
                        <div className={s.userName}>{user.display_name}</div>
                        <div className={s.userHandle}>@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={roleBadgeClass(user.role)}>{user.role}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {user.credit_balance.toLocaleString()}
                  </td>
                  <td>
                    {user.is_banned ? (
                      <span className={s.statusBanned}>Banned</span>
                    ) : (
                      <span className={s.statusActive}>Active</span>
                    )}
                  </td>
                  <td style={{ color: "var(--dim)", fontSize: "0.82rem" }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td>
                    <Link href={`/admin/users/${user.id}`} className={s.actionBtn}>
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={s.pagination}>
          <button
            className={s.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className={s.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            className={s.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
