"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DashboardFilters, type DashboardFilterValues } from "@/components/dashboard/DashboardFilters";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { enterpriseChoiceLabel } from "@/config/enterpriseChoices";
import { useAuth } from "@/hooks/useAuth";
import { researchApi } from "@/lib/api/endpoints";

const EMPTY_FILTERS: DashboardFilterValues = {
  value_chain: "",
  province: "",
  readiness_band: "",
  date_from: "",
  date_to: "",
};

function SimpleBarChart({
  data,
  domain,
}: {
  data: { label: string; value: number }[];
  /** [0, 100] for a 0-100 score axis; "auto" lets Recharts scale to the
   * data (e.g. assessment counts, which are not on a 0-100 scale). */
  domain: [number, number] | "auto";
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke="var(--color-border)" horizontal={false} />
          <XAxis
            type="number"
            domain={domain === "auto" ? [0, "dataMax"] : domain}
            allowDecimals={false}
            tick={{ fontSize: 11 }}
          />
          <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="var(--color-header)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** `embedded` hides the view's own sign-out link when it sits inside the
 * admin portal, which has its own. */
export function ResearchLenderView({ embedded = false }: { embedded?: boolean } = {}) {
  const { isAuthenticated, logout } = useAuth();
  const [filters, setFilters] = useState<DashboardFilterValues>(EMPTY_FILTERS);

  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "")
  ) as Record<string, string>;

  const dashboardQuery = useQuery({
    queryKey: ["research-dashboard", queryParams],
    queryFn: () => researchApi.getDashboard(queryParams),
    enabled: isAuthenticated,
    retry: false,
  });

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => dashboardQuery.refetch()} />;
  }

  if (dashboardQuery.isLoading) {
    return <p className="text-center text-text-muted">Loading dashboard...</p>;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="text-center text-danger">
        <p>Could not load the dashboard. Your session may have expired.</p>
        <button className="mt-2 underline" onClick={logout}>
          Sign out and try again
        </button>
      </div>
    );
  }

  const data = dashboardQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">{data.caption}</p>
        {!embedded && (
          <button className="text-sm text-header underline" onClick={logout}>
            Sign out
          </button>
        )}
      </div>

      <DashboardFilters values={filters} onChange={setFilters} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total assessments" value={data.total_assessments} />
        <KpiCard label="Average ABI" value={data.average_abi ?? "-"} />
        {Object.entries(data.band_percentages).map(([band, pct]) => (
          <KpiCard key={band} label={band} value={`${pct}%`} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 font-semibold text-text">Average score by dimension</h3>
          <SimpleBarChart
            domain={[0, 100]}
            data={Object.entries(data.average_score_by_dimension).map(([label, value]) => ({
              label,
              value,
            }))}
          />
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 font-semibold text-text">ABI score distribution</h3>
          <SimpleBarChart
            domain="auto"
            data={Object.entries(data.abi_distribution).map(([label, value]) => ({ label, value }))}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 font-semibold text-text">By value chain</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {data.by_value_chain.map((row) => (
              <li key={row.value_chain} className="flex justify-between">
                <span className="text-text">{enterpriseChoiceLabel(row.value_chain)}</span>
                <span className="tabular-nums text-text-muted">
                  {row.count} firms - avg {row.average_abi ?? "-"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 font-semibold text-text">By province</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {data.by_province.map((row) => (
              <li key={row.province} className="flex justify-between">
                <span className="text-text">{enterpriseChoiceLabel(row.province)}</span>
                <span className="tabular-nums text-text-muted">
                  {row.count} firms - avg {row.average_abi ?? "-"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 font-semibold text-text">Financing needs breakdown</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {Object.entries(data.financing_needs_breakdown).map(([type, count]) => (
              <li key={type} className="flex justify-between">
                <span className="text-text">{enterpriseChoiceLabel(type)}</span>
                <span className="tabular-nums text-text-muted">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 font-semibold text-text">Most common gaps</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {data.most_common_gaps.map((row) => (
              <li key={row.dimension} className="flex justify-between">
                <span className="text-text">{row.dimension}</span>
                <span className="tabular-nums text-text-muted">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 font-semibold text-text">Critical gate failure frequency</h3>
          <p className="mb-1 text-xs text-text-muted">
            Evidence coverage average: {data.evidence_coverage_average ?? "-"}%
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {Object.entries(data.critical_gate_failure_frequency).map(([gate, count]) => (
              <li key={gate} className="flex justify-between">
                <span className="text-text">{gate}</span>
                <span className="tabular-nums text-text-muted">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
