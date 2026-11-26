"use client";

import { PageHeader } from "@/components/admin/ui";
import { ResearchLenderView } from "@/components/dashboard/ResearchLenderView";

export default function AdminInsightsPage() {
  return (
    <>
      <PageHeader
        title="Insights dashboard"
        description="Aggregate, anonymised view of all scored assessments: averages, band shares, dimension profile, common gaps and gate failures. Filter by value chain, province, band or date."
      />
      <ResearchLenderView embedded />
    </>
  );
}
