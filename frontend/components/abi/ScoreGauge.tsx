"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

export function ScoreGauge({ score }: { score: number }) {
  const data = [{ name: "score", value: score, fill: "var(--color-accent)" }];

  return (
    <div className="relative h-40 w-40">
      <RadialBarChart
        width={160}
        height={160}
        cx="50%"
        cy="50%"
        innerRadius="70%"
        outerRadius="100%"
        barSize={14}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar dataKey="value" background={{ fill: "var(--color-border)" }} cornerRadius={8} />
      </RadialBarChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-text">{Math.round(score)}</span>
        <span className="text-xs text-text-muted">/ 100</span>
      </div>
    </div>
  );
}
