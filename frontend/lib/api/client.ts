import { API_BASE_URL } from "@/config/env";
import { clearTokens, getAccessToken } from "@/lib/auth/tokenStorage";
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

  let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  // Most endpoints (the public wizard, intake, results) are AllowAny, but the
  // client attaches whatever JWT happens to be in storage to every request --
  // e.g. because staff previously signed in to the dashboard on this same
  // device. An expired/invalid token makes DRF's JWT auth reject the request
  // with 401 even on an AllowAny view, which would otherwise silently break
  // every public flow on that device until someone clears storage. If we sent
  // a token and got a 401, drop the stale token and retry once without it.
  if (res.status === 401 && token) {
    clearTokens();
    const retryHeaders = new Headers(headers);
    retryHeaders.delete("Authorization");
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: retryHeaders });
  }

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
