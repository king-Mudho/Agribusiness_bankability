"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { GateStatusChip } from "@/components/abi/GateStatusChip";
import { ReadinessBandPill } from "@/components/abi/ReadinessBandPill";
import { ScoreGauge } from "@/components/abi/ScoreGauge";
import { DimensionBarList } from "@/components/charts/DimensionBarList";
import { DimensionRadarChart } from "@/components/charts/DimensionRadarChart";
import { TrafficLightPanel } from "@/components/dashboard/TrafficLightPanel";
import { InsightsPanel } from "@/components/results/InsightsPanel";
import { CertificatePanel } from "@/components/reports/CertificatePanel";
import { ReportActions } from "@/components/reports/ReportActions";
import { Button } from "@/components/ui/Button";
import { ResearchDisclaimer } from "@/components/shared/ResearchDisclaimer";
import { enterpriseChoiceLabel } from "@/config/enterpriseChoices";
import { assessmentsApi, enterprisesApi } from "@/lib/api/endpoints";
import type { GateResultValue } from "@/types/api";

/** `embedded` renders just the results body (no page header or public
 * call-to-action buttons) for reuse inside the admin portal. */
export function ResultsView({ assessmentId, embedded = false }: { assessmentId: string; embedded?: boolean }) {
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
    return <div className="p-8 text-center text-text-muted">Loading results...</div>;
  }

  if (resultsQuery.isError || !resultsQuery.data) {
    return (
      <div className="p-8 text-center text-danger">
        Results are not available yet -- this assessment may not have been submitted.
      </div>
    );
  }

  const results = resultsQuery.data;
  const enterprise = enterpriseQuery.data;

  const body = (
      <div className={embedded ? "flex flex-col gap-6" : "mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8"}>
        {/* 1. Score hero */}
        <section className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-6 text-center sm:flex-row sm:justify-center sm:text-left">
          <ScoreGauge score={results.abi_score} />
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <ReadinessBandPill code={results.readiness_band.code} label={results.readiness_band.label} />
            <p className="text-sm text-text-muted">
              Evidence coverage: <span className="tabular-nums font-medium">{Math.round(results.evidence_coverage_percent)}%</span>
            </p>
          </div>
        </section>

        {/* 2. Dimension profile */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-2 text-lg font-semibold text-text">Dimension profile</h2>
            <DimensionRadarChart dimensionScores={results.dimension_scores} />
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-lg font-semibold text-text">Dimension scores</h2>
            <DimensionBarList dimensionScores={results.dimension_scores} />
          </div>
        </section>

        {/* 3-4. Strengths / gaps */}
        <section className="grid gap-4 sm:grid-cols-3">
          <TrafficLightPanel
            tone="success"
            title="Strengths"
            items={results.strengths}
            emptyLabel="No standout dimensions yet."
          />
          <TrafficLightPanel
            tone="warning"
            title="Priority gaps"
            items={results.priority_gaps}
            emptyLabel="No priority gaps identified."
          />
          <TrafficLightPanel
            tone="danger"
            title="Critical gate concerns"
            items={results.critical_gates
              .filter((g) => g.result === "NOT_MET")
              .map((g) => `${g.name}${g.note ? `: ${g.note}` : ""}`)}
            emptyLabel="No critical gate failures."
          />
        </section>

        {/* 4b. Insights: what would move the score */}
        <InsightsPanel results={results} />

        {/* 5. Critical gates */}
        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Critical bankability gates</h2>
            {results.overall_gate_status && (
              <span className="text-sm font-semibold text-text">{results.overall_gate_status}</span>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {results.critical_gates.map((gate) => (
              <li key={gate.code} className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">{gate.name}</span>
                  <GateStatusChip result={gate.result as GateResultValue} />
                </div>
                {gate.note && <p className="text-xs text-text-muted">{gate.note}</p>}
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Bankability action plan */}
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-lg font-semibold text-text">Bankability action plan</h2>
          <ol className="flex flex-col gap-2">
            {results.recommendations.map((rec, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="font-semibold text-header">{index + 1}.</span>
                <div>
                  <span className="font-medium text-text">{rec.dimension}:</span>{" "}
                  <span className="text-text-muted">{rec.text}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 7. Financing pathways */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">Potential financing pathways</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.financing_pathways.map((pathway) => (
              <div key={pathway.code} className="rounded-lg border border-border bg-surface p-4">
                <p className="font-medium text-text">{pathway.name}</p>
                <p className="mt-1 text-sm text-text-muted">{pathway.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Certificate panel */}
        <CertificatePanel enterpriseName={enterprise?.name ?? "Your enterprise"} results={results} />

        {/* 9. Firm profile & actions */}
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

        <ReportActions assessmentId={assessmentId} results={results} showSaveOnDevice={!embedded} />

        {!embedded && (
          <div className="flex flex-wrap gap-3">
            <Link href={`/feedback/${assessmentId}`}>
              <Button variant="secondary">Give pilot feedback</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Go to dashboard</Button>
            </Link>
          </div>
        )}

        <ResearchDisclaimer />
      </div>
  );

  if (embedded) return body;

  return (
    <main className="min-h-screen bg-bg pb-16">
      <header className="sticky top-0 z-10 bg-header px-6 py-4 text-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-header">ABI</span>
          <div>
            <p className="font-semibold">Agribusiness Bankability Index</p>
            <p className="text-xs text-white/80">Results -- ABI Demo v0.1, research prototype</p>
          </div>
        </div>
      </header>
      {body}
    </main>
  );
}
