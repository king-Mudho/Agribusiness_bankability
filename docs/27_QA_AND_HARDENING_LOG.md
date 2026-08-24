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

## UI/UX issues found

*(populated during the UI/UX pass)*

## Fixed

1. **`frontend/e2e/happy-path.spec.ts`** — added an explicit `{ timeout: 15000 }` to the
   `toHaveURL(/\/assessment\/local-/)` assertion right after `goto("/assessment/new")`, to
   match the timeout already used on every other cross-navigation assertion in the same
   spec. Verified against a genuinely cold `next dev` server (fresh `.next` cache, process
   killed and restarted) — test now passes in ~22s on cold compile and ~10s once warm; full
   Playwright suite (happy-path + offline) passes twice in a row after the fix.

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

## Known issues / needs human input

*(anything that cannot be resolved autonomously)*
