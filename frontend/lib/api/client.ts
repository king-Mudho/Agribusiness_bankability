import { API_BASE_URL } from "@/config/env";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth/tokenStorage";
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

let refreshInFlight: Promise<string | null> | null = null;

/** Swap the refresh token for a new access token. Shared between concurrent
 * requests so a burst of 401s (e.g. an admin page loading several panels at
 * once) triggers only one refresh call. Returns null if refresh fails. */
function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return Promise.resolve(null);
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { access: string; refresh?: string };
        setTokens(data.access, data.refresh ?? refresh);
        return data.access;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/** fetch() with the stored JWT attached, plus recovery from an expired one:
 * first try to refresh it (keeps staff signed in past the 30-minute access
 * token lifetime); if that fails, drop the tokens and retry once without
 * auth. Most endpoints (the public wizard, intake, results) are AllowAny,
 * and a stale token makes DRF reject even those with 401 -- the anonymous
 * retry keeps every public flow working on a device where staff once
 * signed in. */
async function authorizedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    const retryHeaders = new Headers(headers);
    if (fresh) {
      retryHeaders.set("Authorization", `Bearer ${fresh}`);
    } else {
      clearTokens();
      retryHeaders.delete("Authorization");
    }
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: retryHeaders });
  }
  return res;
}

async function errorFromResponse(res: Response): Promise<ApiRequestError> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  const errorBody = (data as ApiError | null)?.error ?? {
    code: "unknown_error",
    message: res.statusText || "Request failed",
    field_errors: {},
  };
  return new ApiRequestError(res.status, errorBody.code, errorBody.message, errorBody.field_errors);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await authorizedFetch(path, options);

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

/** Fetch a file (with auth, if signed in) and hand it to the browser as a
 * download. The file name comes from the server's Content-Disposition
 * header when present, else `fallbackName`. */
async function download(path: string, fallbackName: string): Promise<void> {
  const res = await authorizedFetch(path, { method: "GET" });
  if (!res.ok) {
    throw await errorFromResponse(res);
  }
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = match?.[1] ?? fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  download,
};
