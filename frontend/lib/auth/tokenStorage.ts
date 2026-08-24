const ACCESS_TOKEN_KEY = "abi_access_token";
const REFRESH_TOKEN_KEY = "abi_refresh_token";

/** Fired whenever tokens are cleared, including a silent clear after a
 * stale/expired token gets a 401 from an AllowAny endpoint (see
 * lib/api/client.ts) -- lets useAuth() stay in sync without importing the
 * Zustand store into this lower-level module. */
export const AUTH_TOKENS_CLEARED_EVENT = "abi:auth-tokens-cleared";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_TOKENS_CLEARED_EVENT));
}
