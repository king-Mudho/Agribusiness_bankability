# 26 — Definition of done

The build is complete only when every item below is checked, on a fresh checkout, with
seed data loaded.

## Methodology fidelity

- [ ] The live `FrameworkVersion 0.1` in the database exactly matches
      `09_ABI_FRAMEWORK.md`: six dimensions, correct weights summing to 100, 24 questions
      with the exact prompts, five-point scale mapped 1–5 → 0/25/50/75/100.
- [ ] The five critical gates match `11_CRITICAL_GATES.md` exactly.
- [ ] The five readiness bands match `09_ABI_FRAMEWORK.md` exactly (0–34, 35–49, 50–64,
      65–79, 80–100).
- [ ] The worked example in `10_SCORING_ENGINE.md` (score 62, Developing Bankability)
      passes as an automated test.
- [ ] Nothing in the frontend or backend hardcodes a dimension weight, question text, or
      threshold outside the `frameworks` app / database seed.

## Functional completeness

- [ ] A respondent can complete the full 10-step wizard on a phone-sized viewport.
- [ ] The wizard works offline and syncs once back online, with no answers lost.
- [ ] Submitting an incomplete assessment is rejected with a clear message, both in the
      API and the UI.
- [ ] The results screen shows score, band, dimension breakdown, strengths, gaps, gate
      status, recommendations and financing pathways, all sourced from the API.
- [ ] The Bankability Certificate panel renders with its required disclaimer.
- [ ] PDF report generates and downloads correctly; CSV export matches its documented
      schema.
- [ ] The executive dashboard renders both the Agribusiness view and the Research/Lender
      aggregate view.
- [ ] Pilot feedback can be submitted after results.
- [ ] "Load Demo Firm" instantly produces results for both seeded demo enterprises,
      landing in their intended readiness bands.
- [ ] The `/demo` sponsor landing page renders the GigaFood Africa copy correctly.

## Non-negotiables

- [ ] No UI copy, API response, or export anywhere uses "approved", "loan approval",
      "credit rating" or "guarantee".
- [ ] The required research disclaimer text appears verbatim on the consent step,
      results screen, certificate panel, PDF report and CSV export context.
- [ ] The public/aggregate dashboard never exposes an individual enterprise's name or
      unbanded financial figures — verified by an automated test, not just visual check.
- [ ] The frontend never independently computes the authoritative ABI score — the value
      shown always traces back to a backend API response.
- [ ] Repository has exactly two top-level application folders: `frontend/` and
      `backend/`.

## Quality gates

- [ ] All backend automated tests pass (`19_TESTING_STRATEGY.md`).
- [ ] All frontend component tests pass.
- [ ] Both Playwright E2E scenarios (happy path, offline) pass.
- [ ] HTTPS works end to end on `agribusinessbankability.com` in the deployed
      environment.
- [ ] The rollout checklist in `20_DEPLOYMENT_ARCHITECTURE.md` has been run and passed.

## Sign-off

Only once every box above is checked should the agent report the build as complete in
its final summary, referencing this file explicitly.
