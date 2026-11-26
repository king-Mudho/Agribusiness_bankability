import {
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { RoleName } from "@/types/admin";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles that may open this section. Mirrors the server-side permissions
   * (docs/18_DATA_PRIVACY.md access matrix): individual, named records are
   * Admin-only; Researchers and Analysts get the aggregate views. */
  roles: RoleName[];
  group: "Overview" | "Data" | "Research" | "System";
}

const ADMIN: RoleName[] = ["ADMIN"];

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ADMIN, group: "Overview" },
  { href: "/admin/insights", label: "Insights dashboard", icon: BarChart3, roles: ["ADMIN", "RESEARCHER", "ANALYST"], group: "Overview" },
  { href: "/admin/assessments", label: "Assessments", icon: ClipboardList, roles: ADMIN, group: "Data" },
  { href: "/admin/enterprises", label: "Enterprises", icon: Building2, roles: ADMIN, group: "Data" },
  { href: "/admin/reports", label: "Reports & exports", icon: FileText, roles: ADMIN, group: "Data" },
  { href: "/admin/feedback", label: "Pilot feedback", icon: MessageSquare, roles: ADMIN, group: "Data" },
  { href: "/admin/research", label: "Research tools", icon: FlaskConical, roles: ["ADMIN", "RESEARCHER"], group: "Research" },
  { href: "/admin/framework", label: "Framework", icon: BookOpen, roles: ["ADMIN", "RESEARCHER", "ANALYST"], group: "Research" },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, roles: ADMIN, group: "System" },
  { href: "/admin/users", label: "Users", icon: Users, roles: ADMIN, group: "System" },
  { href: "/admin/account", label: "My account", icon: UserCircle, roles: ["ADMIN", "RESEARCHER", "ANALYST"], group: "System" },
];

export function navForRole(role: RoleName | null | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/** Longest matching nav item for a path, e.g. /admin/assessments/123 -> Assessments. */
export function activeNavItem(pathname: string): NavItem | undefined {
  return [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)));
}
