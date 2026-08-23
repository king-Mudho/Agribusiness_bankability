# 03 — System architecture

## Top-level component view

```
┌──────────────────────────────────────────────────────────┐
│                     ABI FRONTEND                          │
│              Next.js + TypeScript (PWA)                   │
│                                                            │
│  Public Demo │ Assessment │ Dashboard │ Reports │ Admin    │
└─────────────────────────┬──────────────────────────────────┘
                           │  REST (JSON, /api/v1)
┌─────────────────────────▼──────────────────────────────────┐
│                     ABI BACKEND                            │
│              Django + Django REST Framework                │
│                                                              │
│ ┌────────────┐ ┌─────────────┐ ┌──────────────────────────┐│
│ │ Assessment │ │ ABI Scoring │ │ Recommendation Engine     ││
│ │ Engine     │ │ Engine      │ │                           ││
│ └────────────┘ └─────────────┘ └──────────────────────────┘│
│ ┌────────────┐ ┌─────────────┐ ┌──────────────────────────┐│
│ │ Evidence   │ │ Critical    │ │ Financing Pathway Engine  ││
│ │ Engine     │ │ Gates       │ │                           ││
│ └────────────┘ └─────────────┘ └──────────────────────────┘│
│ ┌────────────┐ ┌─────────────┐ ┌──────────────────────────┐│
│ │ Reporting  │ │ Feedback    │ │ Research / Validation     ││
│ │ Engine     │ │ Engine      │ │ Engine                    ││
│ └────────────┘ └─────────────┘ └──────────────────────────┘│
└─────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  PostgreSQL   │
                   └───────────────┘
```

**Rule**: the frontend renders and collects input; the backend is the sole authority for
scoring, recommendations, gates, and financing pathways. The frontend may pre-validate
input shape but never re-derives the ABI score independently.

## Deployment topology

```
Domain: agribusinessbankability.com
        │
        ▼
   Nginx / HTTPS (Let's Encrypt)
        │
        ├──────────────► Next.js frontend (build + serve)
        │
        └──────────────► Django REST API (Gunicorn/Uvicorn)
                               │
                               ▼
                          PostgreSQL
```

See `20_DEPLOYMENT_ARCHITECTURE.md` for process-level detail.

## Offline / PWA architecture

```
             Smartphone / tablet / laptop
                        │
                        ▼
                 Next.js PWA (service worker)
                        │
              ┌─────────┴─────────┐
              │                   │
            Online              Offline
              │                   │
              ▼                   ▼
         Django API           IndexedDB
              │              (pending draft
              │               assessment)
              │                   │
              └─────────┬─────────┘
                         │
                     Sync later
                         │
                         ▼
                    PostgreSQL
```

## Repository layout

Exactly two application folders at the top level:

```
agribusiness-bankability/
├── AGENTS.md
├── README.md
├── docs/
├── frontend/          # see 07_FRONTEND_ARCHITECTURE.md
└── backend/           # see 08_BACKEND_ARCHITECTURE.md
```

No `mobile/`, no standalone `api/` repo, no separate scoring service, no separate admin
project. Everything lives inside these two folders.

## Core architectural decision: versioned scoring engine

The ABI formula, dimensions, questions, weights, thresholds, gates and recommendation
logic are **data**, stored per `FrameworkVersion`, not application code. This lets the
research team iterate (v0.1 → v0.2 → v1.0) without destroying historical results or
requiring a redeploy for every methodology tweak. See `05_DATABASE_ARCHITECTURE.md` and
`10_SCORING_ENGINE.md`.

## Conceptual data flow

```
ENTERPRISE → PROFILE + CONSENT → 24 ABI QUESTIONS → EVIDENCE CAPTURE
   → CRITICAL GATES → SCORING ENGINE → ABI (0–100)
   → READINESS BAND + STRENGTHS + GAPS
   → RECOMMENDATION ENGINE → FINANCING PATHWAYS
   → RESPONDENT REPORT → PILOT FEEDBACK → RESEARCH VALIDATION → v0.2
```
