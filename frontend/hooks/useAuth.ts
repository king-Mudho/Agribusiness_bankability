"use client";

import { useEffect } from "react";
import { create } from "zustand";

import { authApi } from "@/lib/api/endpoints";
import { AUTH_TOKENS_CLEARED_EVENT, clearTokens, getAccessToken, setTokens } from "@/lib/auth/tokenStorage";

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

/** Zustand (not plain useState) so every component that calls useAuth()
 * observes the same sign-in state -- e.g. the login form and the dashboard
 * that renders beside/after it are different component instances.
 *
 * isAuthenticated always starts false, matching what the server renders (no
 * `window`/localStorage there). Reading localStorage synchronously here
 * would make the very first client render disagree with the server-rendered
 * HTML for any returning signed-in user, which React reports as a hydration
 * mismatch. The useAuth() wrapper below syncs the real value in a
 * useEffect, which runs after hydration completes.
 */
const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const { access, refresh } = await authApi.login(username, password);
      setTokens(access, refresh);
      set({ isAuthenticated: true, loading: false });
      return true;
    } catch {
      set({ error: "Invalid username or password.", loading: false });
      return false;
    }
  },

  logout: () => {
    clearTokens();
    set({ isAuthenticated: false });
  },
}));

export function useAuth(): AuthState {
  const state = useAuthStore();

  useEffect(() => {
    if (!state.isAuthenticated && getAccessToken()) {
      useAuthStore.setState({ isAuthenticated: true });
    }
    // Only needs to run once, on mount, after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // A stale/expired token can be cleared silently by the API client (see
    // lib/api/client.ts) when a request that shouldn't need auth gets
    // rejected for one. Stay in sync so the UI falls back to the login form
    // instead of claiming to be signed in with no working token.
    const onTokensCleared = () => useAuthStore.setState({ isAuthenticated: false });
    window.addEventListener(AUTH_TOKENS_CLEARED_EVENT, onTokensCleared);
    return () => window.removeEventListener(AUTH_TOKENS_CLEARED_EVENT, onTokensCleared);
  }, []);

  return state;
}
