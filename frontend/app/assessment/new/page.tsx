"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { generateLocalAssessmentId } from "@/lib/wizard/localId";

export default function NewAssessmentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/assessment/${generateLocalAssessmentId()}`);
  }, [router]);

  return <div className="p-8 text-center text-text-muted">Starting your assessment...</div>;
}
