import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { GateResultValue } from "@/types/api";

const CONFIG: Record<GateResultValue, { label: string; icon: typeof CheckCircle2; className: string }> = {
  PASS: { label: "Pass", icon: CheckCircle2, className: "text-success" },
  CAUTION: { label: "Caution", icon: AlertTriangle, className: "text-warning" },
  NOT_MET: { label: "Not met", icon: XCircle, className: "text-danger" },
};

export function GateStatusChip({ result }: { result: GateResultValue }) {
  const { label, icon: Icon, className } = CONFIG[result];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", className)}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}
