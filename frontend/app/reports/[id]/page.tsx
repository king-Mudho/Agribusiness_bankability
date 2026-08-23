export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <main className="p-8">Report preview for {id} -- built in Phase 11.</main>;
}
