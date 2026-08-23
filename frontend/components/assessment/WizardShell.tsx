"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConsentForm } from "@/components/forms/ConsentForm";
import { EnterpriseIntakeForm } from "@/components/forms/EnterpriseIntakeForm";
import { DimensionStep } from "@/components/assessment/DimensionStep";
import { GatesEvidenceStep } from "@/components/assessment/GatesEvidenceStep";
import { ReviewStep } from "@/components/assessment/ReviewStep";
import { WizardProgress } from "@/components/assessment/WizardProgress";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { assessmentsApi, enterprisesApi, frameworksApi } from "@/lib/api/endpoints";
import type { WizardGate } from "@/lib/offline/db";
import { enqueue } from "@/lib/offline/syncQueue";
import { isLocalAssessmentId } from "@/lib/wizard/localId";
import { useWizardStore } from "@/lib/wizard/store";
import { buildWizardSteps, totalQuestionCount } from "@/lib/wizard/steps";
import type { EnterpriseFormValues } from "@/lib/validation/enterpriseSchema";

export function WizardShell({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const store = useWizardStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void store.hydrate(assessmentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const frameworkQuery = useQuery({
    queryKey: ["framework-active"],
    queryFn: frameworksApi.getActiveDefinition,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (frameworkQuery.data) store.setFramework(frameworkQuery.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameworkQuery.data]);

  async function ensureRemoteAssessment(): Promise<{ enterpriseId: string; assessmentId: string } | null> {
    const current = useWizardStore.getState();
    if (current.enterpriseId && current.assessmentId && !isLocalAssessmentId(current.assessmentId)) {
      return { enterpriseId: current.enterpriseId, assessmentId: current.assessmentId };
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) return null;
    const draft = current.enterpriseDraft;
    if (!draft.name || !draft.value_chain || !draft.province || !draft.finance_required_amount) {
      return null; // enterprise step not completed yet
    }
    try {
      const enterprise = await enterprisesApi.create({
        name: draft.name,
        organisation_type: draft.organisation_type ?? "OTHER",
        value_chain: draft.value_chain,
        province: draft.province,
        district: draft.district ?? "",
        years_operating: draft.years_operating ?? 0,
        workers_count: draft.workers_count ?? 0,
        turnover_band: draft.turnover_band ?? "UNDER_10K",
        profile: {
          finance_required_amount: String(draft.finance_required_amount),
          finance_type_sought: draft.finance_type_sought ?? "OTHER",
          preferred_financier_type: draft.preferred_financier_type ?? "OTHER",
          intended_use: draft.intended_use ?? "",
          previous_borrowing: draft.previous_borrowing ?? false,
          previous_borrowing_notes: draft.previous_borrowing_notes ?? "",
          consent_given: current.consentGiven,
        },
      });
      const assessment = await assessmentsApi.create(
        enterprise.id,
        frameworkQuery.data?.version_label
      );
      await store.promoteToRealAssessment(assessment.id, enterprise.id);
      router.replace(`/assessment/${assessment.id}`);

      const responseItems = Object.values(current.responses).map((r) => ({
        question_code: r.questionCode,
        scale_value: r.scaleValue,
      }));
      if (responseItems.length) await assessmentsApi.putResponses(assessment.id, responseItems);

      const gateItems = Object.values(current.gates).map((g) => ({
        gate_code: g.gateCode,
        result: g.result,
        note: g.note,
      }));
      if (gateItems.length) await assessmentsApi.putGates(assessment.id, gateItems);

      const evidenceItems = Object.values(current.evidence).map((e) => ({
        question_code: e.questionCode,
        dimension_code: e.dimensionCode,
        evidence_level: e.evidenceLevel,
        description: e.description,
      }));
      if (evidenceItems.length) await assessmentsApi.putEvidence(assessment.id, evidenceItems);

      return { enterpriseId: enterprise.id, assessmentId: assessment.id };
    } catch {
      return null;
    }
  }

  async function syncResponse(questionCode: string, scaleValue: number) {
    const remote = await ensureRemoteAssessment();
    if (!remote) return;
    try {
      await assessmentsApi.putResponses(remote.assessmentId, [
        { question_code: questionCode, scale_value: scaleValue },
      ]);
    } catch {
      await enqueue(remote.assessmentId, "responses", [
        { question_code: questionCode, scale_value: scaleValue },
      ]);
    }
  }

  async function syncGate(gateCode: string, result: WizardGate["result"], note?: string) {
    const remote = await ensureRemoteAssessment();
    if (!remote) return;
    try {
      await assessmentsApi.putGates(remote.assessmentId, [{ gate_code: gateCode, result, note }]);
    } catch {
      await enqueue(remote.assessmentId, "gates", [{ gate_code: gateCode, result, note }]);
    }
  }

  async function syncEvidence(dimensionCode: string, level: number) {
    const remote = await ensureRemoteAssessment();
    if (!remote) return;
    try {
      await assessmentsApi.putEvidence(remote.assessmentId, [
        { dimension_code: dimensionCode, evidence_level: level },
      ]);
    } catch {
      await enqueue(remote.assessmentId, "evidence", [
        { dimension_code: dimensionCode, evidence_level: level },
      ]);
    }
  }

  if (!store.hydrated || frameworkQuery.isLoading) {
    return <div className="p-8 text-center text-text-muted">Loading assessment...</div>;
  }
  if (frameworkQuery.isError || !frameworkQuery.data) {
    return (
      <div className="p-8 text-center text-danger">
        Could not load the ABI framework. Check your connection and try again.
      </div>
    );
  }

  const framework = frameworkQuery.data;
  const steps = buildWizardSteps(framework);
  const currentStep = steps[store.currentStepIndex];
  const totalQuestions = totalQuestionCount(framework);

  const goNext = () => store.goToStep(Math.min(store.currentStepIndex + 1, steps.length - 1));
  const goBack = () => store.goToStep(Math.max(store.currentStepIndex - 1, 0));

  const scaleResponses: Record<string, number | null> = {};
  for (const [code, r] of Object.entries(store.responses)) {
    scaleResponses[code] = r.scaleValue;
  }
  const evidenceByDimension: Record<string, number> = {};
  for (const [code, e] of Object.entries(store.evidence)) {
    if (e.dimensionCode) evidenceByDimension[code] = e.evidenceLevel;
  }

  async function handleSubmit() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const remote = await ensureRemoteAssessment();
      if (!remote) {
        setSubmitError(
          "You're offline. Your answers are saved on this device -- reconnect to submit."
        );
        setSubmitting(false);
        return;
      }
      const results = await assessmentsApi.submit(remote.assessmentId);
      router.push(`/results/${results.assessment_id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong submitting your assessment.";
      setSubmitError(message);
      setSubmitting(false);
    }
  }

  function handleEnterpriseNext(values: EnterpriseFormValues) {
    store.setEnterpriseDraft(values);
    goNext();
  }

  function handleConsentNext(consentGiven: boolean) {
    store.setConsentGiven(consentGiven);
    goNext();
    void ensureRemoteAssessment();
  }

  return (
    <div className="min-h-screen bg-bg">
      <OfflineBanner />
      <WizardProgress steps={steps} currentStepIndex={store.currentStepIndex} totalQuestions={totalQuestions} />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {currentStep.kind === "enterprise" && (
          <EnterpriseIntakeForm defaultValues={store.enterpriseDraft} onNext={handleEnterpriseNext} />
        )}
        {currentStep.kind === "consent" && (
          <ConsentForm initialConsent={store.consentGiven} onBack={goBack} onNext={handleConsentNext} />
        )}
        {currentStep.kind === "dimension" && currentStep.dimensionCode && (
          <DimensionStep
            dimension={framework.dimensions.find((d) => d.code === currentStep.dimensionCode)!}
            responses={scaleResponses}
            onAnswer={(questionCode, scaleValue) => {
              store.setResponse(questionCode, scaleValue);
              void syncResponse(questionCode, scaleValue);
            }}
            onBack={goBack}
            onNext={goNext}
          />
        )}
        {currentStep.kind === "gates" && (
          <GatesEvidenceStep
            gateDefinitions={framework.critical_gates}
            dimensions={framework.dimensions}
            gates={store.gates}
            evidenceByDimension={evidenceByDimension}
            onGateChange={(gateCode, result) => {
              store.setGate(gateCode, result);
              void syncGate(gateCode, result, store.gates[gateCode]?.note);
            }}
            onGateNoteChange={(gateCode, note) => {
              const result = store.gates[gateCode]?.result ?? "PASS";
              store.setGate(gateCode, result, note);
              void syncGate(gateCode, result, note);
            }}
            onEvidenceChange={(dimensionCode, level) => {
              store.setEvidence(dimensionCode, level);
              void syncEvidence(dimensionCode, level);
            }}
            onBack={goBack}
            onNext={goNext}
          />
        )}
        {currentStep.kind === "review" && (
          <ReviewStep
            framework={framework}
            steps={steps}
            responses={scaleResponses}
            gates={store.gates}
            onEditStep={store.goToStep}
            onBack={goBack}
            onSubmit={handleSubmit}
            submitting={submitting}
            errorMessage={submitError}
          />
        )}
      </div>
    </div>
  );
}
