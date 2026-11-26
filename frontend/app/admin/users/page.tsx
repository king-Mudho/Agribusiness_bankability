"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge, DataTable, PageHeader, formatDate } from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import type { AdminUserRow } from "@/types/admin";

export default function AdminUsersPage() {
  const query = useQuery({ queryKey: ["admin", "users"], queryFn: () => adminApi.users({ page_size: 200 }) });

  return (
    <>
      <PageHeader
        title="Users"
        description="Staff accounts and their roles. Admins see everything; Researchers see the insights dashboard, research tools and framework; Analysts see the insights dashboard and framework. New accounts and role changes are still made by a system administrator on the server."
      />
      <DataTable<AdminUserRow>
        loading={query.isLoading}
        error={query.isError}
        rows={query.data?.results}
        rowKey={(r) => r.id}
        columns={[
          {
            key: "user",
            header: "User",
            render: (r) => (
              <div>
                <p className="font-medium">{r.full_name || r.username}</p>
                <p className="text-xs text-text-muted">{r.username}{r.email ? ` · ${r.email}` : ""}</p>
              </div>
            ),
          },
          { key: "role", header: "Role", render: (r) => r.role ?? <span className="text-text-muted">None</span> },
          {
            key: "active",
            header: "Status",
            render: (r) => (r.is_active ? <Badge tone="bg-success/15 text-success">Active</Badge> : <Badge>Inactive</Badge>),
          },
          { key: "login", header: "Last sign-in", render: (r) => formatDate(r.last_login, true) },
          { key: "joined", header: "Created", render: (r) => formatDate(r.date_joined) },
        ]}
      />
    </>
  );
}
