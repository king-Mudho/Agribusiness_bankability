export interface ApiError {
  error: {
    code: string;
    message: string;
    field_errors: Record<string, unknown>;
  };
}

export interface EnterpriseProfile {
  finance_required_amount: string;
  finance_required_currency: string;
  finance_type_sought: string;
  intended_use: string;
  previous_borrowing: boolean;
  previous_borrowing_notes: string;
  preferred_financier_type: string;
  consent_given: boolean;
  consent_timestamp: string | null;
}

export interface Enterprise {
  id: string;
  name: string;
  code: string;
  anonymous_respondent_code: string;
  organisation_type: string;
  value_chain: string;
  province: string;
  district: string;
  years_operating: number;
  workers_count: number;
  turnover_band: string;
  profile?: EnterpriseProfile;
  created_at: string;
}

export interface EnterpriseCreatePayload {
  name: string;
  organisation_type: string;
  value_chain: string;
  province: string;
  district: string;
  years_operating: number;
  workers_count: number;
  turnover_band: string;
  profile: Partial<EnterpriseProfile>;
}

export interface ResponseOption {
  scale_value: number;
  label: string;
  score_value: number;
}

export interface FrameworkQuestion {
  code: string;
  prompt: string;
  options: ResponseOption[];
}

export interface FrameworkDimension {
  code: string;
  name: string;
  weight_percent: string;
  questions: FrameworkQuestion[];
}

export interface FrameworkCriticalGate {
  code: string;
  name: string;
  description: string;
}

export interface FrameworkReadinessBand {
  code: string;
  label: string;
  min: number;
  max: number;
}

export interface FrameworkDefinition {
  version_label: string;
  dimensions: FrameworkDimension[];
  critical_gates: FrameworkCriticalGate[];
  readiness_bands: FrameworkReadinessBand[];
}

export interface Assessment {
  id: string;
  enterprise: string;
  framework_version: number;
  framework_version_label?: string;
  status: "DRAFT" | "SUBMITTED" | "SCORED";
  started_at: string;
  submitted_at: string | null;
  completion_seconds: number | null;
  offline_created: boolean;
}

export type GateResultValue = "PASS" | "CAUTION" | "NOT_MET";

export interface DimensionScorePayload {
  dimension: string;
  dimension_code: string;
  score: number;
  weight_percent: number;
}

export interface CriticalGatePayload {
  code: string;
  name: string;
  result: GateResultValue;
  note: string;
}

export interface RecommendationPayload {
  dimension: string;
  text: string;
  priority_rank: number;
}

export interface FinancingPathwayPayload {
  code: string;
  name: string;
  description: string;
  relevance_rank: number;
}

export interface ResultsPayload {
  assessment_id: string;
  abi_score: number;
  readiness_band: { code: string; label: string };
  evidence_coverage_percent: number;
  dimension_scores: DimensionScorePayload[];
  strengths: string[];
  priority_gaps: string[];
  critical_gates: CriticalGatePayload[];
  overall_gate_status: string | null;
  recommendations: RecommendationPayload[];
  financing_pathways: FinancingPathwayPayload[];
  disclaimer: string;
}

export interface PilotFeedbackPayload {
  score_reflects_enterprise: boolean | null;
  most_relevant_dimension?: string | null;
  unclear_question?: string | null;
  missing_factor_notes?: string;
  would_help_prepare_for_finance: boolean | null;
  willing_to_provide_evidence_later: boolean | null;
  perceived_duration_minutes: number | null;
  would_recommend: boolean | null;
}

export interface ReportRecord {
  id: string;
  assessment: string;
  report_type: "PDF" | "CSV";
  generated_at: string;
}

export interface DashboardPayload {
  total_assessments: number;
  average_abi: number | null;
  band_percentages: Record<string, number>;
  abi_distribution: Record<string, number>;
  average_score_by_dimension: Record<string, number>;
  by_value_chain: { value_chain: string; count: number; average_abi: number | null }[];
  by_province: { province: string; count: number; average_abi: number | null }[];
  financing_needs_breakdown: Record<string, number>;
  most_common_gaps: { dimension: string; count: number }[];
  evidence_coverage_average: number | null;
  critical_gate_failure_frequency: Record<string, number>;
  caption: string;
}
