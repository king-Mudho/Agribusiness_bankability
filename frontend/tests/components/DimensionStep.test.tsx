import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DimensionStep } from "@/components/assessment/DimensionStep";
import type { FrameworkDimension } from "@/types/api";

const dimension: FrameworkDimension = {
  code: "financial_performance",
  name: "Financial Performance",
  weight_percent: "25.00",
  questions: [
    {
      code: "fin_01",
      prompt: "Question one",
      options: [
        { scale_value: 1, label: "Not at all", score_value: 0 },
        { scale_value: 2, label: "A little", score_value: 25 },
      ],
    },
    {
      code: "fin_02",
      prompt: "Question two",
      options: [
        { scale_value: 1, label: "Not at all", score_value: 0 },
        { scale_value: 2, label: "A little", score_value: 25 },
      ],
    },
  ],
};

describe("DimensionStep", () => {
  it("disables Continue until every question on screen is answered", () => {
    const onAnswer = vi.fn();
    const onNext = vi.fn();
    const responses: Record<string, number | null> = { fin_01: null, fin_02: null };

    const { rerender } = render(
      <DimensionStep
        dimension={dimension}
        responses={responses}
        onAnswer={onAnswer}
        onBack={vi.fn()}
        onNext={onNext}
      />
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    fireEvent.click(screen.getAllByRole("radio", { name: "Not at all" })[0]);
    expect(onAnswer).toHaveBeenCalledWith("fin_01", 1);

    // Simulate the parent updating state after the first answer -- Continue
    // should stay disabled because fin_02 is still unanswered.
    rerender(
      <DimensionStep
        dimension={dimension}
        responses={{ ...responses, fin_01: 1 }}
        onAnswer={onAnswer}
        onBack={vi.fn()}
        onNext={onNext}
      />
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    // Once every question is answered, Continue becomes enabled.
    rerender(
      <DimensionStep
        dimension={dimension}
        responses={{ fin_01: 1, fin_02: 2 }}
        onAnswer={onAnswer}
        onBack={vi.fn()}
        onNext={onNext}
      />
    );
    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
