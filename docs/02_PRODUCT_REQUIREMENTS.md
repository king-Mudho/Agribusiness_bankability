# 02 — Product requirements

## Functional requirements

### Enterprise & consent
- FR-1: Capture enterprise profile: name/code, organisation type, value chain, province,
  district, years operating, number of workers/members, turnover band, finance required
  (amount + currency), finance type sought, intended use of finance, previous borrowing
  history, preferred financier type.
- FR-2: Capture explicit consent before any assessment data is stored, with a
  timestamped consent record (see `18_DATA_PRIVACY.md`).

### Assessment
- FR-3: Present the 24 ABI questions (`09_ABI_FRAMEWORK.md`) grouped by the six
  dimensions, one dimension per screen, five-point response scale per question.
- FR-4: Show a live progress indicator ("Question N of 24") and allow back/forward
  navigation without losing answers.
- FR-5: Allow an optional evidence-level rating (0–4) per question or per dimension —
  see `11_CRITICAL_GATES.md` / evidence engine notes in `10_SCORING_ENGINE.md`.
- FR-6: Present the five critical-gate questions as a distinct step, each answerable as
  Pass / Caution / Not met with an optional note.
- FR-7: Persist in-progress assessments locally (offline draft) and sync to the backend
  when connectivity is available — see `07_FRONTEND_ARCHITECTURE.md` § offline.
- FR-8: On submission, the backend computes and returns the authoritative ABI score,
  dimension breakdown, gate status, recommendations and financing pathways.

### Results & dashboard
- FR-9: Results screen shows the overall ABI (0–100), readiness band, per-dimension bar
  chart or radar, strengths, priority gaps, critical-gate status, recommended actions and
  potential financing pathways.
- FR-10: Executive dashboard has two modes: **Agribusiness view** (single enterprise) and
  **Research/Lender view** (aggregate statistics across all assessments) — see
  `15_DASHBOARD_SPECIFICATION.md`.
- FR-11: A "Bankability Certificate" panel renders a shareable, clearly-labelled
  provisional summary — never implying a lending decision.

### Reporting & export
- FR-12: Generate a one-page PDF respondent report (`16_REPORTING_SPECIFICATION.md`).
- FR-13: Support CSV export of an individual assessment's structured data.
- FR-14: Support "save on device" for offline-first usage at the show.

### Feedback & research
- FR-15: After results, prompt for pilot feedback (`17_RESEARCH_VALIDATION.md`).
- FR-16: Provide an internal researcher/admin flow to record expert review and cognitive
  pretest observations.

### Accounts
- FR-17: Role-based accounts for internal users: Admin, Researcher, Data Collector,
  Analyst, Viewer (see `08_BACKEND_ARCHITECTURE.md` and `18_DATA_PRIVACY.md`). Public
  self-assessment respondents do not need an account for v0.1.

## Non-functional requirements

- NFR-1: **Responsive** across desktop, tablet and smartphone from a single Next.js
  codebase; installable as a **PWA**.
- NFR-2: **Offline-capable** assessment flow with local draft storage (IndexedDB) and
  background sync — the Agricultural Show venue may have unreliable connectivity.
- NFR-3: Full assessment completable in **10–12 minutes** by a typical respondent.
- NFR-4: Backend is the **single source of truth** for ABI scoring; the frontend never
  computes the authoritative score.
- NFR-5: All scoring configuration (weights, thresholds, questions, gates) is
  **database-driven and versioned**, never hardcoded.
- NFR-6: Individual respondent financial information is **never** exposed on the public
  or aggregate dashboard — see `18_DATA_PRIVACY.md`.
- NFR-7: HTTPS everywhere in deployment; audit logging for sensitive actions.
- NFR-8: Reasonable accessibility — labelled form controls, sufficient colour contrast,
  keyboard navigable wizard.
- NFR-9: The system must degrade gracefully on constrained show-floor connectivity
  (loading states, retry, offline banner).

## Out of scope for Version 0.1

Do **not** build any of the following in this phase — they are explicitly deferred:

- Real bank loan approval or underwriting decisions
- Credit bureau integration
- Real-time banking integration
- Payment processing
- Machine-learning credit scoring or prediction
- Blockchain of any kind
- Complex lender underwriting workflows
- National financial-sector integrations
- Separate native iOS/Android applications (a PWA is sufficient)
- Celery/Redis async processing (add only if a specific task genuinely needs it)

## Acceptance

This document's requirements map to acceptance criteria in `26_DEFINITION_OF_DONE.md`.
