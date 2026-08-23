import type { FrameworkDefinition } from "@/types/api";

export type WizardStepKind = "enterprise" | "consent" | "dimension" | "gates" | "review";

export interface WizardStep {
  kind: WizardStepKind;
  label: string;
  dimensionCode?: string;
  questionStart?: number;
  questionEnd?: number;
}

export function buildWizardSteps(framework: FrameworkDefinition | null): WizardStep[] {
  const steps: WizardStep[] = [
    { kind: "enterprise", label: "Enterprise" },
    { kind: "consent", label: "Consent" },
  ];

  if (framework) {
    let questionIndex = 0;
    for (const dimension of framework.dimensions) {
      const start = questionIndex + 1;
      questionIndex += dimension.questions.length;
      steps.push({
        kind: "dimension",
        label: dimension.name,
        dimensionCode: dimension.code,
        questionStart: start,
        questionEnd: questionIndex,
      });
    }
  }

  steps.push({ kind: "gates", label: "Gates & evidence" });
  steps.push({ kind: "review", label: "Review & submit" });
  return steps;
}

export function totalQuestionCount(framework: FrameworkDefinition | null): number {
  if (!framework) return 0;
  return framework.dimensions.reduce((sum, d) => sum + d.questions.length, 0);
}
