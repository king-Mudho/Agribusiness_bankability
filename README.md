# Agribusiness Bankability Index (ABI) — Demo Version 0.1

A research demonstration prototype for *"Developing and Validating the Agribusiness
Bankability Framework for Food Systems Transformation through Novel Financing Models in
Zimbabwe."* Sponsored for live demonstration by GigaFood Africa.

ABI gives an agribusiness enterprise an indicative "financing readiness" score (0–100)
from a 24-question guided assessment across six dimensions, flags five critical
bankability gates, and surfaces tailored recommendations and potential (never
"approved") financing pathways. It exists to demonstrate and pilot-test the underlying
research framework — not to make lending decisions. See `docs/00_PROJECT_MASTER.md` for
the full project identity and `docs/09_ABI_FRAMEWORK.md` for the methodology itself.

## Status

Built and QA-hardened. Backend (`pytest`), frontend (Vitest, ESLint, `tsc`) and E2E
(Playwright, happy-path + offline) suites are green; `docs/26_DEFINITION_OF_DONE.md` is
checked off except the two items that require a real deployed environment (HTTPS on the
live domain, the rollout checklist). See `docs/27_QA_AND_HARDENING_LOG.md` for the full
record of what was found and fixed during the hardening pass.

This is a research prototype, not a production lending or credit-decision system. All
scores, bands, gates and recommendations are provisional pending empirical validation.

## Quick start

Backend (Django + DRF, needs PostgreSQL — see `backend/README.md`):

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # macOS/Linux: source .venv/bin/activate
pip install -r requirements/dev.txt
cp .env.example .env                              # edit DATABASE_URL etc.
python manage.py migrate
python manage.py seed_abi_v01                      # FrameworkVersion 0.1 + demo enterprises
python manage.py runserver
```

Frontend (Next.js 15 + TypeScript, needs the backend running — see `frontend/README.md`):

```bash
cd frontend
npm install
cp .env.example .env                               # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
npm run dev
```

Then open `http://localhost:3000` — or `http://localhost:3000/demo` for the GigaFood
Africa sponsor landing page with one-click "Load Demo Firm" buttons for the two seeded
enterprises (Maundurahuku, Zvemuchando).

## Tests

```bash
cd backend  && pytest              # unit + API + privacy tests
cd frontend && npm run test        # Vitest component tests
cd frontend && npx playwright test # E2E: happy path + offline scenario (both dev servers running)
```

## Repository layout

```
agribusiness-bankability/
├── AGENTS.md
├── README.md
├── docs/
├── frontend/     # Next.js + TypeScript
└── backend/      # Django + Django REST Framework
```

## Documentation

- `AGENTS.md` — ground rules for anyone (human or agent) modifying this codebase; the
  methodology (dimensions, weights, questions, gates, bands, financing pathways) is
  fixed for v0.1 and lives in the database via `python manage.py seed_abi_v01`, never
  hardcoded in application code.
- `docs/INDEX.md` — full documentation index and reading order.
- `docs/27_QA_AND_HARDENING_LOG.md` — issues found and fixed during the QA pass, plus
  any open questions that need human input.

## Domain

`agribusinessbankability.com` — see `docs/21_ENVIRONMENT_CONFIGURATION.md`.
