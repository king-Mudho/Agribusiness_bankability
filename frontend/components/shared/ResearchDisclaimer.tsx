import { RESEARCH_PROTOTYPE_DISCLAIMER } from "@/lib/constants/disclaimers";

export function ResearchDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={`text-sm text-text-muted border border-border rounded-md bg-surface p-3 ${className ?? ""}`}
      data-testid="research-disclaimer"
    >
      {RESEARCH_PROTOTYPE_DISCLAIMER}
    </p>
  );
}
