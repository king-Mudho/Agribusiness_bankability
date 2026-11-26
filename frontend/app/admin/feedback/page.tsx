"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { DataTable, ExportButtons, PageHeader, Pagination, StatCard, formatDate, yesNo } from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import type { AdminFeedbackRow } from "@/types/admin";

const PAGE_SIZE = 25;

function pct(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : `${value}%`;
}

export default function AdminFeedbackPage() {
  const [page, setPage] = useState(1);
  const params = { page, page_size: PAGE_SIZE };
  const query = useQuery({
    queryKey: ["admin", "feedback", params],
    queryFn: () => adminApi.feedback(params),
    placeholderData: keepPreviousData,
  });
  const overview = useQuery({ queryKey: ["admin", "overview"], queryFn: () => adminApi.overview() });
  const summary = overview.data?.feedback_summary;

  return (
    <>
      <PageHeader
        title="Pilot feedback"
        description="What respondents said about the assessment after seeing their results."
        actions={<ExportButtons onExport={(t) => adminApi.exportData("feedback", t)} />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Responses" value={summary?.total ?? "-"} />
        <StatCard label="Score reflects enterprise" value={pct(summary?.score_reflects_enterprise_percent)} />
        <StatCard label="Helps prepare for finance" value={pct(summary?.would_help_prepare_percent)} />
        <StatCard label="Would recommend" value={pct(summary?.would_recommend_percent)} />
        <StatCard label="Will provide evidence later" value={pct(summary?.willing_to_provide_evidence_percent)} />
      </div>

      <DataTable<AdminFeedbackRow>
        loading={query.isLoading}
        error={query.isError}
        rows={query.data?.results}
        rowKey={(r) => r.id}
        empty="No feedback yet."
        columns={[
          { key: "date", header: "Date", render: (r) => formatDate(r.created_at) },
          {
            key: "enterprise",
            header: "Enterprise",
            render: (r) => (
              <Link href={`/admin/assessments/${r.assessment_id}`} className="font-medium text-header hover:underline">
                {r.enterprise_name}
              </Link>
            ),
          },
          { key: "reflects", header: "Score reflects", render: (r) => yesNo(r.score_reflects_enterprise) },
          { key: "prepare", header: "Helps prepare", render: (r) => yesNo(r.would_help_prepare_for_finance) },
          { key: "recommend", header: "Recommend", render: (r) => yesNo(r.would_recommend) },
          { key: "dimension", header: "Most relevant dimension", render: (r) => r.most_relevant_dimension ?? "-" },
          { key: "unclear", header: "Unclear question", render: (r) => r.unclear_question ?? "-" },
          {
            key: "minutes",
            header: "Minutes",
            className: "text-right",
            render: (r) => r.perceived_duration_minutes ?? "-",
          },
          {
            key: "notes",
            header: "Missing factors / notes",
            className: "max-w-xs",
            render: (r) => <span className="whitespace-pre-wrap text-xs">{r.missing_factor_notes || "-"}</span>,
          },
        ]}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} count={query.data?.count} onPage={setPage} />
    </>
  );
}
