"use client";

import { useQuery } from "@tanstack/react-query";

import { ExpertReviewForm } from "@/components/admin/ExpertReviewForm";
import { PretestNoteForm } from "@/components/admin/PretestNoteForm";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { frameworksApi } from "@/lib/api/endpoints";

export default function InternalAdminPage() {
  const { isAuthenticated, logout } = useAuth();

  const frameworksQuery = useQuery({
    queryKey: ["framework-versions"],
    queryFn: () => frameworksApi.listVersions(),
    enabled: isAuthenticated,
  });

  return (
    <main className="min-h-screen bg-bg">
      <header className="bg-header px-6 py-4 text-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-header">ABI</span>
          <div>
            <p className="font-semibold">Internal / researcher tools</p>
            <p className="text-xs text-white/80">ABI Demo v0.1 -- research prototype</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {!isAuthenticated ? (
          <LoginForm
            onSuccess={() => frameworksQuery.refetch()}
            description="Internal / researcher tools (expert review, pretest notes, framework versions) require an Analyst, Researcher or Admin account."
          />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex justify-end">
              <button className="text-sm text-header underline" onClick={logout}>
                Sign out
              </button>
            </div>

            <section className="rounded-lg border border-border bg-surface p-4">
              <h2 className="mb-2 font-semibold text-text">Framework versions</h2>
              <p className="mb-2 text-xs text-text-muted">
                Read-only here -- edits to dimensions, questions, weights, gates and
                pathways happen via the Django admin.
              </p>
              <ul className="flex flex-col gap-1 text-sm">
                {frameworksQuery.data?.results.map((fv) => (
                  <li key={fv.version_label} className="flex justify-between">
                    <span className="text-text">Version {fv.version_label}</span>
                    <span className="text-text-muted">{fv.status}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-6 sm:grid-cols-2">
              <ExpertReviewForm
                frameworkVersionLabel={frameworksQuery.data?.results[0]?.version_label ?? "0.1"}
              />
              <PretestNoteForm />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
