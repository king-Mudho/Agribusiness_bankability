import type { Metadata } from "next";
import Link from "next/link";

import { LoadDemoFirmButton } from "@/components/demo/LoadDemoFirmButton";
import { ResearchDisclaimer } from "@/components/shared/ResearchDisclaimer";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  alternates: { canonical: "/demo" },
};

export default function DemoLandingPage() {
  return (
    <main className="min-h-screen bg-bg">
      <header className="bg-header px-6 py-6 text-center text-white">
        <p className="text-xs uppercase tracking-wide text-accent">GigaFood Africa</p>
        <h1 className="mt-1 text-2xl font-semibold">
          Transforming Agriculture &bull; Unlocking Finance &bull; Strengthening Food Systems
        </h1>
        <p className="mt-2 text-sm text-white/85">
          Proud sponsor of the Agribusiness Bankability Index (ABI)
        </p>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
        <section className="text-center">
          <h2 className="text-xl font-semibold text-text">
            Is your agribusiness ready for finance, investment and growth?
          </h2>
          <p className="mt-3 text-text-muted">
            Visit the GigaFood Africa exhibition stand at the Agricultural Show and discover
            how the Agribusiness Bankability Index can help you:
          </p>
          <ul className="mx-auto mt-4 flex max-w-lg flex-col gap-1.5 text-left text-text">
            <li>&bull; Assess your agribusiness financing readiness</li>
            <li>&bull; Identify financial, operational and governance gaps</li>
            <li>&bull; Strengthen climate resilience and digital readiness</li>
            <li>&bull; Improve access to banks, investors, insurers and development finance</li>
            <li>&bull; Connect farmers, aggregators, markets, processors and financiers</li>
            <li>&bull; Develop a practical roadmap towards investment readiness</li>
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6 text-center">
          <h3 className="text-lg font-semibold text-text">Get your preliminary ABI assessment</h3>
          <p className="mt-2 text-sm text-text-muted">
            Receive an indicative bankability score from 0-100 across: Financial Performance,
            Governance and Management, Market and Value-Chain Strength, Operational Capacity,
            Climate Resilience and Sustainability, Digital Readiness and Risk Management.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3">
            <Link href="/assessment/new">
              <Button>Start ABI Assessment</Button>
            </Link>
            <p className="text-xs text-text-muted">Takes about 10-12 minutes</p>
          </div>
        </section>

        <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6 text-center">
          <h3 className="text-sm font-semibold text-text">Booth demo -- short on time?</h3>
          <p className="text-sm text-text-muted">
            Load a seeded demo enterprise and jump straight to results.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <LoadDemoFirmButton enterpriseCode="DEMO-MAUNDURAHUKU" label="Maundurahuku" />
            <LoadDemoFirmButton enterpriseCode="DEMO-ZVEMUCHANDO" label="Zvemuchando" />
          </div>
        </section>

        <section className="text-center">
          <h3 className="text-sm font-semibold text-text">Who should visit?</h3>
          <p className="mt-2 text-sm text-text-muted">
            Farmers &bull; Agribusiness firms &bull; Farmer organisations &bull; Aggregators
            &bull; Banks &bull; Investors &bull; Insurers &bull; Government agencies &bull;
            Development partners &bull; Technology providers
          </p>
        </section>

        <section className="rounded-lg border-2 border-accent bg-surface p-6 text-center">
          <p className="font-medium text-text">
            GigaFood Africa -- Building a connected, finance-ready and climate-resilient
            African food system. From agricultural potential to bankable enterprises.
          </p>
          <p className="mt-3 text-xs text-text-muted">
            Strategic partner: Proagromark Consultancy Company &middot; Demo contact:
            Happyson Saina &mdash; Call/WhatsApp +263 773 943 709 &middot;
            sales.proagromark2@gmail.com
          </p>
        </section>

        <ResearchDisclaimer />
      </div>
    </main>
  );
}
