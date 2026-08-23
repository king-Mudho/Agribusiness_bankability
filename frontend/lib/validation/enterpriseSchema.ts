import { z } from "zod";

/**
 * Mirrors the backend's required-field set (docs/14_ASSESSMENT_WORKFLOW.md
 * step 01: "requires name, value chain, province and finance-required
 * amount at minimum"). This is a UX pre-check only -- the backend
 * (apps/enterprises/serializers.py) enforces it regardless.
 *
 * No `.optional()`/`.default()` here: mixing those with react-hook-form's
 * zodResolver makes the input/output types diverge and breaks generic
 * inference. Optional fields are still required as (possibly empty)
 * strings, with actual defaults supplied via the form's `defaultValues`.
 */
export const enterpriseSchema = z.object({
  name: z.string().min(2, "Enter the enterprise or firm name."),
  organisation_type: z.string().min(1, "Select an organisation type."),
  value_chain: z.string().min(1, "Select a value chain."),
  province: z.string().min(1, "Select a province."),
  district: z.string(),
  years_operating: z.coerce.number().int().min(0, "Enter years operating."),
  workers_count: z.coerce.number().int().min(0, "Enter number of workers/members."),
  turnover_band: z.string().min(1, "Select a turnover band."),
  finance_required_amount: z.coerce.number().positive("Enter the amount of finance required."),
  finance_type_sought: z.string().min(1, "Select the type of finance sought."),
  intended_use: z.string(),
  previous_borrowing: z.boolean(),
  previous_borrowing_notes: z.string(),
  preferred_financier_type: z.string().min(1, "Select a preferred financier type."),
});

export type EnterpriseFormValues = z.infer<typeof enterpriseSchema>;

export const ENTERPRISE_FORM_DEFAULTS: EnterpriseFormValues = {
  name: "",
  organisation_type: "",
  value_chain: "",
  province: "",
  district: "",
  years_operating: 0,
  workers_count: 0,
  turnover_band: "",
  finance_required_amount: 0,
  finance_type_sought: "",
  intended_use: "",
  previous_borrowing: false,
  previous_borrowing_notes: "",
  preferred_financier_type: "",
};
