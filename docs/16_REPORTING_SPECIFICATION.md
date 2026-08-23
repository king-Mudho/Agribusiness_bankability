# 16 — Reporting specification

Lives in `backend/apps/reports/`. Two export types for v0.1: a one-page PDF respondent
report and a CSV export of the structured assessment data.

## One-page PDF report

Generated server-side with ReportLab, triggered by `POST /api/v1/reports/` (`report_type:
"PDF"`), downloadable via `GET /api/v1/reports/{id}/download/`.

Content, one page:

```
AGRIBUSINESS BANKABILITY INDEX
ABI DEMO — VERSION 0.1

Enterprise: <name / anonymous code per privacy rules>
Assessment date: <date>

ABI SCORE
<score> / 100

READINESS
<band label>

DIMENSION PROFILE
<six dimensions with scores, small bar or table>

Strengths
<top 2–3 dimensions>

Priority gaps
<bottom 2–3 dimensions>

Critical gates
<pass/caution/not-met per gate>

Recommended actions
<prioritised recommendation list>

Potential financing pathways
<3–5 suggested pathways>

Research disclaimer
<full disclaimer text from 18_DATA_PRIVACY.md>
```

Keep layout to a single A4/Letter page — trim recommendation/pathway lists to the top
items if needed to fit.

## CSV export

One row per assessment with flattened columns: enterprise fields (privacy-safe subset),
framework version, all 24 question scores, 6 dimension scores, ABI total, readiness
band, 5 gate results, evidence coverage percentage. Column headers must be stable and
documented (list them literally in the CSV serializer so downstream research tooling can
rely on the schema).

## Save on device (offline)

When offline, "Save on device" triggers a client-side PDF/CSV generation fallback (or, at
minimum, saves the results JSON payload to the device) so a respondent at the show never
leaves empty-handed even without connectivity; sync and re-generate the authoritative
server-side report once back online.

## Access control

Report generation for a given assessment is available to whoever holds that assessment's
id/link (public respondent flow) or any internal user — never expose another
enterprise's report by guessing sequential ids; use non-sequential identifiers
(UUIDs) for `Assessment.id` and `Report.id`.
