# 08 — Backend architecture

Django + Django REST Framework. Each "engine" described in `03_SYSTEM_ARCHITECTURE.md`
is a Django app inside the single `backend/` project — not a separate service.

## Directory structure

```
backend/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── accounts/          # User, Role, JWT auth
│   ├── enterprises/       # Enterprise, EnterpriseProfile
│   ├── frameworks/        # FrameworkVersion, Dimension, Question, ResponseOption, CriticalGateDefinition
│   ├── assessments/       # Assessment, AssessmentResponse, CriticalGateResult
│   ├── evidence/          # EvidenceRecord
│   ├── scoring/           # DimensionScore, ABIScore, scoring engine logic — see 10_SCORING_ENGINE.md
│   ├── recommendations/   # Recommendation, AssessmentRecommendation, mapping logic — see 12
│   ├── financing/         # FinancingPathwayDefinition, AssessmentFinancingPathway — see 13
│   ├── reports/           # Report, PDF/CSV generation — see 16
│   ├── feedback/          # PilotFeedback — see 17
│   ├── research/          # ExpertReview, CognitivePretestNote, aggregate dashboard queries
│   └── audit/             # AuditLog + signal handlers
├── api/
│   ├── urls.py            # Mounts each app's viewset routes under /api/v1/
│   └── permissions.py     # Role-based permission classes
├── tests/
├── manage.py
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
├── .env.example
└── README.md
```

## Settings split

`base.py` holds shared settings (installed apps, DRF config, JWT config, CORS). `dev.py`
enables debug, permissive CORS, console email backend. `prod.py` enforces
`DEBUG=False`, `ALLOWED_HOSTS` from env, secure cookies, HTTPS redirect. Select via
`DJANGO_SETTINGS_MODULE` env var — see `21_ENVIRONMENT_CONFIGURATION.md`.

## App responsibility notes

- `frameworks` owns everything a Claude Code agent must **not** hardcode elsewhere:
  dimensions, weights, questions, response options, gate definitions, readiness bands
  (readiness bands can live here too, as a small lookup table keyed by
  `framework_version`).
- `scoring` contains the actual calculation function described in
  `10_SCORING_ENGINE.md`, called from `assessments` on submit. Keep it a pure function
  (framework definition + responses → scores) so it is easy to unit test with the worked
  example.
- `recommendations` and `financing` both read the computed `DimensionScore`/`ABIScore`
  and framework-defined mapping tables (`Recommendation`, `FinancingPathwayDefinition`)
  — no hardcoded if/else chains of business text in Python; keep the *text* in the
  database and the *selection logic* (which rows to pick) in Python.
- `research` exposes the aggregate dashboard endpoint; it must never return
  enterprise-identifying fields — see `18_DATA_PRIVACY.md`.

## Permissions

Define DRF permission classes in `api/permissions.py`:
- `IsInternalUser` — any authenticated user with a `Role` other than none.
- `IsResearcherOrAdmin` — required for `/research/*` write endpoints and framework
  version management.
- Public assessment endpoints use `AllowAny` but scope every query to the specific
  `assessment_id` in the URL (never list all assessments to an anonymous caller).

## Serializer convention

One serializer per model for internal/admin use, plus purpose-built "read" serializers
for the results/dashboard payloads shown in `06_API_ARCHITECTURE.md` (these aggregate
across several models and should not be forced through a single model serializer).
