import { PilotFeedbackForm } from "@/components/forms/PilotFeedbackForm";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PilotFeedbackForm assessmentId={id} />;
}
