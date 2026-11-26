/** Shapes returned by the admin portal API (/api/v1/admin/*, /auth/me/). */

export type RoleName = "ADMIN" | "RESEARCHER" | "DATA_COLLECTOR" | "ANALYST" | "VIEWER";

export interface Me {
  username: string;
  full_name: string;
  email: string;
  role: RoleName | null;
  role_label: string | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminAssessmentRow {
  id: string;
  enterprise_id: string;
  enterprise_name: string;
  enterprise_code: string;
  respondent_code: string;
  value_chain: string;
  value_chain_label: string;
  province: string;
  province_label: string;
  framework_version: string;
  status: "DRAFT" | "SUBMITTED" | "SCORED";
  started_at: string | null;
  submitted_at: string | null;
  abi_score: number | null;
  readiness_band_code: string | null;
  readiness_band_label: string | null;
  evidence_coverage_percent: number | null;
  report_count: number | null;
}

export interface AdminOverview {
  counts: {
    assessments: number;
    scored: number;
    submitted: number;
    drafts: number;
    enterprises: number;
    consented_enterprises: number;
    reports: number;
    feedback: number;
    expert_reviews: number;
    pretest_notes: number;
    users: number;
  };
  reports_by_type: Record<string, number>;
  feedback_summary: {
    total: number;
    score_reflects_enterprise_percent: number | null;
    would_help_prepare_percent: number | null;
    would_recommend_percent: number | null;
    willing_to_provide_evidence_percent: number | null;
  };
  recent_assessments: AdminAssessmentRow[];
  disclaimer: string;
}

export interface AdminEnterpriseRow {
  id: string;
  name: string;
  code: string;
  respondent_code: string;
  organisation_type: string;
  value_chain: string;
  province: string;
  district: string;
  years_operating: number;
  workers_count: number;
  turnover_band: string;
  finance_required_amount: number | null;
  finance_required_currency: string | null;
  finance_type_sought: string | null;
  consent_given: boolean;
  consent_timestamp: string | null;
  assessment_count: number;
  last_assessed: string | null;
  latest_assessment_id: string | null;
  latest_abi: number | null;
  created_at: string;
}

export interface AdminReportRow {
  id: string;
  assessment_id: string;
  enterprise_name: string;
  enterprise_code: string;
  report_type: "PDF" | "CSV" | "XLSX" | "CERT";
  report_type_label: string;
  generated_at: string;
}

export interface AdminFeedbackRow {
  id: number;
  assessment_id: string;
  enterprise_name: string;
  enterprise_code: string;
  score_reflects_enterprise: boolean | null;
  most_relevant_dimension: string | null;
  unclear_question: string | null;
  missing_factor_notes: string;
  would_help_prepare_for_finance: boolean | null;
  willing_to_provide_evidence_later: boolean | null;
  perceived_duration_minutes: number | null;
  would_recommend: boolean | null;
  created_at: string;
}

export interface AdminExpertReviewRow {
  id: number;
  framework_version: string;
  reviewer_name: string;
  reviewer_affiliation: string;
  comments: string;
  suggested_weight_changes: Record<string, number> | null;
  created_at: string;
}

export interface AdminPretestNoteRow {
  id: number;
  assessment_id: string | null;
  enterprise_code: string | null;
  observer_name: string;
  question: string | null;
  observation: string;
  perceived_usefulness_rating: number | null;
  created_at: string;
}

export interface AdminAuditRow {
  id: number;
  user: string | null;
  action: string;
  object_type: string;
  object_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminUserRow {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string | null;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
}

export type ExportDataset = "assessments" | "enterprises" | "feedback";
export type ExportFileType = "csv" | "xlsx";
