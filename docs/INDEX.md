# Documentation index — ABI Demo Version 0.1

Read `AGENTS.md` at the repository root first. It defines the ground rules and the order
below is the required reading order for the Claude Code agent.

| # | File | What it covers |
|---|------|-----------------|
| 00 | `00_PROJECT_MASTER.md` | Project identity, sponsor, stakeholders, glossary, scope |
| 01 | `01_RESEARCH_CONTEXT.md` | Research purpose, framework versioning note, validation goals |
| 02 | `02_PRODUCT_REQUIREMENTS.md` | Functional & non-functional requirements, out-of-scope list |
| 03 | `03_SYSTEM_ARCHITECTURE.md` | High-level architecture, component diagram, repo layout |
| 04 | `04_TECH_STACK.md` | Frameworks, libraries, versions, package managers |
| 05 | `05_DATABASE_ARCHITECTURE.md` | Entities and field-level schema |
| 06 | `06_API_ARCHITECTURE.md` | REST endpoints, auth, conventions |
| 07 | `07_FRONTEND_ARCHITECTURE.md` | Next.js app structure, state, PWA/offline |
| 08 | `08_BACKEND_ARCHITECTURE.md` | Django app structure, settings, permissions |
| 09 | `09_ABI_FRAMEWORK.md` | The six dimensions, 24 questions, response scale |
| 10 | `10_SCORING_ENGINE.md` | Scoring algorithm, worked example, pseudocode |
| 11 | `11_CRITICAL_GATES.md` | The five bankability gates and their logic |
| 12 | `12_RECOMMENDATION_ENGINE.md` | Gap → recommendation mapping |
| 13 | `13_FINANCING_PATHWAYS.md` | The nine financing instruments and suitability |
| 14 | `14_ASSESSMENT_WORKFLOW.md` | Wizard screens, fields, validation |
| 15 | `15_DASHBOARD_SPECIFICATION.md` | Results screen and executive dashboard |
| 16 | `16_REPORTING_SPECIFICATION.md` | One-page PDF report and CSV export |
| 17 | `17_RESEARCH_VALIDATION.md` | Expert review, pretest, feedback capture |
| 18 | `18_DATA_PRIVACY.md` | Consent, anonymisation, disclaimers, access control |
| 19 | `19_TESTING_STRATEGY.md` | Unit, API, component, E2E test plan |
| 20 | `20_DEPLOYMENT_ARCHITECTURE.md` | Nginx, HTTPS, process management, backups |
| 21 | `21_ENVIRONMENT_CONFIGURATION.md` | `.env` variables for frontend and backend |
| 22 | `22_DEMO_SCRIPT.md` | Agricultural Show demo flow and sponsor branding |
| 23 | `23_UI_UX_GUIDELINES.md` | Colour, type, component patterns |
| 24 | `24_SEED_DATA.md` | Framework fixture and demo enterprises |
| 25 | `25_AGENT_EXECUTION_PLAN.md` | Phased, checkable build task list |
| 26 | `26_DEFINITION_OF_DONE.md` | Acceptance criteria |

## Production deployment (agribizframework.com)

Not part of the numbered build spec above — these describe the live
production deployment at `https://agribizframework.com`, which uses a
different domain than the rest of this documentation set (see
`PRODUCTION_ARCHITECTURE.md` § Domain note for why).

| File | What it covers |
|---|---|
| `PRODUCTION_ARCHITECTURE.md` | Final architecture, component diagram, rationale |
| `DEPLOYMENT.md` | Full deployment walkthrough: server, DNS, services, SSL, troubleshooting |
| `DEPLOYMENT_CHECKLIST.md` | Flat pre/post-deploy verification list |

See also `deploy/README.md` for the deployment scripts themselves.

## Reading order for humans

Start with `00`, `01`, `02` for context, then `09`–`13` for the actual ABI methodology,
then `25` for the build plan.

## Reading order for the Claude Code agent

Full sequential order above, then execute `25_AGENT_EXECUTION_PLAN.md`.
