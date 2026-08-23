"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { assessmentsApi, frameworksApi } from "@/lib/api/endpoints";
import type { PilotFeedbackPayload } from "@/types/api";

const YES_NO = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <SelectField
      label={label}
      placeholder="Select..."
      options={YES_NO}
      value={value === null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value === "true")}
    />
  );
}

export function PilotFeedbackForm({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const frameworkQuery = useQuery({
    queryKey: ["framework-active"],
    queryFn: frameworksApi.getActiveDefinition,
  });

  const [scoreReflects, setScoreReflects] = useState<boolean | null>(null);
  const [mostRelevant, setMostRelevant] = useState("");
  const [unclearQuestion, setUnclearQuestion] = useState("");
  const [missingFactor, setMissingFactor] = useState("");
  const [wouldHelp, setWouldHelp] = useState<boolean | null>(null);
  const [willingEvidence, setWillingEvidence] = useState<boolean | null>(null);
  const [duration, setDuration] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (frameworkQuery.isLoading) {
    return <p className="text-center text-text-muted">Loading...</p>;
  }
  if (submitted) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-text">Thank you</h2>
        <p className="mt-2 text-text-muted">
          Your feedback helps validate the ABI methodology ahead of the next version.
        </p>
        <Button className="mt-4" onClick={() => router.push(`/results/${assessmentId}`)}>
          Back to results
        </Button>
      </div>
    );
  }

  const framework = frameworkQuery.data;
  const allQuestions = framework?.dimensions.flatMap((d) => d.questions) ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: PilotFeedbackPayload = {
      score_reflects_enterprise: scoreReflects,
      most_relevant_dimension: mostRelevant || null,
      unclear_question: unclearQuestion || null,
      missing_factor_notes: missingFactor,
      would_help_prepare_for_finance: wouldHelp,
      willing_to_provide_evidence_later: willingEvidence,
      perceived_duration_minutes: duration ? Number(duration) : null,
      would_recommend: wouldRecommend,
    };
    try {
      await assessmentsApi.submitFeedback(assessmentId, payload);
      setSubmitted(true);
    } catch {
      setError("Could not submit your feedback -- please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg flex-col gap-5 p-6">
      <div>
        <h2 className="text-xl font-semibold text-text">Pilot feedback</h2>
        <p className="text-sm text-text-muted">
          This is separate from the assessment itself and should take under two minutes.
        </p>
      </div>

      <YesNoField
        label="Does this score reasonably reflect your enterprise?"
        value={scoreReflects}
        onChange={setScoreReflects}
      />

      {framework && (
        <SelectField
          label="Which dimension was most relevant to your business?"
          placeholder="Select..."
          options={framework.dimensions.map((d) => ({ value: d.code, label: d.name }))}
          value={mostRelevant}
          onChange={(e) => setMostRelevant(e.target.value)}
        />
      )}

      <SelectField
        label="Which question was unclear, if any? (optional)"
        placeholder="None"
        options={allQuestions.map((q) => ({ value: q.code, label: q.prompt }))}
        value={unclearQuestion}
        onChange={(e) => setUnclearQuestion(e.target.value)}
      />

      <TextAreaField
        label="Is an important bankability factor missing from this assessment? (optional)"
        value={missingFactor}
        onChange={(e) => setMissingFactor(e.target.value)}
      />

      <YesNoField
        label="Would this assessment help you prepare for finance?"
        value={wouldHelp}
        onChange={setWouldHelp}
      />
      <YesNoField
        label="Would you be willing to provide documentary evidence later?"
        value={willingEvidence}
        onChange={setWillingEvidence}
      />
      <TextField
        label="How long did the assessment feel like it took? (minutes)"
        type="number"
        min={0}
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
      />
      <YesNoField
        label="Would you recommend the ABI assessment to another enterprise?"
        value={wouldRecommend}
        onChange={setWouldRecommend}
      />

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit feedback"}
      </Button>
    </form>
  );
}
