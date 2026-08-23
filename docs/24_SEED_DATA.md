# 24 — Seed data

Seed via a Django management command (e.g. `python manage.py seed_abi_v01`), not by
manual admin entry, so a fresh checkout can reproduce the exact demo state.

## Framework seed

Create one `FrameworkVersion` (`version_label="0.1"`, `status="ACTIVE"`), its six
`Dimension` rows, 24 `Question` rows, the shared `ResponseOption` scale, the five
`CriticalGateDefinition` rows, the five readiness bands, the `Recommendation` rows from
`12_RECOMMENDATION_ENGINE.md`, and the nine `FinancingPathwayDefinition` rows from
`13_FINANCING_PATHWAYS.md` — all content copied verbatim from those docs and
`09_ABI_FRAMEWORK.md`/`11_CRITICAL_GATES.md`.

## Roles seed

Create the five `Role` rows: ADMIN, RESEARCHER, DATA_COLLECTOR, ANALYST, VIEWER.

## Demo enterprises

Seed two demo enterprises for the "Load Demo Firm" button (`22_DEMO_SCRIPT.md`):

### Maundurahuku
- Organisation type: Cooperative
- Value chain: Grain
- Province: Mashonaland Central (adjust if a more specific district was intended)
- A complete set of 24 demo responses tuned to land roughly in **Developing
  Bankability** (50–64) with a clear strength in Market Strength and a clear gap in
  Digital Readiness, so the demo shows a realistic, varied dashboard rather than a
  flat score.
- All 5 critical gates: mostly PASS, one CAUTION (e.g. `source_of_repayment`) to
  demonstrate the "further preparation required" state.

### Zvemuchando
- Organisation type: Private company
- Value chain: Horticulture
- A complete set of 24 demo responses tuned to land in **Finance Ready with
  Conditions** (65–79), strongest in Governance and Management, weakest in Climate
  Resilience.
- All 5 critical gates PASS, to demonstrate the "Ready" overall gate state.

Exact per-question demo values are an implementation detail for the seed command — pick
values that produce the target dimension/band outcomes above using the scoring formula
in `10_SCORING_ENGINE.md`, and add a unit test asserting each demo firm lands in its
intended band (belt-and-braces alongside the worked-example test in
`19_TESTING_STRATEGY.md`).

## "Load Demo Firm" behaviour

In the assessment wizard, a "Load Demo Firm" action (visible in non-production/demo
mode, or always in v0.1 given the show context) creates a new `Assessment` for the
chosen seeded enterprise, pre-fills all responses and gate results, and jumps straight to
`/results/[id]` without requiring the visitor to answer 24 questions live — this is the
fast path used in step 2 of the booth walkthrough in `22_DEMO_SCRIPT.md`.
