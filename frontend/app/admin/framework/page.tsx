"use client";

import { useQuery } from "@tanstack/react-query";

import { Card, PageHeader } from "@/components/admin/ui";
import { frameworksApi } from "@/lib/api/endpoints";

export default function AdminFrameworkPage() {
  const versions = useQuery({ queryKey: ["framework-versions"], queryFn: () => frameworksApi.listVersions() });
  const definition = useQuery({
    queryKey: ["framework-definition", "active"],
    queryFn: () => frameworksApi.getActiveDefinition(),
  });
  const fw = definition.data;

  return (
    <>
      <PageHeader
        title="Framework"
        description="The scoring methodology the backend applies, read from the database. It is versioned and read-only here: changes go through a new framework version, not edits to the live one."
      />

      <Card title="Versions">
        <ul className="flex flex-col gap-1 text-sm">
          {versions.data?.results.map((v) => (
            <li key={v.version_label} className="flex justify-between border-b border-border py-1 last:border-0">
              <span className="font-medium">Version {v.version_label}</span>
              <span className="text-text-muted">{v.status}</span>
            </li>
          )) ?? <li className="text-text-muted">Loading...</li>}
        </ul>
      </Card>

      {fw && (
        <>
          <Card title={`Dimensions and weights (version ${fw.version_label})`}>
            <div className="flex flex-col gap-4">
              {fw.dimensions.map((d) => (
                <details key={d.code} className="rounded-md border border-border p-3">
                  <summary className="flex cursor-pointer items-center justify-between gap-2">
                    <span className="font-medium text-text">{d.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-text-muted">{d.questions.length} questions</span>
                      <span className="rounded-full bg-header px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
                        {Number(d.weight_percent)}%
                      </span>
                    </span>
                  </summary>
                  <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm">
                    {d.questions.map((q) => (
                      <li key={q.code}>
                        <p className="text-text">
                          {q.prompt} <span className="text-xs text-text-muted">({q.code})</span>
                        </p>
                        <p className="text-xs text-text-muted">
                          {q.options.map((o) => `${o.scale_value}: ${o.label}`).join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Readiness bands">
              <ul className="flex flex-col gap-1 text-sm">
                {fw.readiness_bands.map((b) => (
                  <li key={b.code} className="flex justify-between border-b border-border py-1 last:border-0">
                    <span>{b.label}</span>
                    <span className="tabular-nums text-text-muted">
                      {b.min}-{b.max}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Critical bankability gates">
              <ul className="flex flex-col gap-2 text-sm">
                {fw.critical_gates.map((g) => (
                  <li key={g.code}>
                    <p className="font-medium text-text">{g.name}</p>
                    <p className="text-xs text-text-muted">{g.description}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
      {definition.isError && <p className="text-danger">Could not load the framework.</p>}
    </>
  );
}
