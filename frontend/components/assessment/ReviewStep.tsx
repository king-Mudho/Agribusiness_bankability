"use client";

import { Button } from "@/components/ui/Button";
import type { WizardGate } from "@/lib/offline/db";
import { totalQuestionCount, type WizardStep } from "@/lib/wizard/steps";
import type { FrameworkDefinition } from "@/types/api";

export function ReviewStep({
  framework,
  steps,
  responses,
  gates,
  onEditStep,
  onBack,
  onSubmit,
  submitting,
  errorMessage,
}: {
  framework: FrameworkDefinition;
  steps: WizardStep[];
  responses: Record<string, number | null>;
  gates: Record<string, WizardGate>;
  onEditStep: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  errorMessage: string | null;
}) {
  const total = totalQuestionCount(framework);
  const answeredCount = Object.values(responses).filter((v) => v != null).length;
  const allQuestionsAnswered = answeredCount === total;
  const allGatesAnswered = framework.critical_gates.every((g) => gates[g.code]?.result);
  const canSubmit = allQuestionsAnswered && allGatesAnswered && !submitting;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-text">10. Review &amp; submit</h2>

      {framework.dimensions.map((dimension) => {
        const stepIndex = steps.findIndex((s) => s.dimensionCode === dimension.code);
        return (
          <div key={dimension.code} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-text">{dimension.name}</p>
              <button
                type="button"
                onClick={() => onEditStep(stepIndex)}
                className="text-sm text-header underline"
              >
                Edit
              </button>
            </div>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-text-muted">
              {dimension.questions.map((question) => {
                const scaleValue = responses[question.code];
                const optionLabel = question.options.find((o) => o.scale_value === scaleValue)?.label;
                return (
                  <li key={question.code} className="flex justify-between gap-4">
                    <span className="truncate">{question.prompt}</span>
                    <span className="tabular-nums whitespace-nowrap">{optionLabel ?? "Not answered"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-text">Critical gates</p>
          <button
            type="button"
            onClick={() => onEditStep(steps.findIndex((s) => s.kind === "gates"))}
            className="text-sm text-header underline"
          >
            Edit
          </button>
        </div>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-text-muted">
          {framework.critical_gates.map((gate) => (
            <li key={gate.code} className="flex justify-between gap-4">
              <span>{gate.name}</span>
              <span>{gates[gate.code]?.result ?? "Not answered"}</span>
            </li>
          ))}
        </ul>
      </div>

      {!allQuestionsAnswered && (
        <p className="text-sm text-danger">
          {total - answeredCount} question(s) still need an answer before you can submit.
        </p>
      )}
      {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={!canSubmit} onClick={onSubmit}>
          {submitting ? "Submitting..." : "Submit assessment"}
        </Button>
      </div>
    </div>
  );
}
