import { cn } from "@/lib/utils/cn";
import type { WizardStep } from "@/lib/wizard/steps";

export function WizardProgress({
  steps,
  currentStepIndex,
  totalQuestions,
}: {
  steps: WizardStep[];
  currentStepIndex: number;
  totalQuestions: number;
}) {
  const currentStep = steps[currentStepIndex];

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-surface border-b border-border">
      <div className="flex items-center gap-1 overflow-x-auto">
        {steps.map((step, index) => (
          <div
            key={`${step.kind}-${step.dimensionCode ?? index}`}
            className={cn(
              "h-1.5 flex-1 min-w-[16px] rounded-full",
              index < currentStepIndex
                ? "bg-success"
                : index === currentStepIndex
                  ? "bg-header"
                  : "bg-border"
            )}
            title={step.label}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          Step {currentStepIndex + 1} of {steps.length}: {currentStep?.label}
        </span>
        {currentStep?.kind === "dimension" && (
          <span className="tabular-nums">
            Questions {currentStep.questionStart}-{currentStep.questionEnd} of {totalQuestions}
          </span>
        )}
      </div>
    </div>
  );
}
