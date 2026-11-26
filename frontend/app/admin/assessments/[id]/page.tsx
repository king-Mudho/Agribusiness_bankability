"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

import { Card, StatusBadge, formatDate } from "@/components/admin/ui";
import { ResultsView } from "@/components/results/ResultsView";
import { enterpriseChoiceLabel } from "@/config/enterpriseChoices";
import { assessmentsApi, enterprisesApi } from "@/lib/api/endpoints";

export default function AdminAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const assessmentQuery = useQuery({ queryKey: ["assessment", id], queryFn: () => assessmentsApi.get(id) });
  const enterpriseQuery = useQuery({
    queryKey: ["enterprise", assessmentQuery.data?.enterprise],
    queryFn: () => enterprisesApi.get(assessmentQuery.data!.enterprise),
    enabled: !!assessmentQuery.data?.enterprise,
  });

  const assessment = assessmentQuery.data;
  const enterprise = enterpriseQuery.data;
  const profile = enterprise?.profile;

  return (
    <>
      <Link href="/admin/assessments" className="inline-flex items-center gap-1 text-sm text-header hover:underline">
        <ArrowLeft size={16} aria-hidden /> All assessments
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-text">{enterprise?.name ?? "Assessment"}</h1>
        {assessment && <StatusBadge status={assessment.status} />}
      </div>

      <Card title="Enterprise and assessment details">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-4">
          {[
            ["Enterprise code", enterprise?.code],
            ["Value chain", enterpriseChoiceLabel(enterprise?.value_chain)],
            ["Province", enterpriseChoiceLabel(enterprise?.province)],
            ["District", enterprise?.district || "-"],
            ["Organisation type", enterpriseChoiceLabel(enterprise?.organisation_type)],
            ["Years operating", enterprise?.years_operating],
            ["Workers", enterprise?.workers_count],
            ["Turnover band", enterpriseChoiceLabel(enterprise?.turnover_band)],
            [
              "Finance sought",
              profile ? `${profile.finance_required_currency ?? ""} ${Number(profile.finance_required_amount).toLocaleString()}` : "-",
            ],
            ["Finance type", enterpriseChoiceLabel(profile?.finance_type_sought)],
            ["Consent", profile ? (profile.consent_given ? "Given" : "Not given") : "-"],
            ["Framework version", assessment?.framework_version_label ?? assessment?.framework_version],
            ["Started", formatDate(assessment?.started_at, true)],
            ["Submitted", formatDate(assessment?.submitted_at, true)],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="text-xs text-text-muted">{label}</dt>
              <dd className="font-medium text-text">{(value as string | number | undefined) ?? "-"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {assessment?.status === "SCORED" ? (
        <ResultsView assessmentId={id} embedded />
      ) : assessment ? (
        <Card>
          <p className="text-sm text-text-muted">
            This assessment has not been scored yet, so there are no results or reports to show.
          </p>
        </Card>
      ) : assessmentQuery.isError ? (
        <p className="text-danger">Could not load this assessment.</p>
      ) : (
        <p className="text-text-muted">Loading...</p>
      )}
    </>
  );
}
