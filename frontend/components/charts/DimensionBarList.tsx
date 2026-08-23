import type { DimensionScorePayload } from "@/types/api";

export function DimensionBarList({ dimensionScores }: { dimensionScores: DimensionScorePayload[] }) {
  return (
    <div className="flex flex-col gap-3">
      {dimensionScores.map((d) => (
        <div key={d.dimension_code} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-text">
              {d.dimension} <span className="text-text-muted">({d.weight_percent}%)</span>
            </span>
            <span className="tabular-nums font-semibold text-text">{Math.round(d.score)}/100</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-header"
              style={{ width: `${Math.min(100, Math.max(0, d.score))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
