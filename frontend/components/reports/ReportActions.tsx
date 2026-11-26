"use client";

import { Award, FileDown, FileSpreadsheet, FileText, Smartphone } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { reportsApi } from "@/lib/api/endpoints";
import type { ReportType, ResultsPayload } from "@/types/api";

const DOWNLOADS: { type: ReportType; label: string; icon: typeof FileText; variant: "primary" | "secondary" | "outline" }[] = [
  { type: "PDF", label: "PDF report", icon: FileText, variant: "primary" },
  { type: "CERT", label: "Certificate (PDF)", icon: Award, variant: "secondary" },
  { type: "XLSX", label: "Excel workbook", icon: FileSpreadsheet, variant: "outline" },
  { type: "CSV", label: "CSV data", icon: FileDown, variant: "outline" },
];

export function ReportActions({
  assessmentId,
  results,
  showSaveOnDevice = true,
}: {
  assessmentId: string;
  results: ResultsPayload;
  showSaveOnDevice?: boolean;
}) {
  const [busy, setBusy] = useState<ReportType | "device" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(reportType: ReportType) {
    setBusy(reportType);
    setError(null);
    try {
      await reportsApi.generateAndDownload(assessmentId, reportType);
    } catch {
      setError(
        navigator.onLine
          ? "Could not generate the file -- please try again."
          : "You're offline -- reconnect to generate a server-side report. Use Save on Device for an offline copy."
      );
    } finally {
      setBusy(null);
    }
  }

  function handleSaveOnDevice() {
    setBusy("device");
    try {
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `abi-results-${assessmentId}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Download</h2>
        <p className="text-xs text-text-muted">
          Files are generated on the server from these stored results and carry the research disclaimer.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {DOWNLOADS.map(({ type, label, icon: Icon, variant }) => (
          <Button
            key={type}
            variant={variant}
            onClick={() => handleGenerate(type)}
            disabled={busy !== null}
            className="gap-2"
          >
            <Icon size={16} aria-hidden />
            {busy === type ? "Generating..." : label}
          </Button>
        ))}
        {showSaveOnDevice && (
          <Button variant="ghost" onClick={handleSaveOnDevice} disabled={busy !== null} className="gap-2">
            <Smartphone size={16} aria-hidden />
            Save on device
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
