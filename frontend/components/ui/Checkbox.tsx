"use client";

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function Checkbox({
  checked,
  onCheckedChange,
  id,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {/* Root is the ~44px tappable hit area; the inner span is the compact visual box. */}
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className={cn(
          "group -m-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-header"
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded border border-border bg-surface",
            "group-data-[state=checked]:border-header group-data-[state=checked]:bg-header"
          )}
        >
          <RadixCheckbox.Indicator>
            <Check className="h-4 w-4 text-white" />
          </RadixCheckbox.Indicator>
        </span>
      </RadixCheckbox.Root>
      <label htmlFor={id} className="pt-2.5 text-sm text-text">
        {label}
      </label>
    </div>
  );
}
