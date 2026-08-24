"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { assessmentsApi } from "@/lib/api/endpoints";

export function LoadDemoFirmButton({
  enterpriseCode,
  label,
}: {
  enterpriseCode: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const { assessment_id } = await assessmentsApi.loadDemo(enterpriseCode);
      router.push(`/results/${assessment_id}`);
    } catch {
      setError("Could not load the demo firm -- please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button variant="primary" onClick={handleClick} disabled={loading}>
        {loading ? "Loading..." : `Load Demo Firm: ${label}`}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
