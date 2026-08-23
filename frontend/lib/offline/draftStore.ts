import { type DraftAssessment, getDb } from "./db";

export async function saveDraft(draft: DraftAssessment): Promise<void> {
  const db = await getDb();
  await db.put("draftAssessments", { ...draft, updatedAt: Date.now() });
}

export async function loadDraft(assessmentId: string): Promise<DraftAssessment | undefined> {
  const db = await getDb();
  return db.get("draftAssessments", assessmentId);
}

export async function deleteDraft(assessmentId: string): Promise<void> {
  const db = await getDb();
  await db.delete("draftAssessments", assessmentId);
}

export function emptyDraft(assessmentId: string, enterpriseId: string | null = null): DraftAssessment {
  return {
    assessmentId,
    enterpriseId,
    currentStep: 0,
    responses: {},
    gates: {},
    evidence: {},
    updatedAt: Date.now(),
  };
}
