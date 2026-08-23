import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-header hover:opacity-90",
  secondary: "bg-header text-white hover:opacity-90",
  outline: "border border-border bg-transparent text-text hover:bg-surface",
  ghost: "bg-transparent text-text hover:bg-surface",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center rounded-md px-5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
