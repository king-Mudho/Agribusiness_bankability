"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { researchApi } from "@/lib/api/endpoints";

export function PretestNoteForm() {
  const [observerName, setObserverName] = useState("");
  const [questionCode, setQuestionCode] = useState("");
  const [observation, setObservation] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      await researchApi.submitPretestNote({
        observer_name: observerName,
        question: questionCode || undefined,
        observation,
      });
      setStatus("saved");
      setObserverName("");
      setQuestionCode("");
      setObservation("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <h3 className="font-semibold text-text">Cognitive pretest note</h3>
      <TextField label="Observer name" value={observerName} onChange={(e) => setObserverName(e.target.value)} required />
      <TextField
        label="Question code (optional, e.g. fin_01)"
        value={questionCode}
        onChange={(e) => setQuestionCode(e.target.value)}
      />
      <TextAreaField
        label="Observation"
        value={observation}
        onChange={(e) => setObservation(e.target.value)}
        required
      />
      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving..." : "Save note"}
      </Button>
      {status === "saved" && <p className="text-sm text-success">Saved.</p>}
      {status === "error" && <p className="text-sm text-danger">Could not save -- please try again.</p>}
    </form>
  );
}
