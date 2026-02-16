"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import s from "./admin.module.css";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/admin",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--dim)" }}>
        Loading...
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-sora)", fontWeight: 800, fontSize: "1.4rem" }}>Access Denied</h1>
        <p style={{ color: "var(--dim)", fontSize: "0.9rem" }}>You do not have permission to access this page.</p>
        <Link href="/dashboard" style={{ color: "var(--pink)", fontWeight: 700, fontSize: "0.88rem" }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <div className={s.sidebarLogo}>
          <span className={s.sidebarLogoText}>Vaulty</span>
          <span className={s.sidebarBadge}>Admin</span>
        </div>

        <ul className={s.navList}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={isActive ? s.navItemActive : s.navItem}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={s.sidebarFooter}>
          <Link href="/dashboard" className={s.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </aside>

      <main className={s.main}>{children}</main>
    </div>
  );
}
