import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

function FieldWrapper({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, id, className, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name ?? label;
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error}>
      <input
        id={fieldId}
        className={cn(
          "min-h-[44px] rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-header",
          error && "border-danger",
          className
        )}
        {...props}
      />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({
  label,
  error,
  id,
  options,
  placeholder,
  className,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? props.name ?? label;
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error}>
      <select
        id={fieldId}
        className={cn(
          "min-h-[44px] rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-header",
          error && "border-danger",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextAreaField({ label, error, id, className, ...props }: TextAreaFieldProps) {
  const fieldId = id ?? props.name ?? label;
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error}>
      <textarea
        id={fieldId}
        className={cn(
          "min-h-[88px] rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-header",
          error && "border-danger",
          className
        )}
        {...props}
      />
    </FieldWrapper>
  );
}
