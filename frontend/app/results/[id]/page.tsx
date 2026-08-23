export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <main className="p-8">Results screen for {id} -- built in Phase 9.</main>;
}
