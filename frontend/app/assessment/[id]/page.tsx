import { WizardShell } from "@/components/assessment/WizardShell";

export default async function AssessmentWizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WizardShell assessmentId={id} />;
}
