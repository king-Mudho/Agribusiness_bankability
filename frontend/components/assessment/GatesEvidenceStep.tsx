"use client";

import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TextAreaField } from "@/components/ui/Field";
import type { WizardGate } from "@/lib/offline/db";
import type { FrameworkCriticalGate, FrameworkDimension } from "@/types/api";

const GATE_OPTIONS = [
  { value: "PASS", label: "Pass" },
  { value: "CAUTION", label: "Caution" },
  { value: "NOT_MET", label: "Not met" },
];

const EVIDENCE_OPTIONS = [
  { value: "0", label: "No evidence" },
  { value: "1", label: "Verbal only" },
  { value: "2", label: "Internal record" },
  { value: "3", label: "Formal document" },
  { value: "4", label: "Independently verified" },
];

export function GatesEvidenceStep({
  gateDefinitions,
  dimensions,
  gates,
  evidenceByDimension,
  onGateChange,
  onGateNoteChange,
  onEvidenceChange,
  onBack,
  onNext,
}: {
  gateDefinitions: FrameworkCriticalGate[];
  dimensions: FrameworkDimension[];
  gates: Record<string, WizardGate>;
  evidenceByDimension: Record<string, number>;
  onGateChange: (gateCode: string, result: WizardGate["result"]) => void;
  onGateNoteChange: (gateCode: string, note: string) => void;
  onEvidenceChange: (dimensionCode: string, level: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const allGatesAnswered = gateDefinitions.every((g) => gates[g.code]?.result);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-text">9. Critical bankability gates</h2>
        <p className="text-sm text-text-muted">
          These sit outside the weighted score -- a Caution or Not met flag never blocks your
          assessment, it just tells a financier what to look into further.
        </p>
      </div>
      {gateDefinitions.map((gate) => (
        <div key={gate.code} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm font-medium text-text">{gate.name}</p>
          <p className="text-xs text-text-muted">{gate.description}</p>
          <SegmentedControl
            name={gate.code}
            aria-label={gate.name}
            value={gates[gate.code]?.result ?? null}
            onChange={(v) => onGateChange(gate.code, v as WizardGate["result"])}
            options={GATE_OPTIONS}
          />
          {gates[gate.code]?.result && gates[gate.code]?.result !== "PASS" && (
            <TextAreaField
              label="Note (optional)"
              value={gates[gate.code]?.note ?? ""}
              onChange={(e) => onGateNoteChange(gate.code, e.target.value)}
            />
          )}
        </div>
      ))}

      <div>
        <h3 className="text-lg font-semibold text-text">Evidence (optional)</h3>
        <p className="text-sm text-text-muted">
          For each dimension, how well could you document your answers if asked?
        </p>
      </div>
      {dimensions.map((dimension) => (
        <div key={dimension.code} className="flex flex-col gap-2">
          <p className="text-sm font-medium text-text">{dimension.name}</p>
          <SegmentedControl
            name={`evidence-${dimension.code}`}
            aria-label={`Evidence level for ${dimension.name}`}
            value={
              evidenceByDimension[dimension.code] != null
                ? String(evidenceByDimension[dimension.code])
                : null
            }
            onChange={(v) => onEvidenceChange(dimension.code, Number(v))}
            options={EVIDENCE_OPTIONS}
          />
        </div>
      ))}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={!allGatesAnswered} onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
