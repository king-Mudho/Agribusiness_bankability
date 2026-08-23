# 18 — Data privacy & disclaimers

Financial information is being collected from real enterprises at a public event. Treat
privacy as a first-class requirement, not an afterthought.

## Required disclaimer text (use verbatim, do not paraphrase)

Shown on the consent step, the results screen, the certificate panel, the PDF report,
and any exported data:

> **Research prototype**: This assessment demonstrates how a validated Agribusiness
> Bankability Index (ABI) could assess financing readiness. Current weights, score bands,
> certificates and recommendations are provisional and must be validated empirically
> before use as a formal credit or investment decision tool.

Certificate-panel footer specifically:

> Prototype certificate for research demonstration only. Not a credit rating, loan
> approval or investment guarantee.

Aggregate dashboard caption:

> This dashboard reflects pilot data collected during the research demonstration. It is
> not a national benchmark.

## Consent

- Explicit opt-in checkbox before any assessment data is persisted beyond a local draft.
- Record `consent_given` + `consent_timestamp` on `EnterpriseProfile`.
- Consent text explains: what is collected, that it is used for research and
  demonstration purposes, that results are provisional, and who to contact with
  questions (use the demo contact from `00_PROJECT_MASTER.md` / `22_DEMO_SCRIPT.md`).

## Anonymisation

- `Enterprise.anonymous_respondent_code` is used on every aggregate/public-facing
  dashboard or export instead of `Enterprise.name`.
- The public/aggregate `Research/Lender` dashboard view (`15_DASHBOARD_SPECIFICATION.md`)
  must **never** expose: enterprise name, exact turnover figures, exact finance amounts
  tied to an identifiable enterprise, or any free-text note fields from an individual
  assessment. Only banded/aggregated figures.
- An individual enterprise's own results screen and PDF report may show its own name —
  privacy rules apply to *other* people's/enterprises' visibility, not self-visibility.

## Access control matrix

| Role | Can view own assessment | Can view other individual assessments | Can view aggregate dashboard | Can edit framework definitions |
|---|---|---|---|---|
| Public respondent | Yes (own, by id/link) | No | No | No |
| Data Collector | Yes (assessments they collected) | No | No | No |
| Analyst | No | No | Yes | No |
| Researcher | No | No | Yes | Yes (via Django admin) |
| Admin | Yes (all) | Yes (all) | Yes | Yes |

## Data protection basics

- HTTPS everywhere in deployment (`20_DEPLOYMENT_ARCHITECTURE.md`).
- Secrets (DB credentials, JWT signing key) only via environment variables, never
  committed — see `21_ENVIRONMENT_CONFIGURATION.md`.
- `AuditLog` records sensitive actions: assessment submission, report generation, gate
  overrides, framework version changes.
- Role-based permissions enforced server-side on every internal endpoint (never rely on
  the frontend hiding a button as the only protection).

## Language rules (repeat of `AGENTS.md` ground rule 2)

Never use "approved", "loan approval", "credit rating" or "guarantee" in product copy.
Always "indicative", "provisional", "potential financing pathway", "research prototype".
