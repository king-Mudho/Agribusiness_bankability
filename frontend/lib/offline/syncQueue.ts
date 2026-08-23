import { assessmentsApi } from "@/lib/api/endpoints";

import { getDb, type SyncOperationType, type SyncQueueItem } from "./db";

export async function enqueue(
  assessmentId: string,
  type: SyncOperationType,
  payload: unknown
): Promise<void> {
  const db = await getDb();
  await db.add("syncQueue", { assessmentId, type, payload, createdAt: Date.now() });
}

export async function getQueueForAssessment(assessmentId: string): Promise<SyncQueueItem[]> {
  const db = await getDb();
  return db.getAllFromIndex("syncQueue", "by-assessment", assessmentId);
}

async function runOperation(item: SyncQueueItem): Promise<void> {
  switch (item.type) {
    case "responses":
      await assessmentsApi.putResponses(
        item.assessmentId,
        item.payload as Parameters<typeof assessmentsApi.putResponses>[1]
      );
      break;
    case "gates":
      await assessmentsApi.putGates(
        item.assessmentId,
        item.payload as Parameters<typeof assessmentsApi.putGates>[1]
      );
      break;
    case "evidence":
      await assessmentsApi.putEvidence(
        item.assessmentId,
        item.payload as Parameters<typeof assessmentsApi.putEvidence>[1]
      );
      break;
    case "submit":
      await assessmentsApi.submit(item.assessmentId);
      break;
  }
}

/** Replays every queued operation in order, oldest first. Stops (and keeps
 * remaining items queued) on the first failure so a flaky connection never
 * silently drops writes -- the next `navigator.onLine` event retries.
 */
export async function flushQueue(): Promise<{ succeeded: number; remaining: number }> {
  const db = await getDb();
  const all = await db.getAll("syncQueue");
  all.sort((a, b) => a.createdAt - b.createdAt);

  let succeeded = 0;
  for (const item of all) {
    try {
      await runOperation(item);
      if (item.id !== undefined) {
        await db.delete("syncQueue", item.id);
      }
      succeeded += 1;
    } catch {
      break;
    }
  }
  const remaining = await db.count("syncQueue");
  return { succeeded, remaining };
}
