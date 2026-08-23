import { cn } from "@/lib/utils/cn";

const BAND_COLOR: Record<string, string> = {
  investment_ready: "bg-success text-white",
  finance_ready_conditions: "bg-success/80 text-white",
  developing_bankability: "bg-warning text-header",
  early_stage_readiness: "bg-warning/80 text-header",
  pre_bankable: "bg-danger text-white",
};

export function ReadinessBandPill({ code, label }: { code: string; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold",
        BAND_COLOR[code] ?? "bg-header text-white"
      )}
    >
      {label}
    </span>
  );
}
