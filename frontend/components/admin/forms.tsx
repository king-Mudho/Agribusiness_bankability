"use client";

import { Eye, EyeOff, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

/** Turn an API error into a top-level message plus per-field messages. */
export function apiErrors(error: unknown): { message: string; fields: Record<string, string> } {
  if (error instanceof ApiRequestError) {
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(error.fieldErrors ?? {})) {
      fields[key] = Array.isArray(value) ? value.join(" ") : String(value);
    }
    return { message: error.message, fields };
  }
  return { message: "Something went wrong. Please try again.", fields: {} };
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button className="fixed inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-lg font-semibold text-text">
            {title}
          </h2>
          <button className="rounded-md p-1 text-text-muted hover:bg-bg" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const INPUT =
  "min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-header";

export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (id: string, className: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      {children(id, cn(INPUT, error && "border-danger"))}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function PasswordInput({
  id,
  className,
  value,
  onChange,
  autoComplete = "new-password",
}: {
  id: string;
  className: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(className, "pr-10")}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export const PASSWORD_HINT =
  "At least 8 characters, not only numbers, not a common password, and not too similar to the username.";
