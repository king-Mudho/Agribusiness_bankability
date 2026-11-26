import { apiClient } from "./client";
import type {
  AdminAssessmentRow,
  AdminAuditRow,
  AdminEnterpriseRow,
  AdminExpertReviewRow,
  AdminFeedbackRow,
  AdminOverview,
  AdminPretestNoteRow,
  AdminReportRow,
  AdminUserRow,
  ExportDataset,
  ExportFileType,
  Me,
  Paginated,
} from "@/types/admin";

export type QueryParams = Record<string, string | number | undefined>;

function qs(params?: QueryParams): string {
  if (!params) return "";
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (clean.length === 0) return "";
  return `?${new URLSearchParams(clean.map(([k, v]) => [k, String(v)])).toString()}`;
}

/** Admin portal API. Every /admin/* endpoint is Admin-role only on the
 * server; the frontend hides sections by role but never relies on that. */
export const adminApi = {
  me: () => apiClient.get<Me>("/auth/me/"),
  overview: () => apiClient.get<AdminOverview>("/admin/overview/"),
  assessments: (params?: QueryParams) =>
    apiClient.get<Paginated<AdminAssessmentRow>>(`/admin/assessments/${qs(params)}`),
  enterprises: (params?: QueryParams) =>
    apiClient.get<Paginated<AdminEnterpriseRow>>(`/admin/enterprises/${qs(params)}`),
  reports: (params?: QueryParams) =>
    apiClient.get<Paginated<AdminReportRow>>(`/admin/reports/${qs(params)}`),
  feedback: (params?: QueryParams) =>
    apiClient.get<Paginated<AdminFeedbackRow>>(`/admin/feedback/${qs(params)}`),
  expertReviews: (params?: QueryParams) =>
    apiClient.get<Paginated<AdminExpertReviewRow>>(`/admin/expert-reviews/${qs(params)}`),
  pretestNotes: (params?: QueryParams) =>
    apiClient.get<Paginated<AdminPretestNoteRow>>(`/admin/pretest-notes/${qs(params)}`),
  auditLog: (params?: QueryParams) =>
    apiClient.get<Paginated<AdminAuditRow>>(`/admin/audit-log/${qs(params)}`),
  users: (params?: QueryParams) =>
    apiClient.get<Paginated<AdminUserRow>>(`/admin/users/${qs(params)}`),
  exportData: (dataset: ExportDataset, fileType: ExportFileType, params?: QueryParams) =>
    apiClient.download(
      `/admin/export/${dataset}/${qs({ ...params, file_type: fileType, page: undefined })}`,
      `abi-${dataset}.${fileType}`
    ),
};
