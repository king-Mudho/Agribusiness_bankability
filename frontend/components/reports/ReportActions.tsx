"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { reportsApi } from "@/lib/api/endpoints";
import type { ResultsPayload } from "@/types/api";

async function triggerDownload(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function ReportActions({ assessmentId, results }: { assessmentId: string; results: ResultsPayload }) {
  const [busy, setBusy] = useState<"pdf" | "csv" | "device" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(reportType: "PDF" | "CSV") {
    setBusy(reportType === "PDF" ? "pdf" : "csv");
    setError(null);
    try {
      const report = await reportsApi.generate(assessmentId, reportType);
      const url = reportsApi.downloadUrl(report.id);
      await triggerDownload(url, `abi-report-${assessmentId}.${reportType.toLowerCase()}`);
    } catch {
      setError(
        navigator.onLine
          ? "Could not generate the report -- please try again."
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => handleGenerate("PDF")} disabled={busy !== null}>
          {busy === "pdf" ? "Generating..." : "Print / Save PDF"}
        </Button>
        <Button variant="secondary" onClick={() => handleGenerate("CSV")} disabled={busy !== null}>
          {busy === "csv" ? "Generating..." : "Export CSV"}
        </Button>
        <Button variant="outline" onClick={handleSaveOnDevice} disabled={busy !== null}>
          Save on Device
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
