"use client";

import { PROVINCE_CHOICES, VALUE_CHAIN_CHOICES } from "@/config/enterpriseChoices";
import { SelectField, TextField } from "@/components/ui/Field";

export interface DashboardFilterValues {
  value_chain: string;
  province: string;
  readiness_band: string;
  date_from: string;
  date_to: string;
}

const READINESS_BAND_CHOICES = [
  { value: "investment_ready", label: "Investment Ready" },
  { value: "finance_ready_conditions", label: "Finance Ready with Conditions" },
  { value: "developing_bankability", label: "Developing Bankability" },
  { value: "early_stage_readiness", label: "Early-Stage Readiness" },
  { value: "pre_bankable", label: "Pre-Bankable" },
];

export function DashboardFilters({
  values,
  onChange,
}: {
  values: DashboardFilterValues;
  onChange: (values: DashboardFilterValues) => void;
}) {
  function update<K extends keyof DashboardFilterValues>(key: K, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-5">
      <SelectField
        label="Value chain"
        placeholder="All"
        options={VALUE_CHAIN_CHOICES}
        value={values.value_chain}
        onChange={(e) => update("value_chain", e.target.value)}
      />
      <SelectField
        label="Province"
        placeholder="All"
        options={PROVINCE_CHOICES}
        value={values.province}
        onChange={(e) => update("province", e.target.value)}
      />
      <SelectField
        label="Readiness band"
        placeholder="All"
        options={READINESS_BAND_CHOICES}
        value={values.readiness_band}
        onChange={(e) => update("readiness_band", e.target.value)}
      />
      <TextField
        label="From"
        type="date"
        value={values.date_from}
        onChange={(e) => update("date_from", e.target.value)}
      />
      <TextField
        label="To"
        type="date"
        value={values.date_to}
        onChange={(e) => update("date_to", e.target.value)}
      />
    </div>
  );
}
