"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";

import { cn } from "@/lib/utils/cn";

export interface SegmentedOption {
  value: string;
  label: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  name,
  "aria-label": ariaLabel,
}: {
  options: SegmentedOption[];
  value: string | null;
  onChange: (value: string) => void;
  name: string;
  "aria-label": string;
}) {
  return (
    <RadioGroup.Root
      value={value ?? ""}
      onValueChange={onChange}
      name={name}
      aria-label={ariaLabel}
      className="grid grid-cols-1 gap-2 sm:grid-cols-5"
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            className={cn(
              "min-h-[44px] rounded-md border px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-header sm:text-center",
              selected
                ? "border-header bg-header text-white font-semibold"
                : "border-border bg-surface text-text hover:border-header"
            )}
          >
            {option.label}
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
