# 15 — Dashboard specification

## Results screen (`/results/[id]`)

Visual centrepiece of the product. Sections, top to bottom:

1. **Score hero** — large ABI number (0–100), readiness band label as a coloured pill,
   one-line band description, evidence coverage percentage.
2. **Dimension profile** — radar/spider chart (Recharts) across the six dimensions, plus
   a scannable bar per dimension with its numeric score. Weight percentage shown next to
   each dimension label.
3. **Strengths** — the two to three highest-scoring dimensions.
4. **Priority gaps** — the two to three lowest-scoring dimensions, each with its
   recommendation text from `12_RECOMMENDATION_ENGINE.md`.
5. **Critical gates** — status list, one row per gate, PASS/CAUTION/NOT_MET with an icon
   and the overall gate status line (`11_CRITICAL_GATES.md`).
6. **Bankability action plan** — the prioritised recommendation list.
7. **Potential financing pathways** — 3–5 cards from `13_FINANCING_PATHWAYS.md`, each
   with name, one-line description, and why it's suggested (which gap/band it addresses).
8. **Bankability certificate panel** — a clearly labelled, shareable summary card.
   Required footer text: *"Prototype certificate for research demonstration only. Not a
   credit rating, loan approval or investment guarantee."* (carried over verbatim from
   the reference prototype — keep this exact wording).
9. **Firm profile & actions** — firm/sector/province/finance-sought recap, plus
   Print/Save PDF, Export CSV, Save on Device buttons (`16_REPORTING_SPECIFICATION.md`).

## Executive dashboard (`/dashboard`)

Two modes, switchable by a role-aware toggle:

### Agribusiness view
Shows the signed-in/linked enterprise's own latest assessment — effectively an
alternate entry point to the results screen above, framed as "your financing readiness."

### Research / Lender view (internal auth required — `IsInternalUser`)
Aggregate statistics across all assessments, **never** individual enterprise financial
detail (`18_DATA_PRIVACY.md`). Cards/charts:

```
Total assessments             N
Average ABI                   xx.x
Investment Ready              xx %
Finance Ready with Conditions xx %
Developing Bankability        xx %
Early-Stage Readiness         xx %
Pre-Bankable                  xx %
```

Plus: ABI distribution histogram, average score per dimension, comparisons by value
chain and by province/district, aggregated financing-needs breakdown, most common
bankability gaps (dimension frequency in `priority_gaps` across assessments), evidence
coverage average, critical-gate failure frequency by gate.

Label this view clearly as **pilot data, not a national benchmark** — a one-line caption
under the header is sufficient, wording from `18_DATA_PRIVACY.md`.

## Filters

Research/Lender view supports filtering by value chain, province, readiness band and
date range, using the same `django-filter` query params described in
`06_API_ARCHITECTURE.md`.

## Component reuse from the reference prototype

The traffic-light layout (Strengths / Conditions-Watchlist / Critical Gaps as three
coloured panels) and the circular ABI/100 gauge from the `FrameworkVersion 0.0`
screenshots are good UX patterns — reimplement them, populated with `FrameworkVersion
0.1` data. See `23_UI_UX_GUIDELINES.md` for the visual treatment.
