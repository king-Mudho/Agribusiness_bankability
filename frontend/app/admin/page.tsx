"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Card, DataTable, PageHeader, StatCard, StatusBadge, formatDate } from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import type { AdminAssessmentRow } from "@/types/admin";

function pct(value: number | null): string {
  return value === null ? "-" : `${value}%`;
}

export default function AdminOverviewPage() {
  const query = useQuery({ queryKey: ["admin", "overview"], queryFn: () => adminApi.overview() });
  const data = query.data;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Everything collected by the ABI research prototype, in one place. Open a section on the left for detail, downloads and exports."
      />

      {query.isError && <p className="text-danger">Could not load the overview.</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Assessments"
          value={data?.counts.assessments ?? "-"}
          hint={data ? `${data.counts.scored} scored, ${data.counts.drafts} drafts` : undefined}
        />
        <StatCard
          label="Enterprises"
          value={data?.counts.enterprises ?? "-"}
          hint={data ? `${data.counts.consented_enterprises} gave consent` : undefined}
        />
        <StatCard
          label="Reports generated"
          value={data?.counts.reports ?? "-"}
          hint={
            data
              ? Object.entries(data.reports_by_type)
                  .map(([type, n]) => `${n} ${type}`)
                  .join(", ") || "None yet"
              : undefined
          }
        />
        <StatCard label="Pilot feedback" value={data?.counts.feedback ?? "-"} />
        <StatCard label="Expert reviews" value={data?.counts.expert_reviews ?? "-"} />
        <StatCard label="Pretest notes" value={data?.counts.pretest_notes ?? "-"} />
        <StatCard label="Active users" value={data?.counts.users ?? "-"} />
        <StatCard label="Submitted, awaiting score" value={data?.counts.submitted ?? "-"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Latest assessments"
          className="lg:col-span-2"
          actions={
            <Link href="/admin/assessments" className="text-sm text-header underline">
              View all
            </Link>
          }
        >
          <DataTable<AdminAssessmentRow>
            loading={query.isLoading}
            rows={data?.recent_assessments}
            rowKey={(r) => r.id}
            columns={[
              {
                key: "enterprise",
                header: "Enterprise",
                render: (r) => (
                  <Link href={`/admin/assessments/${r.id}`} className="font-medium text-header hover:underline">
                    {r.enterprise_name}
                  </Link>
                ),
              },
              { key: "chain", header: "Value chain", render: (r) => r.value_chain_label },
              { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
              {
                key: "abi",
                header: "ABI",
                className: "text-right",
                render: (r) => (r.abi_score === null ? "-" : <span className="tabular-nums font-semibold">{Math.round(r.abi_score)}</span>),
              },
              { key: "band", header: "Readiness", render: (r) => r.readiness_band_label ?? "-" },
              { key: "date", header: "Started", render: (r) => formatDate(r.started_at) },
            ]}
          />
        </Card>

        <Card title="Pilot feedback at a glance">
          {data && data.feedback_summary.total > 0 ? (
            <dl className="flex flex-col gap-3 text-sm">
              {[
                ["Score reflects the enterprise", data.feedback_summary.score_reflects_enterprise_percent],
                ["Would help prepare for finance", data.feedback_summary.would_help_prepare_percent],
                ["Would recommend", data.feedback_summary.would_recommend_percent],
                ["Willing to provide evidence later", data.feedback_summary.willing_to_provide_evidence_percent],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">{label}</dt>
                    <dd className="font-semibold tabular-nums">{pct(value as number | null)}</dd>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
                    <div className="h-full rounded-full bg-header" style={{ width: `${(value as number | null) ?? 0}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-text-muted">Share of &quot;yes&quot; among {data.feedback_summary.total} responses.</p>
            </dl>
          ) : (
            <p className="text-sm text-text-muted">No pilot feedback yet.</p>
          )}
          <Link href="/admin/feedback" className="mt-3 inline-block text-sm text-header underline">
            Open feedback
          </Link>
        </Card>
      </div>
    </>
  );
}
