import { beforeEach, describe, expect, it } from "vitest";

import { deleteDraft, emptyDraft, loadDraft, saveDraft } from "@/lib/offline/draftStore";

describe("draftStore", () => {
  const assessmentId = "test-assessment-1";

  beforeEach(async () => {
    await deleteDraft(assessmentId);
  });

  it("persists a response to IndexedDB and survives a simulated reload", async () => {
    const draft = emptyDraft(assessmentId, "enterprise-1");
    draft.responses["fin_01"] = { questionCode: "fin_01", scaleValue: 4 };
    draft.currentStep = 3;

    await saveDraft(draft);

    // Simulate a reload: read the draft back from IndexedDB as a fresh load
    // would, with no in-memory state carried over.
    const reloaded = await loadDraft(assessmentId);

    expect(reloaded).toBeDefined();
    expect(reloaded?.responses["fin_01"]).toEqual({ questionCode: "fin_01", scaleValue: 4 });
    expect(reloaded?.currentStep).toBe(3);
    expect(reloaded?.enterpriseId).toBe("enterprise-1");
  });

  it("returns undefined for a draft that was never saved", async () => {
    const reloaded = await loadDraft("never-saved");
    expect(reloaded).toBeUndefined();
  });

  it("overwrites the previous draft on each save (latest wins)", async () => {
    const draft = emptyDraft(assessmentId);
    draft.responses["fin_01"] = { questionCode: "fin_01", scaleValue: 2 };
    await saveDraft(draft);

    draft.responses["fin_01"] = { questionCode: "fin_01", scaleValue: 5 };
    await saveDraft(draft);

    const reloaded = await loadDraft(assessmentId);
    expect(reloaded?.responses["fin_01"].scaleValue).toBe(5);
  });
});
