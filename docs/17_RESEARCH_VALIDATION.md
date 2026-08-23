# 17 — Research validation module

Lives in `backend/apps/research/`. This module is why the project is a *"developing and
validating"* exercise, not just a demo build — it captures the data that will justify
changes going into `FrameworkVersion 0.2`.

## Pilot feedback (respondent-facing)

Prompted immediately after the results screen (`/feedback/[id]`), see FR-15 in
`02_PRODUCT_REQUIREMENTS.md`. Questions (stored on `PilotFeedback`, see
`05_DATABASE_ARCHITECTURE.md`):

1. Does this score reasonably reflect your enterprise? (yes/no)
2. Which dimension was most relevant to your business? (select one)
3. Which question was unclear, if any? (select one, optional)
4. Is an important bankability factor missing from this assessment? (free text, optional)
5. Would this assessment help you prepare for finance? (yes/no)
6. Would you be willing to provide documentary evidence later? (yes/no)
7. How long did the assessment feel like it took? (minutes)
8. Would you recommend the ABI assessment to another enterprise? (yes/no)

Keep this short — it should take under two minutes, separate from the 10–12 minute
assessment itself.

## Expert review (internal, researcher-facing)

Captured via `POST /api/v1/research/expert-review/` (internal auth), stored on
`ExpertReview`: reviewer name/affiliation, free-text comments, and optional structured
`suggested_weight_changes` (JSON, e.g. `{"financial_performance": 30}`) so weight-change
proposals ahead of v0.2 are queryable, not buried in prose.

## Cognitive pretest notes (internal, observer-facing)

Captured via `POST /api/v1/research/pretest-note/`, stored on `CognitivePretestNote`:
observer name, the specific question being tested (optional link to `Question`), a
free-text observation, and an optional 1–5 perceived-usefulness rating. Used when a
researcher sits with a respondent and notes hesitation, confusion or misinterpretation
in real time.

## What this module explicitly does not do in v0.1

It does not automatically recompute weights or thresholds from this feedback — that is a
deliberate human research step. The module's job is to **capture structured evidence**
for that later, offline analysis, not to self-modify the live framework.
