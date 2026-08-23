"use client";

import { create } from "zustand";

import { type DraftAssessment, type WizardGate } from "@/lib/offline/db";
import { emptyDraft, loadDraft, saveDraft } from "@/lib/offline/draftStore";
import type { EnterpriseFormValues } from "@/lib/validation/enterpriseSchema";
import type { FrameworkDefinition } from "@/types/api";

interface WizardStore {
  assessmentId: string | null;
  enterpriseId: string | null;
  enterpriseDraft: Partial<EnterpriseFormValues>;
  consentGiven: boolean;
  framework: FrameworkDefinition | null;
  currentStepIndex: number;
  responses: DraftAssessment["responses"];
  gates: DraftAssessment["gates"];
  evidence: DraftAssessment["evidence"];
  hydrated: boolean;

  hydrate: (assessmentId: string) => Promise<void>;
  setFramework: (framework: FrameworkDefinition) => void;
  setEnterpriseDraft: (values: Partial<EnterpriseFormValues>) => void;
  setConsentGiven: (given: boolean) => void;
  promoteToRealAssessment: (assessmentId: string, enterpriseId: string) => Promise<void>;
  setResponse: (questionCode: string, scaleValue: number) => void;
  setGate: (gateCode: string, result: WizardGate["result"], note?: string) => void;
  setEvidence: (dimensionCode: string, level: number) => void;
  goToStep: (index: number) => void;
  reset: (newAssessmentId: string) => void;
}

async function persist(state: WizardStore) {
  if (!state.assessmentId) return;
  const draft: DraftAssessment = {
    assessmentId: state.assessmentId,
    enterpriseId: state.enterpriseId,
    enterpriseDraft: state.enterpriseDraft,
    consentGiven: state.consentGiven,
    frameworkVersionLabel: state.framework?.version_label ?? null,
    currentStep: state.currentStepIndex,
    responses: state.responses,
    gates: state.gates,
    evidence: state.evidence,
    updatedAt: Date.now(),
  };
  await saveDraft(draft);
}

export const useWizardStore = create<WizardStore>((set, get) => ({
  assessmentId: null,
  enterpriseId: null,
  enterpriseDraft: {},
  consentGiven: false,
  framework: null,
  currentStepIndex: 0,
  responses: {},
  gates: {},
  evidence: {},
  hydrated: false,

  hydrate: async (assessmentId) => {
    const existing = await loadDraft(assessmentId);
    const draft = existing ?? emptyDraft(assessmentId);
    set({
      assessmentId: draft.assessmentId,
      enterpriseId: draft.enterpriseId,
      enterpriseDraft: draft.enterpriseDraft as Partial<EnterpriseFormValues>,
      consentGiven: draft.consentGiven,
      currentStepIndex: draft.currentStep,
      responses: draft.responses,
      gates: draft.gates,
      evidence: draft.evidence,
      hydrated: true,
    });
  },

  setFramework: (framework) => set({ framework }),

  setEnterpriseDraft: (values) => {
    set((state) => ({ enterpriseDraft: { ...state.enterpriseDraft, ...values } }));
    void persist(get());
  },

  setConsentGiven: (given) => {
    set({ consentGiven: given });
    void persist(get());
  },

  promoteToRealAssessment: async (assessmentId, enterpriseId) => {
    const previousId = get().assessmentId;
    set({ assessmentId, enterpriseId });
    await persist(get());
    if (previousId && previousId !== assessmentId) {
      const { deleteDraft } = await import("@/lib/offline/draftStore");
      await deleteDraft(previousId);
    }
  },

  setResponse: (questionCode, scaleValue) => {
    set((state) => ({
      responses: { ...state.responses, [questionCode]: { questionCode, scaleValue } },
    }));
    void persist(get());
  },

  setGate: (gateCode, result, note) => {
    set((state) => ({
      gates: { ...state.gates, [gateCode]: { gateCode, result, note: note ?? state.gates[gateCode]?.note } },
    }));
    void persist(get());
  },

  setEvidence: (dimensionCode, level) => {
    set((state) => ({
      evidence: {
        ...state.evidence,
        [dimensionCode]: { dimensionCode, evidenceLevel: level },
      },
    }));
    void persist(get());
  },

  goToStep: (index) => {
    set({ currentStepIndex: index });
    void persist(get());
  },

  reset: (newAssessmentId) => {
    set({
      assessmentId: newAssessmentId,
      enterpriseId: null,
      enterpriseDraft: {},
      consentGiven: false,
      framework: null,
      currentStepIndex: 0,
      responses: {},
      gates: {},
      evidence: {},
      hydrated: true,
    });
    void persist(get());
  },
}));
