export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <main className="p-8">Pilot feedback form for {id} -- built in Phase 12.</main>;
}
