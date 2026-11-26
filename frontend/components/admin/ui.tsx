"use client";

import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function yesNo(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return value ? "Yes" : "No";
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface p-4", className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-semibold text-text">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-text">{value}</p>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  SCORED: "bg-success/15 text-success",
  SUBMITTED: "bg-warning/15 text-warning",
  DRAFT: "bg-border text-text-muted",
};

export function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", tone ?? "bg-border text-text")}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  empty = "Nothing to show yet.",
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: boolean;
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-bg">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn("px-3 py-2 text-left text-xs font-semibold text-text-muted", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-text-muted">Loading...</td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-danger">Could not load this data.</td>
            </tr>
          ) : !rows || rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-text-muted">{empty}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-border align-top hover:bg-bg/60">
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-3 py-2 text-text", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  count,
  onPage,
}: {
  page: number;
  pageSize: number;
  count: number | undefined;
  onPage: (page: number) => void;
}) {
  if (!count) return null;
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(count, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-2 text-sm text-text-muted">
      <span className="tabular-nums">
        {from}-{to} of {count}
      </span>
      <div className="flex items-center gap-1">
        <button
          className="rounded-md border border-border p-2 disabled:opacity-40"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 tabular-nums">
          {page} / {pages}
        </span>
        <button
          className="rounded-md border border-border p-2 disabled:opacity-40"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/** Search box that only reports its value after the user pauses typing. */
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 350);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);
  return (
    <label className="relative flex min-w-[220px] flex-1 items-center">
      <Search size={16} className="pointer-events-none absolute left-3 text-text-muted" aria-hidden />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="min-h-[44px] w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-header"
      />
    </label>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] rounded-md border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-header"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** "Excel" + "CSV" download buttons for an export callback. */
export function ExportButtons({ onExport, label = "Export" }: { onExport: (fileType: "csv" | "xlsx") => Promise<void>; label?: string }) {
  const [busy, setBusy] = useState<"csv" | "xlsx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(fileType: "csv" | "xlsx") {
    setBusy(fileType);
    setError(null);
    try {
      await onExport(fileType);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button variant="secondary" className="gap-2 whitespace-nowrap" onClick={() => run("xlsx")} disabled={busy !== null}>
          <FileSpreadsheet size={16} aria-hidden />
          {busy === "xlsx" ? "Preparing..." : `${label} Excel`}
        </Button>
        <Button variant="outline" className="gap-2 whitespace-nowrap" onClick={() => run("csv")} disabled={busy !== null}>
          <FileText size={16} aria-hidden />
          {busy === "csv" ? "Preparing..." : "CSV"}
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
