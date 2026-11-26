# 07 — Frontend architecture

Next.js + TypeScript, App Router. The frontend **renders** the ABI methodology it fetches
from `/api/v1/frameworks/{version}/` — it does not hardcode dimensions, weights or
questions. It may show a live preview total while the user answers, clearly labelled as
"indicative, pending submission" — but the number shown after submission always comes
from `GET /assessments/{id}/results/`.

## Directory structure

```
frontend/
├── app/
│   ├── page.tsx                 # Public landing page
│   ├── demo/                    # Sponsor / show landing (GigaFood Africa branding)
│   ├── assessment/[id]/         # Guided wizard
│   ├── results/[id]/            # Results screen
│   ├── dashboard/                # Executive dashboard (agribusiness + research views)
│   ├── reports/[id]/            # Report preview / download
│   ├── feedback/[id]/           # Pilot feedback form
│   ├── admin/                   # Internal researcher/admin screens
│   └── api/                     # Next.js route handlers (e.g. auth cookie relay only)
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── assessment/               # Wizard steps, question cards, progress bar
│   ├── abi/                     # Score badge, readiness band pill, gate status chip
│   ├── dashboard/                 # Aggregate stat cards, filters
│   ├── reports/                  # Report preview components
│   ├── charts/                   # Recharts wrappers (radar, bar, donut)
│   └── forms/                    # Enterprise intake form, consent form
├── lib/
│   ├── api/                     # Typed fetch client for /api/v1
│   ├── auth/                    # JWT storage/refresh (internal users)
│   ├── offline/                 # IndexedDB draft store + sync queue
│   ├── validation/               # Zod schemas mirroring backend serializers
│   └── utils/
├── hooks/
├── types/                       # Shared TS types generated/mirrored from OpenAPI schema
├── config/                      # Env-driven constants (domain, API base URL)
├── public/                      # PWA manifest, icons
├── styles/
├── tests/
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## Routing → screens mapping

See `14_ASSESSMENT_WORKFLOW.md` for the 10-step wizard and `15_DASHBOARD_SPECIFICATION.md`
for dashboard layout. Route summary:

| Route | Screen |
|---|---|
| `/` | Public landing — "Start ABI Assessment" CTA, research prototype badge |
| `/demo` | Agricultural Show sponsor landing (GigaFood Africa branding, `22_DEMO_SCRIPT.md`) |
| `/assessment/[id]` | Wizard: enterprise → consent → 6 dimensions → evidence → gates → review |
| `/results/[id]` | Results screen |
| `/dashboard` | Executive dashboard (toggle: Agribusiness view / Research-Lender view) |
| `/reports/[id]` | Report preview, PDF/CSV download |
| `/feedback/[id]` | Pilot feedback form |
| `/admin` | **Admin portal** (sign-in; "Staff sign in" link on the landing page). Sidebar sections, shown by role (server enforces the same rules): Overview, Insights dashboard, Assessments (+ `/admin/assessments/[id]` full results), Enterprises, Reports & exports, Pilot feedback, Research tools, Framework (read-only), Audit log, Users (read-only). Admin sees all; Researcher: insights, research tools, framework; Analyst: insights, framework. Downloads: PDF report, Excel workbook, certificate PDF per assessment; Excel/CSV bulk exports. Account creation and framework edits still happen on the server/Django admin. |

## State management

- **Server state** (framework definition, assessment data, results): TanStack Query,
  keyed by assessment id, with cache invalidation on submit.
- **Wizard-in-progress state** (current step, unsaved answers): Zustand store, persisted
  to IndexedDB on every change so a page refresh or connectivity drop never loses
  answers.
- Forms via React Hook Form + Zod; Zod schemas mirror backend serializer constraints
  (kept in `lib/validation/`).

## Offline / PWA

- `next-pwa` (or equivalent) registers a service worker caching the app shell and the
  fetched framework definition.
- `lib/offline/` wraps IndexedDB (`idb`) with a `draftAssessment` store and a `syncQueue`.
- On each wizard step change, write to IndexedDB immediately; attempt a background sync
  via `PUT /assessments/{id}/responses/` whenever `navigator.onLine` is true; retry with
  backoff otherwise. Show a persistent "Saved offline — will sync" banner when offline.
- Never block the UI on network latency — optimistic local save first, sync in the
  background.

## Design tokens

Colour, typography and component patterns are defined in `23_UI_UX_GUIDELINES.md` and
implemented as Tailwind config + CSS variables — do not invent ad hoc colours in
components.
