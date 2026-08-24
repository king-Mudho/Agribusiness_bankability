"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ReadinessBandPill } from "@/components/abi/ReadinessBandPill";
import { ScoreGauge } from "@/components/abi/ScoreGauge";
import { CertificatePanel } from "@/components/reports/CertificatePanel";
import { ReportActions } from "@/components/reports/ReportActions";
import { ResearchDisclaimer } from "@/components/shared/ResearchDisclaimer";
import { Button } from "@/components/ui/Button";
import { enterpriseChoiceLabel } from "@/config/enterpriseChoices";
import { assessmentsApi, enterprisesApi } from "@/lib/api/endpoints";

export function ReportPreview({ assessmentId }: { assessmentId: string }) {
  const resultsQuery = useQuery({
    queryKey: ["assessment-results", assessmentId],
    queryFn: () => assessmentsApi.getResults(assessmentId),
  });

  const assessmentQuery = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: () => assessmentsApi.get(assessmentId),
  });

  const enterpriseQuery = useQuery({
    queryKey: ["enterprise", assessmentQuery.data?.enterprise],
    queryFn: () => enterprisesApi.get(assessmentQuery.data!.enterprise),
    enabled: !!assessmentQuery.data?.enterprise,
  });

  if (resultsQuery.isLoading || assessmentQuery.isLoading) {
    return <div className="p-8 text-center text-text-muted">Loading report preview...</div>;
  }

  if (resultsQuery.isError || !resultsQuery.data) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-danger">
          This report isn&apos;t available yet -- the assessment may not have been submitted.
        </p>
        <Button variant="outline" onClick={() => resultsQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const results = resultsQuery.data;
  const enterprise = enterpriseQuery.data;

  return (
    <main className="min-h-screen bg-bg pb-16">
      <header className="sticky top-0 z-10 bg-header px-6 py-4 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-header">ABI</span>
          <div>
            <p className="font-semibold">Agribusiness Bankability Index</p>
            <p className="text-xs text-white/80">Report preview -- ABI Demo v0.1, research prototype</p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <section className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-6 text-center sm:flex-row sm:justify-center sm:text-left">
          <ScoreGauge score={results.abi_score} />
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <ReadinessBandPill code={results.readiness_band.code} label={results.readiness_band.label} />
            <p className="text-sm text-text-muted">
              Evidence coverage:{" "}
              <span className="tabular-nums font-medium">{Math.round(results.evidence_coverage_percent)}%</span>
            </p>
          </div>
        </section>

        {enterprise && (
          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-2 text-lg font-semibold text-text">Firm profile</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-text-muted">Firm</dt>
                <dd className="font-medium text-text">{enterprise.name}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Value chain</dt>
                <dd className="font-medium text-text">{enterpriseChoiceLabel(enterprise.value_chain)}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Province</dt>
                <dd className="font-medium text-text">{enterpriseChoiceLabel(enterprise.province)}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Finance sought</dt>
                <dd className="font-medium text-text">
                  {enterpriseChoiceLabel(enterprise.profile?.finance_type_sought)}
                </dd>
              </div>
            </dl>
          </section>
        )}

        <CertificatePanel enterpriseName={enterprise?.name ?? "Your enterprise"} results={results} />

        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-lg font-semibold text-text">Download this report</h2>
          <ReportActions assessmentId={assessmentId} results={results} />
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={`/results/${assessmentId}`}>
            <Button variant="outline">Back to full results</Button>
          </Link>
        </div>

        <ResearchDisclaimer />
      </div>
    </main>
  );
}
