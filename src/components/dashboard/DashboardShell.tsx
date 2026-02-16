"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogoutButton } from "@/components/auth/LogoutButton";
import s from "./dashboard-shell.module.css";

type Variant = "creator" | "member";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const CREATOR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { label: "My Content", href: "/dashboard/content", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { label: "Subscribers", href: "/dashboard/subscribers", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { label: "Earnings", href: "/dashboard/earnings", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
];

const CREATOR_ACCOUNT_NAV: NavItem[] = [
  { label: "My Page", href: "/dashboard/my-page", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { label: "Settings", href: "/dashboard/settings", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
];

const MEMBER_NAV: NavItem[] = [
  { label: "Search", href: "/dashboard/client", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  { label: "My Subscriptions", href: "/dashboard/client/subscriptions", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { label: "Credits", href: "/dashboard/client/credits", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><path d="M12 6v2m0 8v2"/></svg> },
];

const MEMBER_ACCOUNT_NAV: NavItem[] = [
  { label: "Settings", href: "/dashboard/client/settings", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardShell({
  variant,
  children,
}: {
  variant: Variant;
  children: React.ReactNode;
}) {
  const { profile } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const mainNav = variant === "creator" ? CREATOR_NAV : MEMBER_NAV;
  const accountNav = variant === "creator" ? CREATOR_ACCOUNT_NAV : MEMBER_ACCOUNT_NAV;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard" && variant === "creator") return pathname === "/dashboard";
      if (href === "/dashboard/client" && variant === "member") return pathname === "/dashboard/client";
      return pathname.startsWith(href) && href !== "/dashboard" && href !== "/dashboard/client";
    },
    [pathname, variant]
  );

  const displayName = profile?.display_name ?? "User";
  const username = profile?.username ?? "";
  const initials = getInitials(displayName);
  const balance = profile?.credit_balance ?? 0;

  return (
    <>
      {/* ══════ TOPBAR ══════ */}
      <div className={s.topbar}>
        <Link href="/" className={s.topbarLogo}>
          <div className={s.topbarLogoIcon}>
            <div className={s.topbarLogoVault}>
              <div className={s.sp} /><div className={s.sp} />
              <div className={s.sp} /><div className={s.sp} />
            </div>
          </div>
          <span className={s.topbarLogoText}>Vaulty</span>
        </Link>

        <div className={s.topbarRight}>
          {variant === "creator" ? (
            <Link href="/dashboard/earnings" className={s.balancePill}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><path d="M12 6v2m0 8v2"/></svg>
              <span>{balance.toLocaleString()} credits</span>
            </Link>
          ) : (
            <Link href="/dashboard/client/credits" className={s.balancePill}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><path d="M12 6v2m0 8v2"/></svg>
              <span>{balance.toLocaleString()} credits</span>
            </Link>
          )}

          <div className={s.userMenu} ref={menuRef}>
            <button className={s.userMenuBtn} onClick={() => setDropdownOpen((o) => !o)}>
              <div className={s.userAvatar}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" />
                ) : (
                  initials
                )}
              </div>
              <span className={s.userName}>{displayName.split(" ")[0]}</span>
            </button>
            <div className={`${s.userDropdown} ${dropdownOpen ? s.userDropdownOpen : ""}`}>
              <div className={s.userDropdownHeader}>
                <div className={s.userDropdownName}>{displayName}</div>
                <div className={s.userDropdownHandle}>@{username}</div>
              </div>
              {accountNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={s.userDropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              <div className={s.userDropdownSep} />
              <LogoutButton className={`${s.userDropdownItem} ${s.userDropdownItemDanger}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Log out
              </LogoutButton>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ SIDEBAR ══════ */}
      <div className={s.sidebar}>
        <div className={s.sidebarNav}>
          <div className={s.sidebarSectionLabel}>
            {variant === "creator" ? "Creator" : "Menu"}
          </div>
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? s.sidebarItemActive : s.sidebarItem}
            >
              {item.icon}
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={s.sidebarBadge}>{item.badge}</span>
              )}
            </Link>
          ))}

          <div className={s.sidebarSectionLabel}>Account</div>
          {accountNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? s.sidebarItemActive : s.sidebarItem}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        <div className={s.sidebarFooter}>
          <LogoutButton className={s.sidebarItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--danger)" }}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span style={{ color: "var(--danger)" }}>Log out</span>
          </LogoutButton>
        </div>
      </div>

      {/* ══════ MAIN ══════ */}
      <div className={s.main}>{children}</div>
    </>
  );
}
