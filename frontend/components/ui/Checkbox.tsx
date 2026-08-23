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
    <div className="flex items-start gap-3">
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className={cn(
          "mt-0.5 flex h-6 w-6 min-w-[24px] items-center justify-center rounded border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-header data-[state=checked]:bg-header data-[state=checked]:border-header"
        )}
      >
        <RadixCheckbox.Indicator>
          <Check className="h-4 w-4 text-white" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label htmlFor={id} className="text-sm text-text">
        {label}
      </label>
    </div>
  );
}
