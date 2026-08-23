"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login, error, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-text">Internal sign-in</h2>
      <p className="text-sm text-text-muted">
        The Research/Lender aggregate view requires an Analyst, Researcher or Admin
        account.
      </p>
      <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
