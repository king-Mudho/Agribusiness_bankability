"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { RowDownloads } from "@/components/admin/RowDownloads";
import {
  DataTable,
  ExportButtons,
  FilterSelect,
  PageHeader,
  Pagination,
  SearchInput,
  StatusBadge,
  formatDate,
} from "@/components/admin/ui";
import { PROVINCE_CHOICES, VALUE_CHAIN_CHOICES } from "@/config/enterpriseChoices";
import { adminApi } from "@/lib/api/admin";
import { frameworksApi } from "@/lib/api/endpoints";
import type { AdminAssessmentRow } from "@/types/admin";

const PAGE_SIZE = 25;
const STATUS_OPTIONS = [
  { value: "SCORED", label: "Scored" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "DRAFT", label: "Draft" },
];

export default function AdminAssessmentsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    value_chain: "",
    province: "",
    readiness_band: "",
    date_from: "",
    date_to: "",
  });

  const frameworkQuery = useQuery({
    queryKey: ["framework-definition", "active"],
    queryFn: () => frameworksApi.getActiveDefinition(),
    staleTime: 10 * 60 * 1000,
  });

  const params = { ...filters, page, page_size: PAGE_SIZE };
  const query = useQuery({
    queryKey: ["admin", "assessments", params],
    queryFn: () => adminApi.assessments(params),
    placeholderData: keepPreviousData,
  });

  function update(key: keyof typeof filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Assessments"
        description="Every assessment, including drafts. Open one to see the full results, or download its PDF report, Excel workbook or certificate."
        actions={
          <ExportButtons
            onExport={(fileType) => adminApi.exportData("assessments", fileType, { ...filters })}
          />
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <SearchInput
          value={filters.q}
          onChange={(v) => update("q", v)}
          placeholder="Search enterprise name, code or respondent code"
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <FilterSelect label="Status" value={filters.status} onChange={(v) => update("status", v)} options={STATUS_OPTIONS} />
          <FilterSelect label="Value chain" value={filters.value_chain} onChange={(v) => update("value_chain", v)} options={VALUE_CHAIN_CHOICES} />
          <FilterSelect label="Province" value={filters.province} onChange={(v) => update("province", v)} options={PROVINCE_CHOICES} />
          <FilterSelect
            label="Readiness band"
            value={filters.readiness_band}
            onChange={(v) => update("readiness_band", v)}
            options={(frameworkQuery.data?.readiness_bands ?? []).map((b) => ({ value: b.code, label: b.label }))}
          />
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            Started from
            <input type="date" value={filters.date_from} onChange={(e) => update("date_from", e.target.value)} className="min-h-[44px] rounded-md border border-border bg-surface px-3 text-sm text-text" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            Started to
            <input type="date" value={filters.date_to} onChange={(e) => update("date_to", e.target.value)} className="min-h-[44px] rounded-md border border-border bg-surface px-3 text-sm text-text" />
          </label>
        </div>
        <p className="text-xs text-text-muted">Exports include the scored assessments that match these filters.</p>
      </div>

      <DataTable<AdminAssessmentRow>
        loading={query.isLoading}
        error={query.isError}
        rows={query.data?.results}
        rowKey={(r) => r.id}
        empty="No assessments match these filters."
        columns={[
          {
            key: "enterprise",
            header: "Enterprise",
            render: (r) => (
              <div>
                <Link href={`/admin/assessments/${r.id}`} className="font-medium text-header hover:underline">
                  {r.enterprise_name}
                </Link>
                <p className="text-xs text-text-muted">{r.enterprise_code}</p>
              </div>
            ),
          },
          { key: "chain", header: "Value chain", render: (r) => r.value_chain_label },
          { key: "province", header: "Province", render: (r) => r.province_label },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "abi",
            header: "ABI",
            className: "text-right",
            render: (r) => (r.abi_score === null ? "-" : <span className="font-semibold tabular-nums">{Math.round(r.abi_score)}</span>),
          },
          { key: "band", header: "Readiness", render: (r) => r.readiness_band_label ?? "-" },
          {
            key: "evidence",
            header: "Evidence",
            className: "text-right",
            render: (r) => (r.evidence_coverage_percent === null ? "-" : `${Math.round(r.evidence_coverage_percent)}%`),
          },
          { key: "date", header: "Submitted", render: (r) => formatDate(r.submitted_at ?? r.started_at) },
          {
            key: "files",
            header: "Downloads",
            render: (r) => (r.abi_score === null ? <span className="text-xs text-text-muted">Not scored</span> : <RowDownloads assessmentId={r.id} />),
          },
        ]}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} count={query.data?.count} onPage={setPage} />
    </>
  );
}
