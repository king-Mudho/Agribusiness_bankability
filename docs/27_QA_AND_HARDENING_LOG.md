# 27 — QA and hardening log

This log records the end-to-end QA, bug-fixing and UI/UX hardening pass performed on top
of the "complete" build from `25_AGENT_EXECUTION_PLAN.md`. Every issue found is logged
here before or as it is fixed, per `AGENTS.md`. Nothing is fixed off the record.

Date started: 2026-08-24.

## Automated test failures

1. **`e2e/happy-path.spec.ts` flaky on a cold dev server.** `await expect(page).toHaveURL(/\/assessment\/local-/)`
   right after `page.goto("/assessment/new")` used the default 5s `expect` timeout. On a
   freshly started `next dev` server (i.e. exactly the "fresh checkout" scenario this QA
   pass is meant to verify), `/assessment/new` and `/assessment/[id]` are compiled
   on-demand on their first hit, which can take longer than 5s and made the test fail
   with `Received string: "http://localhost:3000/assessment/new"` even though the redirect
   logic itself (`app/assessment/new/page.tsx` → `router.replace`) is correct — confirmed
   by manually loading the page (redirected fine) and by re-running the same test once the
   route was warm (passed). Every other cross-navigation assertion in the same spec already
   used an explicit `{ timeout: 15000 }` for this exact reason; this one line didn't.
   Backend/frontend/lint/typecheck/build were otherwise fully green on first run — see
   "Fixed" below.

2. **Same cold-compile flake also present in `e2e/offline-scenario.spec.ts`,
   missed in the first pass.** Its very first assertion (`goto("/assessment/new")`
   then `toHaveURL(/\/assessment\/local-/)`) had the identical unguarded default
   5s timeout as the happy-path spec's. Caught during the Step 7 regression
   re-run, when a fresh dev-server restart made both specs cold again and
   `happy-path.spec.ts` failed even at its already-fixed 15s timeout (this
   machine was under heavy load at the time -- `next dev` itself took 40.7s to
   report "Ready" per its own log, and a plain `curl` of an already-compiled
   page took ~10s -- so 15s wasn't always enough headroom). Bumped both specs'
   timeout to 20s and re-verified twice in a row after letting the server
   settle (15.1s/15.5s and 22.4s/14.9s runs, both fully green) -- see "Fixed".

## Manual bugs found

1. **CRITICAL — `GET /api/v1/enterprises/` (list) was publicly readable, no auth
   required.** `apps/enterprises/views.py`'s `EnterpriseViewSet` used
   `permission_classes = [AllowAny]` for the whole viewset, including
   `ListModelMixin`. Confirmed live: an unauthenticated `curl` against
   `http://localhost:8000/api/v1/enterprises/` returned every enterprise ever
   created in the dev DB (23 of them) with full `name`, exact
   `finance_required_amount`, `turnover_band`, `district`, `consent_timestamp`,
   etc. — a direct violation of `18_DATA_PRIVACY.md` ("must never expose
   Enterprise.name or unbanded financial figures... to other people") and of
   `06_API_ARCHITECTURE.md`'s "must not leak other enterprises' data" rule.
   `create`/`retrieve`/`update` are correctly `AllowAny` (a public respondent's
   own read/write is scoped to their own id/link), so only `list` needed
   locking down. Frontend never calls the list endpoint (confirmed via grep of
   `lib/api/endpoints.ts`), so nothing in the app depended on it being public.

2. **`/reports/[id]` was an unimplemented placeholder stub**, despite
   `25_AGENT_EXECUTION_PLAN.md` marking Phase 11 ("Reporting") complete and
   `07_FRONTEND_ARCHITECTURE.md` documenting the route as "Report preview,
   PDF/CSV download". The entire page body was literally
   `<main className="p-8">Report preview for {id} -- built in Phase 11.</main>`
   -- no score, no certificate, no download buttons, no disclaimer. The
   underlying PDF/CSV/Save-on-Device functionality itself was real and working
   (via the `ReportActions` component already used on the results screen), it
   was just never wired into its own documented route. Found by navigating
   directly to `/reports/[id]` during the manual crawl -- not caught by any
   automated test because nothing asserted on that route's content.

3. **Hydration mismatch for any returning signed-in internal user on
   `/dashboard` (Research/Lender view) and `/admin`.** `hooks/useAuth.ts`'s Zustand
   store computed its initial `isAuthenticated` by reading `localStorage`
   synchronously at store-creation time: `typeof window !== "undefined" ? !!getAccessToken() : false`.
   On the server this is always `false` (no `window`); on the client, once a user
   has ever signed in, the store's very first client evaluation reads `true`
   from `localStorage` -- before React's hydration pass even starts -- so the
   first client render disagrees with the server-rendered HTML (login form vs.
   authenticated content) and React throws a hydration-failed error. Reproduced
   live: signed in as `researcher_demo`, then did a hard reload of `/admin` --
   console showed `Uncaught Error: Hydration failed because the server
   rendered HTML didn't match the client`. This would hit any analyst/
   researcher/admin doing a normal page refresh on the dashboard or admin
   screen during the pilot, not just a one-off.

4. **`LoginForm`'s helper text was hardcoded to describe the aggregate
   dashboard, even when reused on `/admin`.** The shared `LoginForm` component
   always read "The Research/Lender aggregate view requires an Analyst,
   Researcher or Admin account.", including on `/admin` (expert review,
   pretest notes, framework versions) where that description doesn't match
   what the page actually is. Minor copy-accuracy issue, not a functional bug.

## UI/UX issues found

1. **Raw enum codes shown instead of human-readable labels.** The results screen's
   "Firm profile" panel (`components/results/ResultsView.tsx`) showed
   `enterprise.value_chain` / `enterprise.province` /
   `enterprise.profile?.finance_type_sought` verbatim (e.g. "GRAIN",
   "MASHONALAND_CENTRAL", "WORKING_CAPITAL") even though a human-readable label
   list already exists in `config/enterpriseChoices.ts` and is used by the intake
   form's `<select>` options — it just wasn't reused for display. Same issue in
   `components/dashboard/ResearchLenderView.tsx`'s "By value chain", "By province"
   and "Financing needs breakdown" panels on the Research/Lender dashboard.

2. **Dimension radar chart clips a label off-screen on a 375px mobile viewport.**
   `DimensionRadarChart.tsx` used `outerRadius="62%"` with no margin, sized inside
   a `h-72 w-full` container. On the results screen at 375px width, the SVG
   plot area itself stayed within bounds (measured 309px wide, x: 33-342), but
   the "Governance and Management" axis label text (the longest dimension
   name) rendered from x=269 to x=403 -- 28px past the 375px viewport edge and
   61px past the chart's own container -- because SVG text has no implicit
   clipping/wrapping and Recharts positions `PolarAngleAxis` labels by radius
   from center, not by available box width. Confirmed by measuring every tick
   label's bounding rect via injected JS (not visible via screenshot in this
   environment) -- `document.documentElement.scrollWidth` stayed 375 the whole
   time (no page-level horizontal scroll was triggered), so this would have
   silently cut off part of a dimension name for a real mobile user with no
   visual indication anything was missing.

3. **Consent checkbox touch target is 24x24px, below the documented ~44px minimum.**
   `components/ui/Checkbox.tsx` (shared component; the consent-gate checkbox on the
   wizard's Consent step is its main use) rendered `RadixCheckbox.Root` at a fixed
   `h-6 w-6` (24px) with no hit-area padding. `docs/23_UI_UX_GUIDELINES.md`
   explicitly requires "Minimum touch target ~44px on mobile controls", and this
   is the control gating whether a respondent can even proceed past consent on
   the show-floor wizard. Measured live at 375px width: `getBoundingClientRect()`
   on the checkbox returned `{w: 24, h: 24}`.

4. **`PilotFeedbackForm` had no error/retry state for its framework fetch, and
   wasn't wrapped in a `<main>` landmark** like every other top-level screen in
   the app. If `GET /frameworks/{version}/` failed, the form would just render
   with the dimension dropdown silently empty instead of a clear error and a
   way to retry.

## Fixed

1. **`frontend/e2e/happy-path.spec.ts`** — added an explicit `{ timeout: 15000 }` to the
   `toHaveURL(/\/assessment\/local-/)` assertion right after `goto("/assessment/new")`, to
   match the timeout already used on every other cross-navigation assertion in the same
   spec. Verified against a genuinely cold `next dev` server (fresh `.next` cache, process
   killed and restarted) — test now passes in ~22s on cold compile and ~10s once warm; full
   Playwright suite (happy-path + offline) passes twice in a row after the fix.
   **Update (Step 7 regression pass):** the identical unguarded default-timeout bug was
   found in `e2e/offline-scenario.spec.ts` too (missed in the first pass), and 15s proved
   marginal under real machine load. Fixed the same way in both specs, timeout raised to
   20s; re-verified with two consecutive full-suite runs after the dev server settled.

### Automated sweep summary (Step 3), first pass

- Backend `pytest`: 57/57 passed, no code changes needed.
- Frontend `vitest`: 4/4 passed, no code changes needed.
- ESLint (`eslint .`): 0 errors/warnings.
- TypeScript (`tsc --noEmit`): 0 errors.
- `next build` (production): succeeds, all 10 documented routes present in the route
  manifest.
- `python manage.py check --deploy` against dev settings: only expected dev-mode
  warnings (DEBUG=True, insecure dev SECRET_KEY, no HSTS/SSL redirect) — all addressed by
  `config/settings/prod.py` (`DEBUG=False`, `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`,
  `CSRF_COOKIE_SECURE`, HSTS, and a hard `RuntimeError` if `DJANGO_SECRET_KEY` isn't set).
  No backend lint/type-checker (flake8/ruff/mypy) is configured in
  `requirements/dev.txt` — nothing to run for that half of step 3.4; noted under "Known
  issues" as a possible v0.2 addition, not something this pass should introduce
  mid-hardening.
- Migrations: applied cleanly on a brand-new `abi_qa_fresh` Postgres database (all 16 apps,
  0 errors); `seed_abi_v01` ran cleanly on that same fresh DB and is idempotent (ran twice,
  no error). Verified `Zvemuchando` → 68.00 / `finance_ready_conditions` (Finance Ready
  with Conditions) and `Maundurahuku` → 58.00 / `developing_bankability` (Developing
  Bankability), matching the target bands in `24_SEED_DATA.md`. Temp database dropped
  after verification.
- Playwright E2E: 1 failure found and fixed (see above); both scenarios green after the
  fix, confirmed on both a cold and warm dev server.

2. **`GET /api/v1/enterprises/` privacy leak (see "Manual bugs found" #1).** Added
   `IsAdminRole` to `backend/api/permissions.py` (mirrors the existing
   `CanViewAggregateDashboard` pattern) and overrode `get_permissions()` in
   `EnterpriseViewSet` so only the `list` action requires it — `create`,
   `retrieve` and `update` stay `AllowAny` exactly as before, matching the
   public-respondent-reads-own-record-by-id design used everywhere else in the
   API. Verified live: unauthenticated list now returns `401`, an
   authenticated non-admin (Analyst) gets `403`, Admin gets `200`, and
   retrieve-by-id/create for an anonymous caller are unaffected (`200`/`201`).
   Added `test_enterprise_list_is_not_publicly_readable` to
   `backend/tests/test_privacy_and_audit.py` covering all four cases so this
   can't regress silently.

3. **Raw enum codes on results screen and dashboard (see UI/UX issues #1).** Added
   `enterpriseChoiceLabel()` to `frontend/config/enterpriseChoices.ts` (a lookup
   over the existing choice lists, falling back to the raw value for anything not
   in that fixed field-choice set) and used it in `ResultsView.tsx`'s firm-profile
   panel and `ResearchLenderView.tsx`'s value-chain/province/financing-needs
   panels. Verified live: the results screen for the Maundurahuku demo firm now
   shows "Grain", "Mashonaland Central", "Working capital" instead of the raw
   enum codes. `tsc --noEmit` and `eslint .` stayed clean.

4. **`/reports/[id]` placeholder stub (see "Manual bugs found" #2).** Built
   `frontend/components/reports/ReportPreview.tsx`: score gauge + readiness
   band, firm profile (using the same `enterpriseChoiceLabel` humanisation as
   the results screen), the `CertificatePanel`, the real `ReportActions`
   (Print/Save PDF, Export CSV, Save on Device -- unchanged, reused as-is), a
   link back to the full results screen, and the verbatim research disclaimer.
   Wired real loading and error+retry states (was previously just a static
   string with no states at all). Updated `app/reports/[id]/page.tsx` to
   render it. Verified live: score, band, certificate and disclaimer all match
   what `/results/[id]` shows for the same assessment, and PDF/CSV/Save on
   Device all fire real network requests as before. `tsc --noEmit` and
   `eslint .` stayed clean.

5. **Hydration mismatch on `/dashboard` and `/admin` (see "Manual bugs found" #3).**
   `hooks/useAuth.ts`: the Zustand store's `isAuthenticated` now always starts
   `false` (matching what the server renders), and a new `useAuth()` wrapper
   function syncs the real value from `localStorage` in a `useEffect` --
   which only runs after hydration completes, so it never disagrees with the
   server-rendered HTML. Verified in a clean browser tab (no residual console
   history): signed in as `researcher_demo`, then did a hard reload of
   `/admin` -- zero console errors, authenticated content rendered
   immediately with no flash back to the login form.

6. **`LoginForm` hardcoded copy (see "Manual bugs found" #4).** Added an
   optional `description` prop to `components/dashboard/LoginForm.tsx`
   (default unchanged, matching its original dashboard copy), and passed a
   description accurate to `/admin`'s actual contents from
   `app/admin/page.tsx`. Verified live.

7. **`PilotFeedbackForm` missing error state and landmark (see "UI/UX issues
   found" #2).** Added an explicit `frameworkQuery.isError` branch with a
   "Retry" button (matching the pattern used in `WizardShell.tsx` /
   `ResultsView.tsx` / `ReportPreview.tsx`), and wrapped the form in `<main>`
   for landmark consistency with every other top-level screen. `tsc --noEmit`
   and `eslint .` stayed clean; verified live that the form still renders and
   submits correctly.

8. **Radar chart mobile label clipping (see "Manual bugs found" #2).**
   `components/charts/DimensionRadarChart.tsx`: reduced `outerRadius` from
   `62%` to `42%` and added an explicit `margin={{ top: 24, right: 56, bottom:
   24, left: 56 }}` to the `RadarChart`, giving the polar-angle-axis labels
   enough inset to fit inside both the card and the viewport. Verified by
   measuring every axis-label tick's bounding rect at 375px width before and
   after: "Governance and Management" went from `right: 403` (28px past the
   375px viewport) to `right: 364` (11px of margin); re-checked the whole page
   for any element right/left edge outside the viewport at both 375px and
   desktop width -- zero after the fix (was non-zero before, on mobile only).
   `tsc --noEmit` and `eslint .` stayed clean.

9. **Consent checkbox touch target (see "UI/UX issues found" #3).**
   `components/ui/Checkbox.tsx`: `RadixCheckbox.Root` is now the ~44px tappable
   hit area (`h-11 w-11` with a negative margin so it doesn't push surrounding
   layout), with a smaller `h-6 w-6` visually-styled `<span>` centred inside it
   for the checkbox's compact appearance -- checked-state styling moved to that
   inner span via a Tailwind `group-data-[state=checked]:` selector keyed off
   the Root. Verified live at 375px width: hit area now measures `{w: 44, h:
   44}`; clicking still toggles `data-state` correctly, checked-state styling
   (`background-color: rgb(14, 59, 46)`, the header/accent green) still
   applies, and the Consent step's "Continue" button still enables/disables
   correctly. `tsc --noEmit` and `eslint .` stayed clean.

## Known issues / needs human input

1. **`/demo` sponsor copy names the dimensions differently from
   `09_ABI_FRAMEWORK.md`.** The "Get your preliminary ABI assessment" paragraph on
   `/demo` (`frontend/app/demo/page.tsx`) correctly renders `22_DEMO_SCRIPT.md`'s
   sponsor copy verbatim: "...Market and Value-Chain Strength... Climate Resilience
   and Sustainability, Digital Readiness and Risk Management." But the canonical six
   dimension names in `09_ABI_FRAMEWORK.md` (and seeded into `FrameworkVersion 0.1`,
   and used everywhere else in the app — the wizard, results screen, dashboard) are
   `Market Strength`, `Climate Resilience` and `Digital Readiness`, with no
   "Value-Chain", "Sustainability" or "Risk Management" qualifiers. This is a
   pre-existing inconsistency between two source docs (`22_DEMO_SCRIPT.md` vs
   `09_ABI_FRAMEWORK.md`), not an implementation bug — the frontend is correctly
   reproducing the sponsor script it was told to reproduce verbatim
   (`AGENTS.md`: "Build `/demo` sponsor landing page with the GigaFood Africa copy
   from `22_DEMO_SCRIPT.md`"). Per `AGENTS.md` §3, this must not be silently
   resolved by editing either doc's wording — flagging here for a human call on
   which text is authoritative for the sponsor-facing marketing copy vs. the
   in-product dimension names.

2. **No backend lint/type-checker configured** (flake8/ruff/mypy all absent from
   `requirements/dev.txt`). Nothing to fix -- this pass didn't invent new
   backend tooling mid-hardening -- but worth a deliberate decision for v0.2.
