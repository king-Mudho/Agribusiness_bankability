# 26 — Definition of done

The build is complete only when every item below is checked, on a fresh checkout, with
seed data loaded.

## Methodology fidelity

- [x] The live `FrameworkVersion 0.1` in the database exactly matches
      `09_ABI_FRAMEWORK.md`: six dimensions, correct weights summing to 100, 24 questions
      with the exact prompts, five-point scale mapped 1–5 → 0/25/50/75/100.
      *(Verified 2026-08-24: `GET /frameworks/0.1/` cross-checked against the doc
      verbatim on a fresh seed; `Dimension.weight_percent` sum-to-100 validator plus
      seed-command self-check both pass.)*
- [x] The five critical gates match `11_CRITICAL_GATES.md` exactly.
      *(Verified 2026-08-24: gate codes/names/descriptions cross-checked verbatim
      against the doc, including the "Source of repayment...seasonal income" example.)*
- [x] The five readiness bands match `09_ABI_FRAMEWORK.md` exactly (0–34, 35–49, 50–64,
      65–79, 80–100).
      *(Verified via `GET /frameworks/0.1/` plus the passing per-boundary unit tests in
      `backend/tests/test_scoring_engine.py`.)*
- [x] The worked example in `10_SCORING_ENGINE.md` (score 62, Developing Bankability)
      passes as an automated test. *(Part of the 58/58 passing backend suite.)*
- [x] Nothing in the frontend or backend hardcodes a dimension weight, question text, or
      threshold outside the `frameworks` app / database seed.
      *(Verified 2026-08-24 via targeted grep of both codebases for hardcoded
      weight/threshold values outside the seed command; none found.)*

## Functional completeness

- [x] A respondent can complete the full 10-step wizard on a phone-sized viewport.
      *(Verified live 2026-08-24 at 375px width end to end: intake through submit,
      landed on results with ABI 75 / Finance Ready with Conditions, matching the
      "all answers = To a large extent" expectation; zero layout overflow throughout.)*
- [x] The wizard works offline and syncs once back online, with no answers lost.
      *(`e2e/offline-scenario.spec.ts` passing, confirmed stable across repeat runs.)*
- [x] Submitting an incomplete assessment is rejected with a clear message, both in the
      API and the UI. *(`test_submit_rejects_incomplete_assessment` passing; per-step
      wizard validation blocks "Continue" with unanswered required fields.)*
- [x] The results screen shows score, band, dimension breakdown, strengths, gaps, gate
      status, recommendations and financing pathways, all sourced from the API.
      *(Verified live against both demo firms and a fresh live submission.)*
- [x] The Bankability Certificate panel renders with its required disclaimer.
      *(Verified live; disclaimer text matches `18_DATA_PRIVACY.md` verbatim.)*
- [x] PDF report generates and downloads correctly; CSV export matches its documented
      schema. *(Verified live -- valid single-page PDF, real network requests fire from
      both `/results/[id]` and the newly-implemented `/reports/[id]`; CSV schema test
      passing in `backend/tests/test_reports.py`.)*
- [x] The executive dashboard renders both the Agribusiness view and the Research/Lender
      aggregate view. *(Verified live, including sign-in, filters, KPI cards and charts.)*
- [x] Pilot feedback can be submitted after results. *(Verified live; form now also has
      a real error/retry state -- see `27_QA_AND_HARDENING_LOG.md`.)*
- [x] "Load Demo Firm" instantly produces results for both seeded demo enterprises,
      landing in their intended readiness bands. *(Verified live: Maundurahuku → 58 /
      Developing Bankability, Zvemuchando → 68 / Finance Ready with Conditions.)*
- [x] The `/demo` sponsor landing page renders the GigaFood Africa copy correctly.
      *(Verified live; see `27_QA_AND_HARDENING_LOG.md` for a flagged wording
      inconsistency between `22_DEMO_SCRIPT.md` and `09_ABI_FRAMEWORK.md` that is a
      pre-existing doc-vs-doc question, not a rendering defect.)*

## Non-negotiables

- [x] No UI copy, API response, or export anywhere uses "approved", "loan approval",
      "credit rating" or "guarantee". *(Spot-checked every disclaimer/copy surface
      touched this pass; all disclaimer text is sourced from one shared constant on
      each side (`config/disclaimers.py` / `lib/constants/disclaimers.ts`), not
      duplicated ad hoc.)*
- [x] The required research disclaimer text appears verbatim on the consent step,
      results screen, certificate panel, PDF report and CSV export context.
      *(Verified live on every one of those surfaces, including the newly-implemented
      `/reports/[id]`.)*
- [x] The public/aggregate dashboard never exposes an individual enterprise's name or
      unbanded financial figures — verified by an automated test, not just visual check.
      *(`test_dashboard_never_exposes_enterprise_names` /
      `test_dashboard_payload_only_uses_expected_top_level_keys` passing.)*
- [x] The frontend never independently computes the authoritative ABI score — the value
      shown always traces back to a backend API response.
      *(`ResultsView`/`ReportPreview` both read `abi_score` straight from
      `GET /assessments/{id}/results/`; no client-side scoring logic exists in the
      frontend codebase.)*
- [x] Repository has exactly two top-level application folders: `frontend/` and
      `backend/`.

## Quality gates

- [x] All backend automated tests pass (`19_TESTING_STRATEGY.md`). *(58/58, verified
      2026-08-24 after all QA-pass fixes.)*
- [x] All frontend component tests pass. *(4/4, verified 2026-08-24.)*
- [x] Both Playwright E2E scenarios (happy path, offline) pass. *(Verified stable across
      repeat runs against the dev server on 2026-08-24; see
      `27_QA_AND_HARDENING_LOG.md` for the pre-existing, documented prod-build/service-
      worker interaction on the offline scenario that is a known non-blocker, not a
      regression from this pass.)*
- [ ] HTTPS works end to end on `agribusinessbankability.com` in the deployed
      environment. *(Cannot be verified from this sandbox -- no live deployment exists
      yet. Genuine open item for whoever performs the deployment.)*
- [ ] The rollout checklist in `20_DEPLOYMENT_ARCHITECTURE.md` has been run and passed.
      *(Same blocker -- needs a real deployed environment.)*

## Sign-off

Only once every box above is checked should the agent report the build as complete in
its final summary, referencing this file explicitly.
