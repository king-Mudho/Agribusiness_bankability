"use client";

import { Award, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";

import { reportsApi } from "@/lib/api/endpoints";
import type { ReportType } from "@/types/api";

const ITEMS: { type: ReportType; label: string; icon: typeof FileText }[] = [
  { type: "PDF", label: "PDF report", icon: FileText },
  { type: "XLSX", label: "Excel workbook", icon: FileSpreadsheet },
  { type: "CERT", label: "Certificate", icon: Award },
];

/** Compact icon buttons that generate and download one assessment's files. */
export function RowDownloads({ assessmentId }: { assessmentId: string }) {
  const [busy, setBusy] = useState<ReportType | null>(null);
  const [failed, setFailed] = useState(false);

  async function run(type: ReportType) {
    setBusy(type);
    setFailed(false);
    try {
      await reportsApi.generateAndDownload(assessmentId, type);
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {ITEMS.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => run(type)}
          disabled={busy !== null}
          title={`Download ${label}`}
          aria-label={`Download ${label}`}
          className="rounded-md border border-border p-1.5 text-header hover:bg-bg disabled:opacity-40"
        >
          <Icon size={15} className={busy === type ? "animate-pulse" : undefined} />
        </button>
      ))}
      {failed && <span className="text-xs text-danger">Failed</span>}
    </div>
  );
}
