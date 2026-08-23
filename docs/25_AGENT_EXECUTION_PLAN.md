# 25 — Agent execution plan

Execute phases in order. Check off each task in place (`- [ ]` → `- [x]`) as you complete
it. Do not mark a task done until it actually works (migrations run, tests pass, screen
renders). Commit at the end of each phase: `phase(N): <summary>`.

## Open questions

*(Agent: add any ambiguity you hit here, with the assumption you made, instead of
guessing silently — see `AGENTS.md` § 3.)*

---

## Phase 0 — Repository scaffold

- [ ] Create the two-folder repo layout (`frontend/`, `backend/`, `docs/`, `AGENTS.md`,
      root `README.md`) exactly as in `03_SYSTEM_ARCHITECTURE.md`.
- [ ] Scaffold `backend/` as a Django project with the `config/` and `apps/` structure
      from `08_BACKEND_ARCHITECTURE.md`; create all twelve empty apps.
- [ ] Scaffold `frontend/` as a Next.js + TypeScript project with the structure from
      `07_FRONTEND_ARCHITECTURE.md`.
- [ ] Add `.env.example` files (backend and frontend) exactly per
      `21_ENVIRONMENT_CONFIGURATION.md`.
- [ ] Set up `requirements/base.txt`, `dev.txt`, `prod.txt` and `frontend/package.json`
      with the dependencies from `04_TECH_STACK.md`, with pinned versions.
- [ ] Confirm `python manage.py runserver` and `pnpm dev` (or `npm run dev`) both boot
      cleanly with placeholder pages.

## Phase 1 — Core backend models

- [ ] Implement `accounts` app: `User`, `Role`.
- [ ] Implement `enterprises` app: `Enterprise`, `EnterpriseProfile`.
- [ ] Implement `frameworks` app: `FrameworkVersion`, `Dimension`, `Question`,
      `ResponseOption`, `CriticalGateDefinition`, readiness-band lookup — per
      `05_DATABASE_ARCHITECTURE.md`.
- [ ] Implement `assessments` app: `Assessment`, `AssessmentResponse`,
      `CriticalGateResult`.
- [ ] Implement `evidence` app: `EvidenceRecord`.
- [ ] Implement `scoring` app models: `DimensionScore`, `ABIScore`.
- [ ] Implement `recommendations` app models: `Recommendation`,
      `AssessmentRecommendation`.
- [ ] Implement `financing` app models: `FinancingPathwayDefinition`,
      `AssessmentFinancingPathway`.
- [ ] Implement `reports` app: `Report`.
- [ ] Implement `feedback` app: `PilotFeedback`.
- [ ] Implement `research` app: `ExpertReview`, `CognitivePretestNote`.
- [ ] Implement `audit` app: `AuditLog` (+ signal handlers for key actions).
- [ ] Run and commit initial migrations.
- [ ] Add a model-level or serializer-level validator that a `FrameworkVersion`'s
      `Dimension.weight_percent` values sum to 100.

## Phase 2 — Seed data

- [ ] Write the `seed_abi_v01` management command per `24_SEED_DATA.md`, seeding the
      full `FrameworkVersion 0.1` (six dimensions, 24 questions, response scale, five
      gates, five readiness bands) exactly as specified in `09_ABI_FRAMEWORK.md` and
      `11_CRITICAL_GATES.md`.
- [ ] Seed `Recommendation` rows per `12_RECOMMENDATION_ENGINE.md`.
- [ ] Seed `FinancingPathwayDefinition` rows per `13_FINANCING_PATHWAYS.md`.
- [ ] Seed the five `Role` rows.
- [ ] Seed the two demo enterprises (Maundurahuku, Zvemuchando) with full 24-question
      demo responses and gate results tuned to their target bands.
- [ ] Verify `Dimension.weight_percent` sums to exactly 100 for the seeded version.

## Phase 3 — Scoring engine

- [ ] Implement `compute_abi()` in `scoring` exactly per `10_SCORING_ENGINE.md`
      (mapping → dimension average → weighted contribution → total → band lookup).
- [ ] Implement the completeness rule (reject submit if any of the 24 questions is
      unanswered).
- [ ] Implement `evidence_coverage_percent` calculation.
- [ ] Write the exact-value unit test for the worked example (61.75 → 62, Developing
      Bankability).
- [ ] Write unit tests for each readiness-band boundary.
- [ ] Write a unit test confirming the seeded demo enterprises land in their intended
      bands.

## Phase 4 — Critical gates & evidence

- [ ] Implement gate-result capture and the overall-status derivation logic per
      `11_CRITICAL_GATES.md`.
- [ ] Implement evidence-level capture per question/dimension.
- [ ] Unit test the three overall-status branches (Ready / Further preparation required
      / Not currently bankable).

## Phase 5 — Recommendation & financing pathway engines

- [ ] Implement the dimension-ranking + recommendation-selection logic per
      `12_RECOMMENDATION_ENGINE.md`.
- [ ] Implement the band-based + gap-boosted financing pathway selection logic per
      `13_FINANCING_PATHWAYS.md`.
- [ ] Unit test both against known dimension-score fixtures.

## Phase 6 — REST API & auth

- [ ] Implement every endpoint listed in `06_API_ARCHITECTURE.md`.
- [ ] Implement JWT auth (`djangorestframework-simplejwt`) for internal users.
- [ ] Implement `IsInternalUser` / `IsResearcherOrAdmin` permission classes; apply to the
      correct endpoints per the access matrix in `18_DATA_PRIVACY.md`.
- [ ] Wire up `drf-spectacular`; confirm `/api/schema/` and `/api/docs/` work.
- [ ] Confirm the `/research/dashboard/` response never includes `Enterprise.name` or
      unbanded financial figures — add an explicit test for this.
- [ ] Write API tests for the full happy path (create enterprise → start assessment →
      submit responses → submit gates → submit → fetch results).

## Phase 7 — Frontend scaffold & PWA

- [ ] Implement the route structure from `07_FRONTEND_ARCHITECTURE.md`.
- [ ] Implement the typed API client in `lib/api/`.
- [ ] Implement the PWA manifest + service worker (installable, app-shell cached).
- [ ] Implement `lib/offline/` (IndexedDB draft store + sync queue).
- [ ] Implement the design tokens from `23_UI_UX_GUIDELINES.md` in Tailwind config.

## Phase 8 — Assessment wizard UI

- [ ] Build all 10 wizard steps per `14_ASSESSMENT_WORKFLOW.md`.
- [ ] Build the progress indicator ("Question N of 24" + stepper).
- [ ] Wire per-step validation (cannot advance with unanswered required fields).
- [ ] Wire offline-first save-then-sync behaviour.
- [ ] Wire the review & submit step, calling `POST /assessments/{id}/submit/`.

## Phase 9 — Results screen UI

- [ ] Build the score hero, dimension radar/bar chart, strengths, priority gaps, gate
      status list, action plan, financing pathway cards and certificate panel per
      `15_DASHBOARD_SPECIFICATION.md`.
- [ ] Confirm the displayed score is read from the API response, never recomputed
      client-side.
- [ ] Add the required disclaimer text verbatim per `18_DATA_PRIVACY.md`.

## Phase 10 — Executive / research dashboard UI

- [ ] Build the Agribusiness view.
- [ ] Build the Research/Lender aggregate view with the KPI cards and comparisons from
      `15_DASHBOARD_SPECIFICATION.md`.
- [ ] Add filters (value chain, province, readiness band, date range).
- [ ] Add the pilot-data caption.

## Phase 11 — Reporting

- [ ] Implement PDF generation (ReportLab) per `16_REPORTING_SPECIFICATION.md`.
- [ ] Implement CSV export with the documented column schema.
- [ ] Implement "Save on device" offline fallback.
- [ ] Wire the frontend Print/Save PDF, Export CSV, Save on Device buttons.

## Phase 12 — Feedback & research validation

- [ ] Build the pilot feedback form (`/feedback/[id]`) per `17_RESEARCH_VALIDATION.md`.
- [ ] Build internal expert-review and cognitive-pretest-note submission (can be a
      simple internal form or documented as Django-admin-only for v0.1 — note your
      choice under "Open questions" above if you take the admin-only route).

## Phase 13 — Privacy & audit

- [ ] Confirm every disclaimer from `18_DATA_PRIVACY.md` appears on every required
      screen and export.
- [ ] Confirm consent capture blocks assessment persistence until given.
- [ ] Confirm `AuditLog` entries are created for the actions listed in
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
