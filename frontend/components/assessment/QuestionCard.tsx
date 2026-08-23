import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { FrameworkQuestion } from "@/types/api";

export function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: FrameworkQuestion;
  value: number | null;
  onChange: (scaleValue: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-medium text-text">{question.prompt}</p>
      <SegmentedControl
        name={question.code}
        aria-label={question.prompt}
        value={value !== null ? String(value) : null}
        onChange={(v) => onChange(Number(v))}
        options={question.options.map((opt) => ({
          value: String(opt.scale_value),
          label: opt.label,
        }))}
      />
    </div>
  );
}
