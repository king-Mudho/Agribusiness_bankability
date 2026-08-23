# ABI frontend

Next.js 15 (App Router) + TypeScript PWA for the Agribusiness Bankability Index (ABI)
Demo v0.1. Renders the ABI methodology it fetches from the backend at
`GET /api/v1/frameworks/{version}/` -- it never hardcodes a dimension, question or
weight, and never independently computes the authoritative ABI score. See the
repository root `AGENTS.md` and `docs/` for the full specification.

## Local development

```bash
npm install
cp .env.example .env    # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1 for local dev
npm run dev
```

Requires the backend running (see `../backend/README.md`) and seeded with
`python manage.py seed_abi_v01`.

## Tests

```bash
npm run test        # Vitest unit/component tests
npx playwright test # E2E: happy path + offline scenario (needs both dev servers running)
```

## Production build

```bash
npm run build
npm run start
```

The PWA service worker (`@ducanh2912/next-pwa`) is disabled in `next dev` and only
active in a production build -- test offline behaviour against `npm run build && npm run
start`, not the dev server.

## Deployment

`deploy/systemd/abi-frontend.service` runs the production server (`npm run start`) under
systemd -- never `next dev` in production. See `../backend/README.md` for the Nginx
config that fronts both this service and the backend, and
`docs/20_DEPLOYMENT_ARCHITECTURE.md` for the full topology.

## Environment variables

See `.env.example` and `docs/21_ENVIRONMENT_CONFIGURATION.md`.
