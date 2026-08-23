"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import type { DimensionScorePayload } from "@/types/api";

export function DimensionRadarChart({ dimensionScores }: { dimensionScores: DimensionScorePayload[] }) {
  const data = dimensionScores.map((d) => ({ dimension: d.dimension, score: d.score }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="62%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="ABI score"
            dataKey="score"
            stroke="var(--color-header)"
            fill="var(--color-header)"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
