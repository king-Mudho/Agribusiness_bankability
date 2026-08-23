import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Tone = "success" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success/40 bg-success/10",
  warning: "border-warning/40 bg-warning/10",
  danger: "border-danger/40 bg-danger/10",
};

const TONE_TEXT: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function TrafficLightPanel({
  tone,
  title,
  items,
  emptyLabel,
}: {
  tone: Tone;
  title: string;
  items: ReactNode[];
  emptyLabel: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-lg border p-4", TONE_CLASSES[tone])}>
      <h3 className={cn("text-sm font-semibold", TONE_TEXT[tone])}>{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm text-text">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2">
              <span className={TONE_TEXT[tone]}>•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
