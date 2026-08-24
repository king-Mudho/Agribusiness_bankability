import { ReportPreview } from "@/components/reports/ReportPreview";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportPreview assessmentId={id} />;
}
