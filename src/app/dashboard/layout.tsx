"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const variant = pathname.startsWith("/dashboard/client") ? "member" : "creator";

  return <DashboardShell variant={variant}>{children}</DashboardShell>;
}
