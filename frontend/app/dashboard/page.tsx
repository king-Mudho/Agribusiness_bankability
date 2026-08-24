"use client";

import { useState } from "react";

import { AgribusinessView } from "@/components/dashboard/AgribusinessView";
import { ResearchLenderView } from "@/components/dashboard/ResearchLenderView";
import { cn } from "@/lib/utils/cn";

type Mode = "agribusiness" | "research";

export default function DashboardPage() {
  const [mode, setMode] = useState<Mode>("agribusiness");

  return (
    <main className="min-h-screen bg-bg">
      <header className="bg-header px-6 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-header">ABI</span>
          <div>
            <p className="font-semibold">Executive dashboard</p>
            <p className="text-xs text-white/80">ABI Demo v0.1 -- research prototype</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 inline-flex rounded-md border border-border bg-surface p-1">
          <button
            className={cn(
              "min-h-11 rounded px-4 py-2 text-sm font-medium",
              mode === "agribusiness" ? "bg-header text-white" : "text-text"
            )}
            onClick={() => setMode("agribusiness")}
          >
            Agribusiness view
          </button>
          <button
            className={cn(
              "min-h-11 rounded px-4 py-2 text-sm font-medium",
              mode === "research" ? "bg-header text-white" : "text-text"
            )}
            onClick={() => setMode("research")}
          >
            Research / Lender view
          </button>
        </div>

        {mode === "agribusiness" ? <AgribusinessView /> : <ResearchLenderView />}
      </div>
    </main>
  );
}
