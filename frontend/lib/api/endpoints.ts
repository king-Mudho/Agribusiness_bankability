import { apiClient } from "./client";
import type {
  Assessment,
  DashboardPayload,
  Enterprise,
  EnterpriseCreatePayload,
  FinancingPathwayPayload,
  FrameworkDefinition,
  PilotFeedbackPayload,
  RecommendationPayload,
  ReportRecord,
  ResultsPayload,
} from "@/types/api";

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<{ access: string; refresh: string }>("/auth/token/", { username, password }),
};

export const enterprisesApi = {
  create: (payload: EnterpriseCreatePayload) => apiClient.post<Enterprise>("/enterprises/", payload),
  get: (id: string) => apiClient.get<Enterprise>(`/enterprises/${id}/`),
  update: (id: string, payload: Partial<EnterpriseCreatePayload>) =>
    apiClient.patch<Enterprise>(`/enterprises/${id}/`, payload),
  setConsent: (id: string, consentGiven: boolean) =>
    apiClient.patch<Enterprise>(`/enterprises/${id}/`, { profile: { consent_given: consentGiven } }),
};

interface FrameworkVersionSummary {
  version_label: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  effective_from: string;
}

export const frameworksApi = {
  listVersions: () =>
    apiClient.get<{ results: FrameworkVersionSummary[] }>("/frameworks/"),
  getDefinition: (versionLabel: string) =>
    apiClient.get<FrameworkDefinition>(`/frameworks/${versionLabel}/`),
  getActiveDefinition: async () => {
    const list = await apiClient.get<{ results: FrameworkVersionSummary[] }>("/frameworks/");
    const active = list.results.find((v) => v.status === "ACTIVE") ?? list.results[0];
    if (!active) {
      throw new Error("No framework version is available from the API.");
    }
    return apiClient.get<FrameworkDefinition>(`/frameworks/${active.version_label}/`);
  },
};

export const assessmentsApi = {
  create: (enterpriseId: string, frameworkVersionLabel?: string) =>
    apiClient.post<Assessment>("/assessments/", {
      enterprise: enterpriseId,
      ...(frameworkVersionLabel ? { framework_version: frameworkVersionLabel } : {}),
    }),
  get: (id: string) => apiClient.get<Assessment>(`/assessments/${id}/`),
  putResponses: (id: string, responses: { question_code: string; scale_value: number }[]) =>
    apiClient.put<{ saved: number }>(`/assessments/${id}/responses/`, { responses }),
  putGates: (
    id: string,
    gates: { gate_code: string; result: string; note?: string }[]
  ) => apiClient.put<{ saved: number }>(`/assessments/${id}/gates/`, { gates }),
  putEvidence: (
    id: string,
    evidence: { question_code?: string; dimension_code?: string; evidence_level: number; description?: string }[]
  ) => apiClient.put<{ saved: number }>(`/assessments/${id}/evidence/`, { evidence }),
  submit: (id: string) => apiClient.post<ResultsPayload>(`/assessments/${id}/submit/`),
  getResults: (id: string) => apiClient.get<ResultsPayload>(`/assessments/${id}/results/`),
  getRecommendations: (id: string) =>
    apiClient.get<RecommendationPayload[]>(`/assessments/${id}/recommendations/`),
  getFinancing: (id: string) =>
    apiClient.get<FinancingPathwayPayload[]>(`/assessments/${id}/financing/`),
  submitFeedback: (id: string, payload: PilotFeedbackPayload) =>
    apiClient.post(`/assessments/${id}/feedback/`, payload),
  loadDemo: (enterpriseCode: string) =>
    apiClient.post<{ assessment_id: string }>("/assessments/load-demo/", {
      enterprise_code: enterpriseCode,
    }),
};

export const reportsApi = {
  generate: (assessmentId: string, reportType: "PDF" | "CSV") =>
    apiClient.post<ReportRecord>("/reports/", { assessment: assessmentId, report_type: reportType }),
  downloadUrl: (reportId: string) => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
    return `${base}/reports/${reportId}/download/`;
  },
};

export const researchApi = {
  getDashboard: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiClient.get<DashboardPayload>(`/research/dashboard/${query}`);
  },
};
