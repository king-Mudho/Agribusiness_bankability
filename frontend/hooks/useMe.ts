"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api/admin";

/** The signed-in user and their role (GET /auth/me/), or undefined while
 * signed out. Drives which admin-portal sections are shown; the server
 * enforces the real permissions on every endpoint. */
export function useMe() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["me"],
    queryFn: () => adminApi.me(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
