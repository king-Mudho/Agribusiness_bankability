"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ReadinessBandPill } from "@/components/abi/ReadinessBandPill";
import { ScoreGauge } from "@/components/abi/ScoreGauge";
import { Button } from "@/components/ui/Button";
import { assessmentsApi } from "@/lib/api/endpoints";
import { LAST_ASSESSMENT_ID_KEY } from "@/lib/constants/storageKeys";

export function AgribusinessView() {
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    setAssessmentId(window.localStorage.getItem(LAST_ASSESSMENT_ID_KEY));
  }, []);

  const resultsQuery = useQuery({
    queryKey: ["assessment-results", assessmentId],
    queryFn: () => assessmentsApi.getResults(assessmentId!),
    enabled: !!assessmentId,
    retry: false,
  });

  if (!assessmentId) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-8 text-center">
        <p className="text-text-muted">
          You haven&apos;t completed an ABI assessment on this device yet.
        </p>
        <Link href="/assessment/new">
          <Button>Start ABI Assessment</Button>
        </Link>
      </div>
    );
  }

  if (resultsQuery.isLoading) {
    return <p className="text-center text-text-muted">Loading your financing readiness...</p>;
  }

  if (resultsQuery.isError || !resultsQuery.data) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-8 text-center">
        <p className="text-text-muted">We couldn&apos;t load your latest assessment.</p>
        <Link href="/assessment/new">
          <Button>Start a new assessment</Button>
        </Link>
      </div>
    );
  }

  const results = resultsQuery.data;

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-8 text-center">
      <p className="text-sm text-text-muted">Your financing readiness</p>
      <ScoreGauge score={results.abi_score} />
      <ReadinessBandPill code={results.readiness_band.code} label={results.readiness_band.label} />
      <Link href={`/results/${assessmentId}`}>
        <Button>View full results</Button>
      </Link>
    </div>
  );
}
