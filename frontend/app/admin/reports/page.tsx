"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Card,
  DataTable,
  ExportButtons,
  FilterSelect,
  PageHeader,
  Pagination,
  SearchInput,
  formatDate,
} from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import { reportsApi } from "@/lib/api/endpoints";
import type { AdminReportRow } from "@/types/admin";

const PAGE_SIZE = 25;
const TYPE_OPTIONS = [
  { value: "PDF", label: "PDF report" },
  { value: "CERT", label: "Certificate" },
  { value: "XLSX", label: "Excel workbook" },
  { value: "CSV", label: "CSV" },
];

function RedownloadButton({ row }: { row: AdminReportRow }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-header hover:bg-bg disabled:opacity-40"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await reportsApi.download(row.id, row.report_type);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Download size={14} aria-hidden /> {busy ? "..." : "Download"}
    </button>
  );
}

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [reportType, setReportType] = useState("");
  const params = { q, report_type: reportType, page, page_size: PAGE_SIZE };
  const query = useQuery({
    queryKey: ["admin", "reports", params],
    queryFn: () => adminApi.reports(params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Reports & exports"
        description="Bulk exports of everything collected, plus every report file that has been generated."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="All assessments">
          <p className="mb-3 text-sm text-text-muted">
            One row per scored assessment: answers, dimension scores, ABI, band, gates and evidence coverage.
          </p>
          <ExportButtons onExport={(t) => adminApi.exportData("assessments", t)} />
        </Card>
        <Card title="All enterprises">
          <p className="mb-3 text-sm text-text-muted">Enterprise profiles, finance sought, consent and latest ABI.</p>
          <ExportButtons onExport={(t) => adminApi.exportData("enterprises", t)} />
        </Card>
        <Card title="Pilot feedback">
          <p className="mb-3 text-sm text-text-muted">Every feedback response from the pilot.</p>
          <ExportButtons onExport={(t) => adminApi.exportData("feedback", t)} />
        </Card>
      </div>
      <p className="text-xs text-text-muted">
        Exports contain enterprise names and are for the research team only. Respondents consented to research use,
        not to sharing named results with third parties. Every export is recorded in the audit log.
      </p>

      <h2 className="text-lg font-semibold text-text">Generated report files</h2>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Search enterprise name or code"
        />
        <div className="sm:w-56">
          <FilterSelect
            label="Type"
            value={reportType}
            onChange={(v) => {
              setReportType(v);
              setPage(1);
            }}
            options={TYPE_OPTIONS}
          />
        </div>
      </div>

      <DataTable<AdminReportRow>
        loading={query.isLoading}
        error={query.isError}
        rows={query.data?.results}
        rowKey={(r) => r.id}
        empty="No reports have been generated yet."
        columns={[
          { key: "date", header: "Generated", render: (r) => formatDate(r.generated_at, true) },
          {
            key: "enterprise",
            header: "Enterprise",
            render: (r) => (
              <Link href={`/admin/assessments/${r.assessment_id}`} className="font-medium text-header hover:underline">
                {r.enterprise_name}
              </Link>
            ),
          },
          { key: "type", header: "Type", render: (r) => r.report_type_label },
          { key: "dl", header: "", className: "text-right", render: (r) => <RedownloadButton row={r} /> },
        ]}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} count={query.data?.count} onPage={setPage} />
    </>
  );
}
