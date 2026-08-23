"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ResearchDisclaimer } from "@/components/shared/ResearchDisclaimer";

export function ConsentForm({
  initialConsent,
  onBack,
  onNext,
}: {
  initialConsent: boolean;
  onBack: () => void;
  onNext: (consentGiven: boolean) => void;
}) {
  const [consent, setConsent] = useState(initialConsent);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold text-text">2. Consent</h2>
      <div className="flex flex-col gap-3 text-sm text-text-muted">
        <p>
          This assessment collects information about your enterprise for the ABI research
          demonstration run by GigaFood Africa and Proagromark Consultancy Company. Your answers
          are used to compute an indicative financing-readiness score and to inform an academic
          study validating this assessment methodology.
        </p>
        <p>
          Your responses are stored securely and, where shown in an aggregate research/lender
          dashboard, are never linked to your enterprise&apos;s name -- only your own results screen
          and report show your name.
        </p>
        <p>
          Questions about this research: Happyson Saina -- Call/WhatsApp +263 773 943 709,
          sales.proagromark2@gmail.com.
        </p>
      </div>
      <ResearchDisclaimer />
      <Checkbox
        id="consent-checkbox"
        checked={consent}
        onCheckedChange={setConsent}
        label="I have read the above and consent to my responses being collected and used for this research demonstration."
      />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={!consent} onClick={() => onNext(consent)}>
          Continue
        </Button>
      </div>
    </div>
  );
}
