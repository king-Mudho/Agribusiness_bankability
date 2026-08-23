# 25 — Agent execution plan

Execute phases in order. Check off each task in place (`- [ ]` → `- [x]`) as you complete
it. Do not mark a task done until it actually works (migrations run, tests pass, screen
renders). Commit at the end of each phase: `phase(N): <summary>`.

## Open questions

*(Agent: add any ambiguity you hit here, with the assumption you made, instead of
guessing silently — see `AGENTS.md` § 3.)*

- **Phase 5 — full gap→pathway boost mapping.** `13_FINANCING_PATHWAYS.md` § Selection
  logic step 3 only gives two worked examples of the gap-boost rule ("weak Climate
  Resilience → surface `insurance_linked_finance` higher; weak Market Strength → surface
  `contract_value_chain_finance` higher") without a complete table for all six
  dimensions. This is Python selection logic, not framework content/wording, so I filled
  in the remaining four dimensions using the same theme as the pathway descriptions in
  that doc: `financial_performance` → `working_capital_facility`, `patient_capital`;
  `governance_management` → `grant_technical_assistance`; `operational_capacity` →
  `asset_finance`; `digital_readiness` → no boost (none of the nine pathways specifically
  addresses digital gaps). See `GAP_DIMENSION_TO_PATHWAY_BOOST` in
  `backend/apps/financing/services.py`. The two documented examples are exact; the other
  four are my extension and should be reviewed by the research team before v0.2.
- **Phase 8 — offline scope for the enterprise/consent steps.** FR-7 asks for
  offline-capable drafting of "in-progress assessments." Steps 01-02 (enterprise
  intake + consent) happen before any backend `Enterprise`/`Assessment` row
  exists, so they're captured into a client-generated `local-<uuid>` draft in
  IndexedDB regardless of connectivity. The transition out of step 02
  (creating the real `Enterprise` + `Assessment` via the API, then promoting
  the wizard to the real assessment id) requires one moment of connectivity;
  every step after that (the 24 questions, gates, evidence -- the bulk of the
  10-12 minute assessment, and the part most exposed to a flaky show-floor
  connection) is fully offline-capable via the draft store + sync queue, and
  the promotion step itself is retried automatically on every subsequent
  answer and at submit time if it didn't succeed yet. This is a scoped,
  disclosed interpretation of FR-7 for engineering tractability, not a
  scoring/gate/pathway content decision.
- **Phase 10 — Agribusiness view identity.** Public respondents have no
  account in v0.1 (FR-17), so "the signed-in/linked enterprise's own latest
  assessment" (`15_DASHBOARD_SPECIFICATION.md`) can't mean an authenticated
  session. Implemented as: the wizard records the most recently *submitted*
  assessment id in this browser's `localStorage`
  (`lib/constants/storageKeys.ts`), and the Agribusiness view reads that to
  show "your" latest results, falling back to a "Start ABI Assessment" CTA
  if none exists on this device. This is a device-local convenience, not an
  account system -- out of scope per `02_PRODUCT_REQUIREMENTS.md`.
- **Phase 12 — expert review / pretest note submission UI.** `25_AGENT_EXECUTION_PLAN.md`
  Phase 12 allows either a simple internal form or a Django-admin-only route for
  `ExpertReview`/`CognitivePretestNote`. I built both: real `POST` API endpoints
  (`/research/expert-review/`, `/research/pretest-note/`) plus Django admin registration,
  and a minimal internal form under `/admin` in the frontend. Noting the choice here per
  the phase instructions.

---

## Phase 0 — Repository scaffold

- [x] Create the two-folder repo layout (`frontend/`, `backend/`, `docs/`, `AGENTS.md`,
      root `README.md`) exactly as in `03_SYSTEM_ARCHITECTURE.md`.
- [x] Scaffold `backend/` as a Django project with the `config/` and `apps/` structure
      from `08_BACKEND_ARCHITECTURE.md`; create all twelve empty apps.
- [x] Scaffold `frontend/` as a Next.js + TypeScript project with the structure from
      `07_FRONTEND_ARCHITECTURE.md`.
- [x] Add `.env.example` files (backend and frontend) exactly per
      `21_ENVIRONMENT_CONFIGURATION.md`.
- [x] Set up `requirements/base.txt`, `dev.txt`, `prod.txt` and `frontend/package.json`
      with the dependencies from `04_TECH_STACK.md`, with pinned versions.
- [x] Confirm `python manage.py runserver` and `pnpm dev` (or `npm run dev`) both boot
      cleanly with placeholder pages.

## Phase 1 — Core backend models

- [x] Implement `accounts` app: `User`, `Role`.
- [x] Implement `enterprises` app: `Enterprise`, `EnterpriseProfile`.
- [x] Implement `frameworks` app: `FrameworkVersion`, `Dimension`, `Question`,
      `ResponseOption`, `CriticalGateDefinition`, readiness-band lookup — per
      `05_DATABASE_ARCHITECTURE.md`.
- [x] Implement `assessments` app: `Assessment`, `AssessmentResponse`,
      `CriticalGateResult`.
- [x] Implement `evidence` app: `EvidenceRecord`.
- [x] Implement `scoring` app models: `DimensionScore`, `ABIScore`.
- [x] Implement `recommendations` app models: `Recommendation`,
      `AssessmentRecommendation`.
- [x] Implement `financing` app models: `FinancingPathwayDefinition`,
      `AssessmentFinancingPathway`.
- [x] Implement `reports` app: `Report`.
- [x] Implement `feedback` app: `PilotFeedback`.
- [x] Implement `research` app: `ExpertReview`, `CognitivePretestNote`.
- [x] Implement `audit` app: `AuditLog` (+ signal handlers for key actions).
- [x] Run and commit initial migrations.
- [x] Add a model-level or serializer-level validator that a `FrameworkVersion`'s
      `Dimension.weight_percent` values sum to 100.

## Phase 2 — Seed data

- [x] Write the `seed_abi_v01` management command per `24_SEED_DATA.md`, seeding the
      full `FrameworkVersion 0.1` (six dimensions, 24 questions, response scale, five
      gates, five readiness bands) exactly as specified in `09_ABI_FRAMEWORK.md` and
      `11_CRITICAL_GATES.md`.
- [x] Seed `Recommendation` rows per `12_RECOMMENDATION_ENGINE.md`.
- [x] Seed `FinancingPathwayDefinition` rows per `13_FINANCING_PATHWAYS.md`.
- [x] Seed the five `Role` rows.
- [x] Seed the two demo enterprises (Maundurahuku, Zvemuchando) with full 24-question
      demo responses and gate results tuned to their target bands.
- [x] Verify `Dimension.weight_percent` sums to exactly 100 for the seeded version.

## Phase 3 — Scoring engine

- [x] Implement `compute_abi()` in `scoring` exactly per `10_SCORING_ENGINE.md`
      (mapping → dimension average → weighted contribution → total → band lookup).
- [x] Implement the completeness rule (reject submit if any of the 24 questions is
      unanswered).
- [x] Implement `evidence_coverage_percent` calculation.
- [x] Write the exact-value unit test for the worked example (61.75 → 62, Developing
      Bankability).
- [x] Write unit tests for each readiness-band boundary.
- [x] Write a unit test confirming the seeded demo enterprises land in their intended
      bands.

## Phase 4 — Critical gates & evidence

- [x] Implement gate-result capture and the overall-status derivation logic per
      `11_CRITICAL_GATES.md`.
- [x] Implement evidence-level capture per question/dimension.
- [x] Unit test the three overall-status branches (Ready / Further preparation required
      / Not currently bankable).

## Phase 5 — Recommendation & financing pathway engines

- [x] Implement the dimension-ranking + recommendation-selection logic per
      `12_RECOMMENDATION_ENGINE.md`.
- [x] Implement the band-based + gap-boosted financing pathway selection logic per
      `13_FINANCING_PATHWAYS.md`.
- [x] Unit test both against known dimension-score fixtures.

## Phase 6 — REST API & auth

- [x] Implement every endpoint listed in `06_API_ARCHITECTURE.md`.
- [x] Implement JWT auth (`djangorestframework-simplejwt`) for internal users.
- [x] Implement `IsInternalUser` / `IsResearcherOrAdmin` permission classes; apply to the
      correct endpoints per the access matrix in `18_DATA_PRIVACY.md`.
- [x] Wire up `drf-spectacular`; confirm `/api/schema/` and `/api/docs/` work.
- [x] Confirm the `/research/dashboard/` response never includes `Enterprise.name` or
      unbanded financial figures — add an explicit test for this.
- [x] Write API tests for the full happy path (create enterprise → start assessment →
      submit responses → submit gates → submit → fetch results).

## Phase 7 — Frontend scaffold & PWA

- [x] Implement the route structure from `07_FRONTEND_ARCHITECTURE.md`.
- [x] Implement the typed API client in `lib/api/`.
- [x] Implement the PWA manifest + service worker (installable, app-shell cached).
- [x] Implement `lib/offline/` (IndexedDB draft store + sync queue).
- [x] Implement the design tokens from `23_UI_UX_GUIDELINES.md` in Tailwind config.

## Phase 8 — Assessment wizard UI

- [x] Build all 10 wizard steps per `14_ASSESSMENT_WORKFLOW.md`.
- [x] Build the progress indicator ("Question N of 24" + stepper).
- [x] Wire per-step validation (cannot advance with unanswered required fields).
- [x] Wire offline-first save-then-sync behaviour.
- [x] Wire the review & submit step, calling `POST /assessments/{id}/submit/`.

## Phase 9 — Results screen UI

- [x] Build the score hero, dimension radar/bar chart, strengths, priority gaps, gate
      status list, action plan, financing pathway cards and certificate panel per
      `15_DASHBOARD_SPECIFICATION.md`.
- [x] Confirm the displayed score is read from the API response, never recomputed
      client-side.
- [x] Add the required disclaimer text verbatim per `18_DATA_PRIVACY.md`.

## Phase 10 — Executive / research dashboard UI

- [x] Build the Agribusiness view.
- [x] Build the Research/Lender aggregate view with the KPI cards and comparisons from
      `15_DASHBOARD_SPECIFICATION.md`.
- [x] Add filters (value chain, province, readiness band, date range).
- [x] Add the pilot-data caption.

## Phase 11 — Reporting

- [x] Implement PDF generation (ReportLab) per `16_REPORTING_SPECIFICATION.md`.
- [x] Implement CSV export with the documented column schema.
- [x] Implement "Save on device" offline fallback.
- [x] Wire the frontend Print/Save PDF, Export CSV, Save on Device buttons.

## Phase 12 — Feedback & research validation

- [x] Build the pilot feedback form (`/feedback/[id]`) per `17_RESEARCH_VALIDATION.md`.
- [x] Build internal expert-review and cognitive-pretest-note submission (can be a
      simple internal form or documented as Django-admin-only for v0.1 — note your
      choice under "Open questions" above if you take the admin-only route).

## Phase 13 — Privacy & audit

- [x] Confirm every disclaimer from `18_DATA_PRIVACY.md` appears on every required
      screen and export.
- [x] Confirm consent capture blocks assessment persistence until given.
- [x] Confirm `AuditLog` entries are created for the actions listed in
      `18_DATA_PRIVACY.md`.

## Phase 14 — Testing pass

- [ ] Run the full backend test suite; all green.
- [ ] Run the full frontend component test suite; all green.
- [ ] Run the Playwright E2E happy-path and offline-scenario tests; both green.
- [ ] Run the privacy assertion tests; green.

## Phase 15 — Deployment prep

- [ ] Write Nginx config per `20_DEPLOYMENT_ARCHITECTURE.md`.
- [ ] Write `systemd` units (or documented process-manager config) for backend and
      frontend.
- [ ] Document the Postgres backup/restore procedure.
- [ ] Confirm the rollout checklist in `20_DEPLOYMENT_ARCHITECTURE.md` passes on a
      staging-like run.

## Phase 16 — Demo polish

- [ ] Build `/demo` sponsor landing page with the GigaFood Africa copy from
      `22_DEMO_SCRIPT.md`.
- [ ] Confirm "Load Demo Firm" works for both Maundurahuku and Zvemuchando.
- [ ] Walk through the full booth demo script end to end on a fresh checkout.
- [ ] Verify `26_DEFINITION_OF_DONE.md` in full.
