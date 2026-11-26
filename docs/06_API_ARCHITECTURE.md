# 06 — API architecture

Base path: `/api/v1/`. JSON only. All authenticated internal endpoints use JWT bearer
tokens (`Authorization: Bearer <token>`). Public respondent flows (enterprise intake,
assessment submission, results retrieval by assessment id/token) do not require login in
v0.1, but must be rate-limited and must not leak other enterprises' data.

## Conventions

- Versioned from day one: `/api/v1/...`.
- List endpoints support pagination (`?page=`, `?page_size=`) and filtering via
  `django-filter` (e.g. `?value_chain=Poultry&province=Harare`).
- Error format:
  ```json
  { "error": { "code": "string", "message": "human readable", "field_errors": {} } }
  ```
- All monetary/score values returned as numbers, not strings.
- OpenAPI schema auto-generated via `drf-spectacular` at `/api/schema/`, browsable docs
  at `/api/docs/`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/auth/token/` | Obtain JWT (internal users) |
| POST | `/api/v1/auth/token/refresh/` | Refresh JWT (the frontend client refreshes automatically on a 401) |
| GET | `/api/v1/auth/me/` | Signed-in user and role; drives which admin-portal sections the frontend shows |
| GET/POST | `/api/v1/enterprises/` | List / create enterprise profile |
| GET/PATCH | `/api/v1/enterprises/{id}/` | Retrieve / update one enterprise |
| GET | `/api/v1/frameworks/` | List framework versions |
| GET | `/api/v1/frameworks/{version}/` | Full framework definition: dimensions, questions, options, gates — used to render the wizard |
| POST | `/api/v1/assessments/` | Start a new assessment (enterprise + framework_version) |
| GET | `/api/v1/assessments/{id}/` | Retrieve assessment status/metadata |
| PUT | `/api/v1/assessments/{id}/responses/` | Bulk upsert question responses (supports offline-sync batch write) |
| PUT | `/api/v1/assessments/{id}/gates/` | Submit critical-gate results |
| PUT | `/api/v1/assessments/{id}/evidence/` | Submit evidence-level records |
| POST | `/api/v1/assessments/{id}/submit/` | Finalise assessment → triggers scoring engine |
| GET | `/api/v1/assessments/{id}/score/` | Authoritative ABI score + dimension breakdown |
| GET | `/api/v1/assessments/{id}/results/` | Full results payload: score, band, strengths, gaps, gates |
| GET | `/api/v1/assessments/{id}/recommendations/` | Recommended actions for this assessment |
| GET | `/api/v1/assessments/{id}/financing/` | Potential financing pathways for this assessment |
| POST | `/api/v1/assessments/{id}/feedback/` | Submit pilot feedback |
| GET/POST | `/api/v1/reports/` | Generate/list reports for an assessment. `report_type`: `PDF` (one-page report), `CSV`, `XLSX` (Excel workbook), `CERT` (certificate PDF) |
| GET | `/api/v1/reports/{id}/download/` | Download a generated report file |
| GET | `/api/v1/research/dashboard/` | Aggregate research/lender dashboard statistics (internal auth required) |
| POST | `/api/v1/research/expert-review/` | Submit an expert review record (internal auth required) |
| POST | `/api/v1/research/pretest-note/` | Submit a cognitive pretest observation (internal auth required) |
| GET | `/api/v1/admin/overview/` | Admin portal: headline counts, latest assessments, feedback summary (**Admin role**) |
| GET | `/api/v1/admin/assessments/` | Admin portal: every assessment, paginated; `q`, `status`, `value_chain`, `province`, `readiness_band`, `date_from`, `date_to` (**Admin**) |
| GET | `/api/v1/admin/enterprises/` | Admin portal: enterprises with profile, consent, latest ABI; `q` (**Admin**) |
| GET | `/api/v1/admin/reports/` | Admin portal: generated report files; `report_type`, `q` (**Admin**) |
| GET | `/api/v1/admin/feedback/` | Admin portal: pilot feedback (**Admin**) |
| GET | `/api/v1/admin/expert-reviews/`, `/admin/pretest-notes/` | Admin portal: submitted research records (**Admin**) |
| GET | `/api/v1/admin/audit-log/` | Admin portal: audit log; `action` (**Admin**) |
| GET | `/api/v1/admin/users/` | Admin portal: staff accounts and roles, read-only (**Admin**) |
| GET | `/api/v1/admin/export/{assessments\|enterprises\|feedback}/` | Bulk export, `file_type=csv\|xlsx` (`format` is reserved by DRF); assessments accept the list filters. Audit-logged (**Admin**) |

## Key payload shapes

### `GET /api/v1/frameworks/{version}/`
```json
{
  "version_label": "0.1",
  "dimensions": [
    {
      "code": "financial_performance",
      "name": "Financial Performance",
      "weight_percent": 25,
      "questions": [
        { "code": "fin_01", "prompt": "...", "options": [
          { "scale_value": 1, "label": "Not at all", "score_value": 0 }
        ]}
      ]
    }
  ],
  "critical_gates": [ { "code": "legal_identity", "name": "...", "description": "..." } ],
  "readiness_bands": [ { "code": "investment_ready", "min": 80, "max": 100, "label": "Investment Ready" } ]
}
```

### `GET /api/v1/assessments/{id}/results/`
```json
{
  "abi_score": 62,
  "readiness_band": { "code": "developing_bankability", "label": "Developing Bankability" },
  "evidence_coverage_percent": 54,
  "dimension_scores": [
    { "dimension": "Financial Performance", "score": 60, "weight_percent": 25 }
  ],
  "strengths": ["Market Strength", "Governance and Management"],
  "priority_gaps": ["Digital Readiness", "Climate Resilience"],
  "critical_gates": [
    { "code": "legal_identity", "result": "PASS" },
    { "code": "source_of_repayment", "result": "CAUTION", "note": "..." }
  ],
  "recommendations": [ { "dimension": "Digital Readiness", "text": "..." } ],
  "financing_pathways": [ { "code": "warehouse_receipt_finance", "name": "...", "description": "..." } ],
  "disclaimer": "Prototype result for research demonstration only. Not a credit rating, loan approval or investment guarantee."
}
```

## Security

- Internal endpoints (`/research/*`, admin-only writes) require an internal role — see
  `18_DATA_PRIVACY.md` for the role/access matrix.
- Public assessment endpoints scope all reads/writes to the assessment id (and, where
  used, a short-lived access token), never returning another assessment's data.
- CORS restricted to the configured frontend origin(s) from `21_ENVIRONMENT_CONFIGURATION.md`.
