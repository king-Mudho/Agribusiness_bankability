"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ExpertReviewForm } from "@/components/admin/ExpertReviewForm";
import { PretestNoteForm } from "@/components/admin/PretestNoteForm";
import { DataTable, PageHeader, Pagination, formatDate } from "@/components/admin/ui";
import { useMe } from "@/hooks/useMe";
import { adminApi } from "@/lib/api/admin";
import { frameworksApi } from "@/lib/api/endpoints";
import type { AdminExpertReviewRow, AdminPretestNoteRow } from "@/types/admin";

const PAGE_SIZE = 10;

function SubmittedLists() {
  const [reviewPage, setReviewPage] = useState(1);
  const [notePage, setNotePage] = useState(1);
  const reviews = useQuery({
    queryKey: ["admin", "expert-reviews", reviewPage],
    queryFn: () => adminApi.expertReviews({ page: reviewPage, page_size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const notes = useQuery({
    queryKey: ["admin", "pretest-notes", notePage],
    queryFn: () => adminApi.pretestNotes({ page: notePage, page_size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <h2 className="text-lg font-semibold text-text">Expert reviews</h2>
      <DataTable<AdminExpertReviewRow>
        loading={reviews.isLoading}
        error={reviews.isError}
        rows={reviews.data?.results}
        rowKey={(r) => r.id}
        empty="No expert reviews yet."
        columns={[
          { key: "date", header: "Date", render: (r) => formatDate(r.created_at) },
          {
            key: "reviewer",
            header: "Reviewer",
            render: (r) => (
              <div>
                <p className="font-medium">{r.reviewer_name}</p>
                <p className="text-xs text-text-muted">{r.reviewer_affiliation || "-"}</p>
              </div>
            ),
          },
          { key: "version", header: "Framework", render: (r) => r.framework_version },
          { key: "comments", header: "Comments", className: "max-w-md", render: (r) => <span className="whitespace-pre-wrap text-xs">{r.comments}</span> },
          {
            key: "weights",
            header: "Suggested weights",
            render: (r) =>
              r.suggested_weight_changes ? (
                <span className="text-xs">
                  {Object.entries(r.suggested_weight_changes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}
                </span>
              ) : (
                "-"
              ),
          },
        ]}
      />
      <Pagination page={reviewPage} pageSize={PAGE_SIZE} count={reviews.data?.count} onPage={setReviewPage} />

      <h2 className="text-lg font-semibold text-text">Cognitive pretest notes</h2>
      <DataTable<AdminPretestNoteRow>
        loading={notes.isLoading}
        error={notes.isError}
        rows={notes.data?.results}
        rowKey={(r) => r.id}
        empty="No pretest notes yet."
        columns={[
          { key: "date", header: "Date", render: (r) => formatDate(r.created_at) },
          { key: "observer", header: "Observer", render: (r) => r.observer_name },
          { key: "question", header: "Question", render: (r) => r.question ?? "-" },
          { key: "enterprise", header: "Enterprise", render: (r) => r.enterprise_code ?? "-" },
          { key: "observation", header: "Observation", className: "max-w-md", render: (r) => <span className="whitespace-pre-wrap text-xs">{r.observation}</span> },
          { key: "rating", header: "Usefulness", className: "text-right", render: (r) => r.perceived_usefulness_rating ?? "-" },
        ]}
      />
      <Pagination page={notePage} pageSize={PAGE_SIZE} count={notes.data?.count} onPage={setNotePage} />
    </>
  );
}

export default function AdminResearchPage() {
  const me = useMe();
  const frameworksQuery = useQuery({ queryKey: ["framework-versions"], queryFn: () => frameworksApi.listVersions() });

  return (
    <>
      <PageHeader
        title="Research tools"
        description="Record expert reviews of the framework and cognitive pretest observations for the validation study."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ExpertReviewForm frameworkVersionLabel={frameworksQuery.data?.results[0]?.version_label ?? "0.1"} />
        <PretestNoteForm />
      </div>
      {me.data?.role === "ADMIN" && <SubmittedLists />}
    </>
  );
}
