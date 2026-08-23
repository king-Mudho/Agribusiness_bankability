# 04 — Tech stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Web/mobile UI | Next.js 14+ (App Router) + TypeScript | Single responsive codebase |
| Styling | Tailwind CSS | Utility-first, matches `23_UI_UX_GUIDELINES.md` tokens |
| UI components | shadcn/ui | Own the component source, don't lock into a heavy framework |
| Charts | Recharts | Radar/spider dimension chart, bar charts, donut/gauge score |
| PWA / offline | `next-pwa` (or equivalent service-worker setup) + IndexedDB (`idb`) | Local draft storage, background sync |
| Data fetching / cache | TanStack Query | Server-state cache for API calls |
| Client state | Zustand (or React Context) | Wizard-in-progress state |
| Forms | React Hook Form + Zod | Validation matching backend serializers |
| API framework | Django 5.x + Django REST Framework | Python 3.12+ |
| Auth | JWT via `djangorestframework-simplejwt` | Internal roles only in v0.1 (see `02`) |
| Database | PostgreSQL 15+ | |
| Filtering | `django-filter` | Aggregate dashboard queries |
| API docs | `drf-spectacular` (OpenAPI) | Served at `/api/schema/` and `/api/docs/` |
| Async tasks | Celery + Redis | **Deferred** — only add if a v0.1 feature genuinely needs a background job; do not scaffold pre-emptively |
| PDF generation | ReportLab | One-page respondent report |
| Backend tests | pytest + pytest-django | Scoring engine must have exact-value unit tests |
| E2E tests | Playwright | Full wizard → results flow, offline scenario |
| Reverse proxy | Nginx | |
| HTTPS | Let's Encrypt / Certbot | |
| Hosting | Linux VPS | |
| Package manager (frontend) | pnpm (or npm — pick one and stay consistent) | |
| Package manager (backend) | pip + `venv`, `requirements/` split by environment | |

## Version pinning

Pin major versions in `package.json` / `requirements/*.txt` at scaffold time (Phase 0 of
`25_AGENT_EXECUTION_PLAN.md`) and record the exact versions used in `README.md`. Do not
silently upgrade a dependency mid-build.

## What NOT to add in v0.1

- No Celery/Redis unless a specific task requires async processing.
- No GraphQL — REST only, per `06_API_ARCHITECTURE.md`.
- No separate microservices — the scoring/recommendation/financing "engines" are Django
  apps inside the single `backend/` service, not separate deployables.
- No native mobile SDKs.
