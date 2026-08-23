import { ReadinessBandPill } from "@/components/abi/ReadinessBandPill";
import { CERTIFICATE_DISCLAIMER } from "@/lib/constants/disclaimers";
import type { ResultsPayload } from "@/types/api";

export function CertificatePanel({
  enterpriseName,
  results,
}: {
  enterpriseName: string;
  results: ResultsPayload;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border-2 border-accent bg-surface p-6">
      <div className="flex items-center gap-2">
        <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-header">ABI</span>
        <h3 className="text-lg font-semibold text-text">Bankability Certificate</h3>
      </div>
      <p className="text-sm text-text-muted">Issued for {enterpriseName}</p>
      <div className="flex items-center gap-4">
        <span className="text-4xl font-bold tabular-nums text-text">{Math.round(results.abi_score)}</span>
        <div className="flex flex-col gap-1">
          <ReadinessBandPill code={results.readiness_band.code} label={results.readiness_band.label} />
          <span className="text-xs text-text-muted tabular-nums">
            Evidence coverage: {Math.round(results.evidence_coverage_percent)}%
          </span>
        </div>
      </div>
      <p className="border-t border-border pt-3 text-xs text-text-muted">{CERTIFICATE_DISCLAIMER}</p>
    </div>
  );
}
