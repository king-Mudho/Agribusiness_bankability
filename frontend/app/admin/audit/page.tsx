"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { DataTable, FilterSelect, PageHeader, Pagination, formatDate } from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import type { AdminAuditRow } from "@/types/admin";

const PAGE_SIZE = 50;
const ACTIONS = [
  "assessment.submitted",
  "assessment.gate_recorded",
  "report.generated",
  "assessments.exported",
  "enterprises.exported",
  "feedback.exported",
  "framework_version.created",
  "framework_version.changed",
].map((a) => ({ value: a, label: a }));

function summarise(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "-";
  return Object.entries(metadata)
    .filter(([k]) => k !== "assessment_ids")
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(", ") || "-";
}

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const params = { action, page, page_size: PAGE_SIZE };
  const query = useQuery({
    queryKey: ["admin", "audit", params],
    queryFn: () => adminApi.auditLog(params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Sensitive actions recorded by the server: submissions, gate records, report generation and data exports."
      />
      <div className="max-w-xs">
        <FilterSelect
          label="Action"
          value={action}
          onChange={(v) => {
            setAction(v);
            setPage(1);
          }}
          options={ACTIONS}
        />
      </div>
      <DataTable<AdminAuditRow>
        loading={query.isLoading}
        error={query.isError}
        rows={query.data?.results}
        rowKey={(r) => r.id}
        empty="No audit entries."
        columns={[
          { key: "date", header: "When", render: (r) => formatDate(r.created_at, true) },
          { key: "user", header: "User", render: (r) => r.user ?? <span className="text-text-muted">public</span> },
          { key: "action", header: "Action", render: (r) => <code className="text-xs">{r.action}</code> },
          { key: "object", header: "Object", render: (r) => <span className="text-xs">{r.object_type} {r.object_id.slice(0, 8)}</span> },
          { key: "meta", header: "Details", className: "max-w-sm", render: (r) => <span className="text-xs text-text-muted">{summarise(r.metadata)}</span> },
        ]}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} count={query.data?.count} onPage={setPage} />
    </>
  );
}
