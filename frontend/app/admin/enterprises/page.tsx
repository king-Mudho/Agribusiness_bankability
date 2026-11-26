"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Badge, DataTable, ExportButtons, PageHeader, Pagination, SearchInput, formatDate } from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import type { AdminEnterpriseRow } from "@/types/admin";

const PAGE_SIZE = 25;

export default function AdminEnterprisesPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const params = { q, page, page_size: PAGE_SIZE };
  const query = useQuery({
    queryKey: ["admin", "enterprises", params],
    queryFn: () => adminApi.enterprises(params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Enterprises"
        description="Every enterprise that started an assessment, with its profile, consent status and latest score."
        actions={<ExportButtons onExport={(fileType) => adminApi.exportData("enterprises", fileType)} />}
      />

      <div className="rounded-lg border border-border bg-surface p-4">
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Search enterprise name, code or respondent code"
        />
      </div>

      <DataTable<AdminEnterpriseRow>
        loading={query.isLoading}
        error={query.isError}
        rows={query.data?.results}
        rowKey={(r) => r.id}
        empty="No enterprises found."
        columns={[
          {
            key: "name",
            header: "Enterprise",
            render: (r) => (
              <div>
                <p className="font-medium text-text">{r.name}</p>
                <p className="text-xs text-text-muted">
                  {r.code} · {r.respondent_code}
                </p>
              </div>
            ),
          },
          { key: "chain", header: "Value chain", render: (r) => r.value_chain },
          {
            key: "location",
            header: "Location",
            render: (r) => (
              <span>
                {r.province}
                {r.district ? <span className="text-text-muted">, {r.district}</span> : null}
              </span>
            ),
          },
          {
            key: "size",
            header: "Size",
            render: (r) => (
              <span className="text-xs">
                {r.workers_count} workers · {r.years_operating} yrs
                <br />
                <span className="text-text-muted">{r.turnover_band}</span>
              </span>
            ),
          },
          {
            key: "finance",
            header: "Finance sought",
            render: (r) =>
              r.finance_required_amount === null ? (
                "-"
              ) : (
                <span className="text-xs">
                  {r.finance_required_currency} {r.finance_required_amount.toLocaleString()}
                  <br />
                  <span className="text-text-muted">{r.finance_type_sought}</span>
                </span>
              ),
          },
          {
            key: "consent",
            header: "Consent",
            render: (r) =>
              r.consent_given ? <Badge tone="bg-success/15 text-success">Given</Badge> : <Badge tone="bg-danger/15 text-danger">No</Badge>,
          },
          {
            key: "latest",
            header: "Latest ABI",
            className: "text-right",
            render: (r) =>
              r.latest_assessment_id ? (
                <Link href={`/admin/assessments/${r.latest_assessment_id}`} className="font-semibold tabular-nums text-header hover:underline">
                  {r.latest_abi === null ? "Open" : Math.round(r.latest_abi)}
                </Link>
              ) : (
                "-"
              ),
          },
          { key: "count", header: "Assessments", className: "text-right", render: (r) => r.assessment_count },
          { key: "date", header: "Last assessed", render: (r) => formatDate(r.last_assessed) },
        ]}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} count={query.data?.count} onPage={setPage} />
    </>
  );
}
