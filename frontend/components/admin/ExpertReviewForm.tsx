"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { researchApi } from "@/lib/api/endpoints";

export function ExpertReviewForm({ frameworkVersionLabel }: { frameworkVersionLabel: string }) {
  const [reviewerName, setReviewerName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      await researchApi.submitExpertReview({
        framework_version: frameworkVersionLabel,
        reviewer_name: reviewerName,
        reviewer_affiliation: affiliation,
        comments,
      });
      setStatus("saved");
      setReviewerName("");
      setAffiliation("");
      setComments("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <h3 className="font-semibold text-text">Expert review</h3>
      <TextField label="Reviewer name" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} required />
      <TextField
        label="Affiliation (optional)"
        value={affiliation}
        onChange={(e) => setAffiliation(e.target.value)}
      />
      <TextAreaField label="Comments" value={comments} onChange={(e) => setComments(e.target.value)} required />
      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving..." : "Save review"}
      </Button>
      {status === "saved" && <p className="text-sm text-success">Saved.</p>}
      {status === "error" && <p className="text-sm text-danger">Could not save -- please try again.</p>}
    </form>
  );
}
