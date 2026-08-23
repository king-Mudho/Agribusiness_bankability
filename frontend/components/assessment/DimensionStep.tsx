import { Button } from "@/components/ui/Button";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import type { FrameworkDimension } from "@/types/api";

export function DimensionStep({
  dimension,
  responses,
  onAnswer,
  onBack,
  onNext,
}: {
  dimension: FrameworkDimension;
  responses: Record<string, number | null>;
  onAnswer: (questionCode: string, scaleValue: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const allAnswered = dimension.questions.every((q) => responses[q.code] != null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-text">{dimension.name}</h2>
        <p className="text-xs text-text-muted">Weight in overall ABI: {dimension.weight_percent}%</p>
      </div>
      {dimension.questions.map((question) => (
        <QuestionCard
          key={question.code}
          question={question}
          value={responses[question.code] ?? null}
          onChange={(scaleValue) => onAnswer(question.code, scaleValue)}
        />
      ))}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={!allAnswered} onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
