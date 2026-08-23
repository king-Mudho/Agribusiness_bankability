# 19 — Testing strategy

## Backend — pytest + pytest-django

- **Scoring engine (highest priority)**: unit test `compute_abi()` against the worked
  example in `10_SCORING_ENGINE.md` byte-for-byte — dimension averages of 60/70/75/65/50/40
  must produce weighted contributions 15.00/10.50/15.00/9.75/7.50/4.00 and a total of
  61.75, rounding to **62**, band **Developing Bankability**. Add further cases for each
  readiness-band boundary (34/35, 49/50, 64/65, 79/80) and for an incomplete assessment
  (must raise, not silently partial-score).
- **Critical gates**: test the overall-status derivation logic (all pass → "Ready"; any
  not-met → "Not currently bankable"; any caution-only → "Further preparation required").
- **Recommendation engine**: test that the correct dimensions are selected and ordered
  for a known set of dimension scores.
- **Financing pathway engine**: test band-based filtering and gap-based ranking boost.
- **API tests**: every endpoint in `06_API_ARCHITECTURE.md` — auth enforcement on
  internal endpoints, 400 on incomplete submit, privacy fields excluded from aggregate
  responses.
- **Privacy tests**: explicitly assert that `/research/dashboard/` responses never
  contain `Enterprise.name` or unbanded turnover/finance figures.

## Frontend — component tests

- Wizard step components validate required fields before allowing "Next".
- Offline draft store: writing a response persists to IndexedDB and survives a simulated
  reload.

## End-to-end — Playwright

- **Happy path**: enterprise intake → consent → all 6 dimension steps → gates/evidence →
  review → submit → results screen shows a score consistent with the answers given →
  generate PDF → generate CSV → submit pilot feedback.
- **Offline scenario**: go offline mid-wizard, continue answering, come back online,
  confirm answers sync and submission succeeds.
- **Consistency check**: assert the score shown on the results screen exactly matches
  what `GET /assessments/{id}/score/` returns — the frontend must never diverge from the
  backend value.
- **Dashboard**: internal-role login → aggregate dashboard renders without exposing any
  individual enterprise name.

## Non-functional checks

- Completion-time instrumentation: log `completion_seconds` on submit; a smoke test
  confirms a scripted run of the happy-path E2E test completes in a plausible time
  bracket (not a strict pass/fail gate, just a sanity signal — real timing validation is
  a research activity per `17_RESEARCH_VALIDATION.md`, not a CI assertion).
- Lighthouse or equivalent PWA audit: installable, offline app-shell load.

## CI expectation

All backend and frontend automated tests must pass before a phase in
`25_AGENT_EXECUTION_PLAN.md` is marked complete for that layer.
