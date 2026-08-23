# 14 — Assessment workflow

Guided wizard, one step visible at a time, persistent progress indicator and back/forward
navigation. Every step's answers save to local IndexedDB immediately (see
`07_FRONTEND_ARCHITECTURE.md` § offline) and sync to the backend opportunistically.

## Steps

```
01 Enterprise      — profile intake fields (FR-1, see 02_PRODUCT_REQUIREMENTS.md)
02 Consent         — consent statement + explicit opt-in (FR-2)
03 Financial       — 4 questions, Financial Performance
04 Governance      — 4 questions, Governance and Management
05 Market          — 4 questions, Market Strength
06 Operations      — 4 questions, Operational Capacity
07 Climate         — 4 questions, Climate Resilience
08 Digital         — 4 questions, Digital Readiness
09 Gates & evidence — 5 critical-gate questions + optional evidence levels
10 Review & submit — summary of all answers, edit links back to any step, submit button
```

## Progress indicator

Show "Question N of 24" while inside steps 03–08, plus a persistent stepper/segmented
bar showing all 10 steps with completed/current/upcoming state. Target total completion
time: **10–12 minutes** (`01_RESEARCH_CONTEXT.md`) — keep each question screen to a
single question or a tight cluster, large touch targets, no unnecessary scrolling on
mobile.

## Field-level detail

### Step 01 — Enterprise
Firm/organisation name, organisation type, value chain, province, district, years
operating, workers/members count, turnover band, finance required (amount + currency),
finance type sought, intended use of finance, previous borrowing (yes/no + notes),
preferred financier type. Maps to `Enterprise` + `EnterpriseProfile` — see
`05_DATABASE_ARCHITECTURE.md`.

### Step 02 — Consent
Plain-language explanation of what data is collected, how it will be used for research,
and the disclaimer that results are provisional (full wording in
`18_DATA_PRIVACY.md`). Checkbox required to proceed; timestamp recorded.

### Steps 03–08 — Dimension questions
One dimension per screen, its four questions from `09_ABI_FRAMEWORK.md`, five-point
scale control per question (radio group or segmented control — not a bare `<select>`
"Select" dropdown as in the `FrameworkVersion 0.0` reference; prefer a more mobile-
friendly tap target per `23_UI_UX_GUIDELINES.md`). "Next" is disabled until all four
questions on the screen are answered.

### Step 09 — Gates & evidence
Five critical-gate questions (`11_CRITICAL_GATES.md`), each Pass/Caution/Not-met with an
optional note. Evidence-level capture (0–4) can be a single optional
"how well can you document this overall?" control per dimension, kept lightweight so it
does not blow the 10–12 minute target.

### Step 10 — Review & submit
Read-only summary grouped by dimension with "Edit" links back to each step. Submit button
disabled until all 24 questions and all 5 gates are answered. On submit, call
`POST /assessments/{id}/submit/`; on success, navigate to `/results/{id}`.

## Validation rules

- Cannot advance past a dimension step with any of its 4 questions unanswered.
- Cannot submit with any of the 24 questions or 5 gates unanswered — this matches the
  backend's completeness rule in `10_SCORING_ENGINE.md`; the frontend check is just UX,
  the backend enforces it regardless.
- Enterprise step requires name, value chain, province and finance-required amount at
  minimum; other fields may be optional — confirm exact required set against
  `05_DATABASE_ARCHITECTURE.md` field nullability when implementing serializers.
