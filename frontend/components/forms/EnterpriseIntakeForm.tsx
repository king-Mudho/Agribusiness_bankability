"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import {
  FINANCE_TYPE_CHOICES,
  FINANCIER_TYPE_CHOICES,
  ORGANISATION_TYPE_CHOICES,
  PROVINCE_CHOICES,
  TURNOVER_BAND_CHOICES,
  VALUE_CHAIN_CHOICES,
} from "@/config/enterpriseChoices";
import {
  ENTERPRISE_FORM_DEFAULTS,
  enterpriseSchema,
  type EnterpriseFormValues,
} from "@/lib/validation/enterpriseSchema";

export function EnterpriseIntakeForm({
  defaultValues,
  onNext,
}: {
  defaultValues: Partial<EnterpriseFormValues>;
  onNext: (values: EnterpriseFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnterpriseFormValues>({
    resolver: zodResolver(enterpriseSchema),
    defaultValues: { ...ENTERPRISE_FORM_DEFAULTS, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold text-text">1. Firm assessment -- enterprise profile</h2>
      <TextField label="Firm / organisation name" error={errors.name?.message} {...register("name")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Organisation type"
          placeholder="Select..."
          options={ORGANISATION_TYPE_CHOICES}
          error={errors.organisation_type?.message}
          {...register("organisation_type")}
        />
        <SelectField
          label="Value chain"
          placeholder="Select..."
          options={VALUE_CHAIN_CHOICES}
          error={errors.value_chain?.message}
          {...register("value_chain")}
        />
        <SelectField
          label="Province"
          placeholder="Select..."
          options={PROVINCE_CHOICES}
          error={errors.province?.message}
          {...register("province")}
        />
        <TextField label="District" error={errors.district?.message} {...register("district")} />
        <TextField
          label="Years operating"
          type="number"
          min={0}
          error={errors.years_operating?.message}
          {...register("years_operating")}
        />
        <TextField
          label="Number of workers / members"
          type="number"
          min={0}
          error={errors.workers_count?.message}
          {...register("workers_count")}
        />
        <SelectField
          label="Turnover band"
          placeholder="Select..."
          options={TURNOVER_BAND_CHOICES}
          error={errors.turnover_band?.message}
          {...register("turnover_band")}
        />
        <TextField
          label="Finance required (USD)"
          type="number"
          min={0}
          step="0.01"
          error={errors.finance_required_amount?.message}
          {...register("finance_required_amount")}
        />
        <SelectField
          label="Finance type sought"
          placeholder="Select..."
          options={FINANCE_TYPE_CHOICES}
          error={errors.finance_type_sought?.message}
          {...register("finance_type_sought")}
        />
        <SelectField
          label="Preferred financier type"
          placeholder="Select..."
          options={FINANCIER_TYPE_CHOICES}
          error={errors.preferred_financier_type?.message}
          {...register("preferred_financier_type")}
        />
      </div>
      <TextAreaField
        label="Intended use of finance"
        error={errors.intended_use?.message}
        {...register("intended_use")}
      />
      <label className="flex items-center gap-2 text-sm text-text">
        <input type="checkbox" className="h-4 w-4" {...register("previous_borrowing")} />
        Has previous borrowing history
      </label>
      <TextAreaField
        label="Previous borrowing notes (optional)"
        error={errors.previous_borrowing_notes?.message}
        {...register("previous_borrowing_notes")}
      />
      <div className="flex justify-end">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
