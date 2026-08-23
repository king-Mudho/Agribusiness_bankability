import { API_BASE_URL } from "@/config/env";
import { getAccessToken } from "@/lib/auth/tokenStorage";
import type { ApiError } from "@/types/api";

export class ApiRequestError extends Error {
  status: number;
  code: string;
  fieldErrors: Record<string, unknown>;

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, unknown>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.blob();

  if (!res.ok) {
    const errorBody = (data as ApiError | null)?.error ?? {
      code: "unknown_error",
      message: res.statusText || "Request failed",
      field_errors: {},
    };
    throw new ApiRequestError(res.status, errorBody.code, errorBody.message, errorBody.field_errors);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
};
