import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { ResearchDisclaimer } from "@/components/shared/ResearchDisclaimer";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-header text-white px-6 py-4 flex items-center gap-3">
        <span className="bg-accent text-header font-bold rounded px-2 py-1 text-sm">
          ABI
        </span>
        <div>
          <h1 className="font-semibold">Agribusiness Bankability Index</h1>
          <p className="text-xs text-white/80">
            Demo v0.1 -- research prototype
          </p>
        </div>
        <Link
          href="/admin"
          className="ml-auto inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-white/40 px-3 py-2 text-sm text-white hover:bg-white/10"
        >
          <LogIn size={16} aria-hidden />
          <span className="sm:hidden">Sign in</span>
          <span className="hidden sm:inline">Staff sign in</span>
        </Link>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <h2 className="text-3xl font-semibold max-w-xl">
          Is your agribusiness ready for finance, investment and growth?
        </h2>
        <p className="max-w-xl text-text-muted">
          Get an indicative bankability score from 0-100 across six dimensions:
          Financial Performance, Governance and Management, Market Strength,
          Operational Capacity, Climate Resilience and Digital Readiness.
        </p>
        <Link
          href="/assessment/new"
          className="bg-accent text-header font-semibold rounded-md px-6 py-3 hover:opacity-90"
        >
          Start ABI Assessment
        </Link>
        <Link href="/demo" className="text-header underline text-sm">
          GigaFood Africa Agricultural Show demo
        </Link>
        <ResearchDisclaimer className="max-w-xl" />
      </section>
    </main>
  );
}
