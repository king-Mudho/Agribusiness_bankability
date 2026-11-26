"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { activeNavItem, navForRole, type NavItem } from "@/components/admin/nav";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { ResearchDisclaimer } from "@/components/shared/ResearchDisclaimer";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { cn } from "@/lib/utils/cn";

const GROUPS: NavItem["group"][] = ["Overview", "Data", "Research", "System"];

function Sidebar({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  const active = activeNavItem(pathname);
  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-5">
      {GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.group === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-white/50">{group}</p>
            {groupItems.map((item) => {
              const Icon = item.icon;
              const isActive = active?.href === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive ? "bg-accent font-semibold text-header" : "text-white/85 hover:bg-white/10"
                  )}
                >
                  <Icon size={18} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const meQuery = useMe();
  const queryClient = useQueryClient();
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const me = meQuery.data;
  const items = navForRole(me?.role);
  const current = activeNavItem(pathname);
  const allowed = !!current && !!me?.role && current.roles.includes(me.role);

  // Non-admin staff land on the first section their role can open.
  useEffect(() => {
    if (me?.role && current && !current.roles.includes(me.role) && items.length > 0 && pathname === "/admin") {
      router.replace(items[0].href);
    }
  }, [me?.role, current, items, pathname, router]);

  function handleLogout() {
    logout();
    queryClient.clear();
    router.replace("/admin");
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col bg-bg">
        <header className="bg-header px-6 py-4 text-white">
          <Link href="/" className="flex items-center gap-3">
            <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-header">ABI</span>
            <div>
              <p className="font-semibold">Agribusiness Bankability Index</p>
              <p className="text-xs text-white/80">Admin portal -- research prototype</p>
            </div>
          </Link>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
          <LoginForm
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["me"] })}
            description="Sign in with your Admin, Researcher or Analyst account. Admins see every section; other roles see the aggregate and research views."
          />
          <Link href="/" className="text-sm text-header underline">
            Back to the public site
          </Link>
          <ResearchDisclaimer className="max-w-sm" />
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto bg-header px-3 py-5 lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-3">
          <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-header">ABI</span>
          <div>
            <p className="text-sm font-semibold text-white">Admin portal</p>
            <p className="text-[11px] text-white/70">Demo v0.1 -- research prototype</p>
          </div>
        </Link>
        <Sidebar items={items} pathname={pathname} />
        <div className="mt-auto flex flex-col gap-1 border-t border-white/15 pt-4">
          <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10">
            <ExternalLink size={16} aria-hidden /> Public site
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-6 overflow-y-auto bg-header px-3 py-5">
            <div className="flex items-center justify-between px-3">
              <p className="text-sm font-semibold text-white">Admin portal</p>
              <button className="text-white" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <Sidebar items={items} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <Link href="/" className="mt-auto flex items-center gap-2 px-3 py-2 text-sm text-white/80">
              <ExternalLink size={16} aria-hidden /> Public site
            </Link>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
          <button
            className="rounded-md p-2 text-text hover:bg-bg lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <p className="truncate font-semibold text-text">{current?.label ?? "Admin portal"}</p>
          <div className="ml-auto flex items-center gap-3">
            {me && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-text">{me.full_name || me.username}</p>
                <p className="text-xs text-text-muted">{me.role_label ?? "No role"}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-text hover:bg-bg"
            >
              <LogOut size={16} aria-hidden /> Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">
            {meQuery.isLoading ? (
              <p className="text-text-muted">Loading...</p>
            ) : meQuery.isError ? (
              <div className="rounded-lg border border-border bg-surface p-6 text-center">
                <p className="text-danger">Could not load your account. Your session may have expired.</p>
                <button className="mt-2 text-sm underline" onClick={handleLogout}>
                  Sign in again
                </button>
              </div>
            ) : !me?.role || items.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface p-6 text-center text-text">
                This account has no portal role. Ask an administrator to assign Admin, Researcher or Analyst.
              </div>
            ) : !allowed ? (
              <div className="rounded-lg border border-border bg-surface p-6 text-center text-text">
                Your role ({me.role_label}) cannot open this section.
              </div>
            ) : (
              children
            )}
            <ResearchDisclaimer />
          </div>
        </main>
      </div>
    </div>
  );
}
