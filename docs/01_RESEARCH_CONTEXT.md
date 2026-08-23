# 01 — Research context

## What this prototype is — and is not

ABI Demo v0.1 is a **research demonstration prototype** used to pilot-test a bankability
assessment methodology with real agribusinesses at a live Agricultural Show, and to
collect validation data (expert review, cognitive pretesting, respondent feedback) that
will inform a later, empirically validated version of the framework (v0.2 and beyond).

It is **not** a production credit-decision system. Every score, band, gate result,
recommendation and financing pathway it produces is provisional and must say so on
screen and in every export. See `18_DATA_PRIVACY.md` for exact disclaimer wording.

## Why the scoring engine must be versioned

Because the weights, questions and thresholds are provisional and will change once pilot
data and expert review come back, the system must be able to:

- add, edit or replace dimensions, questions, weights, gates and thresholds without
  losing or corrupting historical assessment results, and
- let one enterprise be assessed again under a later framework version without
  overwriting the original record.

This is implemented as a `FrameworkVersion` entity — see `05_DATABASE_ARCHITECTURE.md`
and `10_SCORING_ENGINE.md`.

## Note on the two prototype iterations

Two different visual/structural drafts of ABI exist and were supplied as input to this
build:

1. **Reference screenshots (`FrameworkVersion 0.0`, visual reference only)** — a
   single-page HTML dashboard with six dimensions named *Governance & Risk, Contractual
   Credibility, Cash-Flow Predictability, Financial Discipline, Digital Traceability,
   Aggregation Capability*, five questions each (30 total), equally weighted, with a
   radar chart, traffic-light gap summary, a "Bankability Certificate" panel and
   print/export actions. This is useful as a **visual and UX reference** (see
   `23_UI_UX_GUIDELINES.md`) but its dimension set is not what we are building.
2. **Documented framework (`FrameworkVersion 0.1`, canonical)** — six dimensions named
   *Financial Performance (25%), Governance and Management (15%), Market Strength (20%),
   Operational Capacity (15%), Climate Resilience (15%), Digital Readiness (10%)*, four
   questions each (24 total), a five-point maturity scale, five critical gates, an
   evidence engine, and five readiness bands. **This is the framework to implement.**
   See `09_ABI_FRAMEWORK.md`.

The UI/UX patterns from iteration 1 (traffic-light gap cards, certificate panel, radar
chart, executive-summary donut) are worth keeping — just re-populate them with the
`FrameworkVersion 0.1` dimensions, not the 0.0 ones.

## Research validation goals

- Confirm question clarity and relevance with real respondents at the Agricultural Show.
- Measure completion time (target **10–12 minutes** for the full assessment).
- Capture expert review of dimension weights and thresholds ahead of a v0.2 revision.
- Capture willingness of respondents to later provide documentary evidence.
- Identify bankability factors the framework may be missing.

See `17_RESEARCH_VALIDATION.md` for the data captured and `19_TESTING_STRATEGY.md` for
how completion-time and usability are measured technically (not the same as expert
review, which is a research activity outside the codebase).

## Target respondents

Farmers, agribusiness firms, farmer organisations and aggregators completing the
self-assessment; banks, investors, insurers, government agencies, development partners
and technology providers viewing the aggregate research/lender dashboard. See
`22_DEMO_SCRIPT.md`.
