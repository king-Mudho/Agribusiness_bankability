export default async function AssessmentWizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <main className="p-8">Assessment wizard for {id} -- built in Phase 8.</main>;
}
